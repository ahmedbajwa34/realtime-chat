import type { ChatServer, ChatSocket, SocketSession } from "../socket/socket.types.js";
import { removeConnection } from "../socket/presence.socket.js";

export function registerDisconnectHandler(
    io: ChatServer,
    socket: ChatSocket,
    session: SocketSession
): void {
    socket.on("disconnect", () => {
        if (session.currentRoom) {
            socket.to("room:" + session.currentRoom).emit(
                "system",
                `${session.username || socket.id} left #${session.currentRoom}`
            );
        }

        if (session.username) {
           
            const wentOffline = removeConnection(session.username, socket.id);

            if (wentOffline) {
                io.emit("user-status", { username: session.username, status: "offline" });
            }
        }

        console.log("Disconnected:", socket.id);
    });
}