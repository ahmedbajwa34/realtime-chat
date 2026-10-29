import type { ChatServer, SocketSession } from "./socket.types.js";
import { addConnection, getOnlineUsernames } from "./presence.socket.js";
import { registerRoomHandler } from "./room.handler.js";
import { registerMessageHandler } from "../handlers/message.handler.js";
import { registerDisconnectHandler } from "../handlers/disconnect.handler.js";
import { registerPrivateHistoryHandler } from "../handlers/private-history.handler.js";
import { getPendingPrivateMessages } from "../db/message.repository.js";

export function registerConnectionHandlers(io: ChatServer): void {
    io.on("connection", async (socket) => {
        const { userId, username } = socket.data;
        const session: SocketSession = { username, currentRoom: "" };


        
        const firstConnection = addConnection(username, socket.id);

        registerDisconnectHandler(io, socket, session);
        registerRoomHandler(socket, session);
        registerMessageHandler(io, socket, session);
        registerPrivateHistoryHandler(socket, session);

        try {
           await socket.join([`user:${username}`, `uid:${userId}`]);

            socket.emit("current-user", { id: userId, username });
            socket.emit("presence-snapshot", getOnlineUsernames());
            if (firstConnection) {
                socket.broadcast.emit("user-status", { username, status: "online" });
            }

            let afterId = "0";
            for (;;) {
                if (socket.disconnected) return;
                const batch = await getPendingPrivateMessages(username, afterId, 200);
                if (batch.length === 0) break;

                for (const m of batch) {
                    socket.emit("message", {
                        id: m.id,
                        from: m.sender_username,
                        text: m.content,
                        createdAt: m.created_at,
                        private: true,
                    });
                }
                afterId = batch[batch.length - 1]!.id;
            }
        } catch (error) {
            console.error("Socket initialization failed:", error);
            socket.disconnect(true);
        }
    });
}