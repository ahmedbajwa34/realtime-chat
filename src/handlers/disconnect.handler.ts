
import type { ChatServer, ChatSocket, SocketSession } from "../socket/socket.types.js";
import { releaseUsername } from "../socket/active-users.js";

export function registerDisconnectHandler(
    io: ChatServer,
    socket: ChatSocket,
    session: SocketSession
): void {
    socket.on("disconnect", () => {
        if (session.currentRoom) {
            io.to("room:" + session.currentRoom).emit(
                "system",
                `${session.username || socket.id} disconnected`
            );
        }

        if (session.username) {
            releaseUsername(session.username, socket.id);
        }

        console.log("Disconnected:", socket.id);
    });
}
