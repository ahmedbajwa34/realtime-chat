import type { ChatServer, ChatSocket, SocketSession } from "../socket/socket.types.js";
import type { MessageAck, DeliveryAck } from "../types/event.js";
import { parseMessage } from "../schemas/message.schema.js";
import { saveMessage, markMessageDelivered } from "../db/message.repository.js";
import { findUserByUsername } from "../db/auth.repository.js";
import { createRateLimiter } from "../config/rate-limiter.js";

export function registerMessageHandler(
    io: ChatServer,
    socket: ChatSocket,
    session: SocketSession
): void {
    const allowMessage = createRateLimiter(10, 10_000);
    socket.on("message", async (data, acknowledge) => {
        function respond(result: MessageAck): void {
            if (typeof acknowledge === "function") acknowledge(result);
        }

        if (!session.username) {
            respond({ ok: false, error: "REGISTER_REQUIRED", message: "Register a username first." });
            return;
        }
        if (!allowMessage()) {
       respond({ ok: false, error: "RATE_LIMITED", message: "You are sending messages too fast." });
       return;
   }

        const msg = parseMessage(data); 
        if (!msg) {
            respond({ ok: false, error: "INVALID_MESSAGE", message: "The message payload is invalid." });
            return;
        }

        try {
            // ---------- private message ----------
            if (msg.to) {
                const recipient = await findUserByUsername(msg.to);
                if (!recipient) {
                    respond({ ok: false, error: "RECIPIENT_NOT_FOUND", message: "Recipient does not exist." });
                    return;
                }

               
                const saved = await saveMessage({
                    senderUsername: session.username,
                    recipientUsername: recipient.username,
                    roomName: null,
                    content: msg.text,
                    clientMsgId: msg.clientMsgId,
                });

         
                io.to(`user:${recipient.username}`).emit("message", {
                    id: saved.id,
                    from: session.username,
                    text: saved.content,
                    createdAt: saved.created_at,
                    private: true,
                });

                respond({
                    ok: true,
                    target: "private",
                    recipient: recipient.username,
                    id: saved.id,
                    createdAt: saved.created_at,
                    status: "sent",
                });
                return;
            }

            // ---------- room message ----------
            if (!session.currentRoom) {
                respond({ ok: false, error: "NOT_IN_ROOM", message: "Join a room before sending a room message." });
                return;
            }

            const room = session.currentRoom;

            const saved = await saveMessage({
                senderUsername: session.username,
                recipientUsername: null,
                roomName: room,
                content: msg.text,
                clientMsgId: msg.clientMsgId,
            });

            socket.to("room:" + room).emit("message", {
                id: saved.id,
                from: session.username,
                text: saved.content,
                createdAt: saved.created_at,
                room,
                private: false,
            });

            respond({ ok: true, target: "room", room, id: saved.id, createdAt: saved.created_at });
        } catch (error) {
            console.error("Failed to save chat message:", error);
            respond({
                ok: false,
                error: "DATABASE_ERROR",
                message: "Your message could not be saved. Please try again.",
            });
        }
    });

    socket.on("message-delivered", async (messageId, acknowledge) => {
        function respond(result: DeliveryAck): void {
            if (typeof acknowledge === "function") acknowledge(result);
        }

        if (!session.username || typeof messageId !== "string" || !/^[0-9]{1,18}$/.test(messageId)) {
            respond({ ok: false, error: "INVALID_MESSAGE_ID", message: "The message ID is invalid." });
            return;
        }

        try {
            const updated = await markMessageDelivered(messageId, session.username);

            // null = already delivered, or not yours. Either way: succeed quietly, notify nobody.
            if (updated) {
                io.to(`user:${updated.senderUsername}`).emit("message-status", {
                    id: updated.id,
                    status: "delivered",
                    deliveredAt: updated.deliveredAt,
                });
            }

            respond({ ok: true, messageId });
        } catch (error) {
            console.error("Failed to acknowledge message delivery:", error);
            respond({ ok: false, error: "MESSAGE_NOT_FOUND", message: "The message could not be acknowledged." });
        }
    });
}