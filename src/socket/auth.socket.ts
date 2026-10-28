import type { Socket } from "socket.io";
import { parse } from "cookie";
import { authConfig } from "../config/auth.config.js";
import { verifyAccessToken } from "../services/token.service.js";
import { findUserById } from "../db/auth.repository.js";



export async function authenticateSocket(
    socket: Socket,
    next: (error?: Error) => void
): Promise<void>
 {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parse(cookieHeader ?? "");

    const token = cookies[authConfig.accessToken.cookieName];

    if (!token) {
        next(new Error("unauthorized"));
        return;
    }

    try {
        const { userId } = verifyAccessToken(token);

        const user = await findUserById(userId);
        if (!user) {
            next(new Error("unauthorized"));
            return;
        }

        socket.data.userId = user.id;
        socket.data.username = user.username.trim().toLowerCase();

        next();
    } catch {
        next(new Error("unauthorized"));
    }
}