
import type { ChatSocket, SocketSession } from "../socket/socket.types.js";
import type { PrivateHistoryAck } from "../types/event.js";
import { getPrivateHistory } from "../db/message.repository.js";
import { findUserByUsername } from "../db/auth.repository.js";
import { isUsernameActive } from "../socket/active-users.js";

export function registerPrivateHistoryHandler(
    socket: ChatSocket,
    session: SocketSession
): void {
    socket.on("private-history", async (otherUsername, acknowledge) => {
        const respond = (result: PrivateHistoryAck): void => {
            if (typeof acknowledge === "function") {
                acknowledge(result);
            }
        };

        if (!session.username) {
            respond({ ok: false, message: "Authentication required." });
            return;
        }

        if (
            typeof otherUsername !== "string" ||
            !otherUsername.trim()
        ) {
            respond({ ok: false, message: "Invalid username." });
            return;
        }

        try {
            const recipient = await findUserByUsername(otherUsername.trim());

            if (
                !recipient ||
                !isUsernameActive(recipient.username)
            ) {
                respond({ ok: false, message: "That user is not online." });
                return;
            }

            const messages = await getPrivateHistory(
                session.username,
                recipient.username
            );

            respond({ ok: true, messages });
        } catch (error) {
            console.error("Failed to load private history:", error);
            respond({ ok: false, message: "Could not load private history." });
        }
    });
}
