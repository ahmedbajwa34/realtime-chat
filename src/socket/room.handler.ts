
import type { ChatSocket, SocketSession } from "../socket/socket.types.js";
import { getRoomHistory } from "../db/message.repository.js";

const ROOMS = ["general", "sports", "tech"];

export function registerRoomHandler(
    socket: ChatSocket,
    session: SocketSession
): void {
    socket.on("join-room", async (room) => {
        if (!session.username) {
            socket.emit("system", "Register a username first");
            return;
        }

        if (typeof room !== "string" || !ROOMS.includes(room)) {
            socket.emit("system", "That room does not exist");
            return;
        }

        if (session.currentRoom) {
            socket.leave("room:" + session.currentRoom);

            socket.to("room:" + session.currentRoom).emit(
                "system",
                `${session.username} left #${session.currentRoom}`
            );
        }

        session.currentRoom = room;
        socket.join("room:" + room);

        socket.emit("system", `You joined #${room}`);

        socket.to("room:" + room).emit(
            "system",
            `${session.username} joined #${room}`
        );

        try {
            const messages = await getRoomHistory(room);
            socket.emit("room-history", messages);
        } catch (error) {
            console.error("Failed to load room history:", error);
            socket.emit("system", "Could not load room history");
        }
    });
}
