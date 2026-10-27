
import type { ChatServer, ChatSocket, SocketSession } from "../socket/socket.types.js";

import type { MessageAck } from "../types/event.js";
import { parseMessage } from "../schemas/message.schema.js";
import { isUsernameActive } from "../socket/active-users.js";
import { saveMessage } from "../db/message.repository.js";
import { findUserByUsername } from "../db/auth.repository.js";


export function registerMessageHandler(
    io: ChatServer,
    socket: ChatSocket,
    session: SocketSession
): void {
    socket.on("message", async (data, acknowledge) => {
        function respond(result: MessageAck): void {
            if (typeof acknowledge === "function") {
                acknowledge(result);
            }
        }

        if (!session.username) {
            respond({
                ok: false,
                error: "REGISTER_REQUIRED",
                message: "Register a username first.",
            });
            return;
        }

        const msg = parseMessage(data);

        if (!msg) {
            respond({
                ok: false,
                error: "INVALID_MESSAGE",
                message: "The message payload is invalid.",
            });
            return;
        }

        try {
            if (msg.to) {
                
const recipient = await findUserByUsername(msg.to);

if (!recipient || !isUsernameActive(recipient.username)) {
    respond({
        ok: false,
        error: "RECIPIENT_NOT_FOUND",
        message: "That recipient is not currently online.",
    });
    return;
}

await saveMessage({
    senderUsername: session.username,
    recipientUsername: recipient.username,
    roomName: null,
    content: msg.text,
});

io.to(`user:${recipient.id}`).emit("message", {
    from: session.username,
    text: msg.text,
    private: true,
});

respond({
    ok: true,
    target: "private",
    recipient: recipient.username,
});

return;
            }

            if (!session.currentRoom) {
                respond({
                    ok: false,
                    error: "NOT_IN_ROOM",
                    message: "Join a room before sending a room message.",
                });
                return;
            }

            const room = session.currentRoom;

            await saveMessage({
                senderUsername: session.username,
                recipientUsername: null,
                roomName: room,
                content: msg.text,
            });

            socket.to("room:" + room).emit("message", {
                from: session.username,
                text: msg.text,
                room,
                private: false,
            });

            respond({
                ok: true,
                target: "room",
                room,
            });
        } catch (error) {
            console.error("Failed to save chat message:", error);

            respond({
                ok: false,
                error: "DATABASE_ERROR",
                message: "Your message could not be saved. Please try again.",
            });
        }
    });
}
