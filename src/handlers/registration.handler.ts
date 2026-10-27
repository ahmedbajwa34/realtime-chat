



import type { ChatSocket, SocketSession } from "../socket/socket.types.js";
import { parseName } from "../schemas/message.schema.js";
import { claimUsername } from "../socket/active-users.js";

export function registerRegistrationHandler(
    socket: ChatSocket,
    session: SocketSession
): void {
    socket.on("register", (name) => {
        // A socket can register only once.
        if (session.username) {
            socket.emit("system", "You are already registered");
            return;
        }

        const cleanName = parseName(name);

        if (!cleanName) {
            socket.emit("system", "Invalid username");
            return;
        }

        const claimed = claimUsername(cleanName, socket.id);

        if (!claimed) {
            socket.emit("system", "Username is already taken");
            return;
        }

        session.username = cleanName;

        const usernameKey = cleanName.trim().toLowerCase();
        socket.join("user:" + usernameKey);

        socket.emit("system", `Registered as ${session.username}`);
    });
}
