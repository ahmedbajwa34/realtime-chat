
import type { ChatServer, SocketSession } from "./socket.types.js";
import { findUserById } from "../db/auth.repository.js";
import { claimUsername } from "./active-users.js";
import { registerRoomHandler } from "./room.handler.js";
import { registerMessageHandler } from "../handlers/message.handler.js";
import { registerDisconnectHandler } from "../handlers/disconnect.handler.js";
import { registerPrivateHistoryHandler } from "../handlers/private-history.handler.js";

export function registerConnectionHandlers(io: ChatServer): void {
    io.on("connection", async (socket) => {
        try {
            const user = await findUserById(socket.data.userId);

            if (!user) {
                socket.disconnect(true);
                return;
            }

            const claimed = claimUsername(user.username, socket.id);

            if (!claimed) {
                socket.emit("system", "This user is already connected");
                socket.disconnect(true);
                return;
            }

            const session: SocketSession = {
                username: user.username,
                currentRoom: "",
            };

            socket.emit("current-user", {
            id: user.id,
            username: user.username,
});

            socket.join(`user:${user.id}`);

            console.log(`Authenticated: ${user.username}`);

            registerRoomHandler(socket, session);
            registerMessageHandler(io, socket, session);
            registerDisconnectHandler(io, socket, session);
            registerPrivateHistoryHandler(socket, session);
        } catch (error) {
            console.error("Socket initialization failed:", error);
            socket.disconnect(true);
        }
    });
}
