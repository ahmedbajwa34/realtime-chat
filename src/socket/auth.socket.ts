

import type { Socket } from "socket.io";
import { parse } from "cookie";
import { authConfig } from "../config/auth.config.js";
import { verifyAccessToken } from "../services/token.service.js";

export function authenticateSocket(
    socket: Socket,
    next: (error?: Error) => void
): void {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parse(cookieHeader ?? "");

    const token = cookies[authConfig.accessToken.cookieName];

    if (!token) {
        next(new Error("Authentication required"));
        return;
    }

    try {
        const user = verifyAccessToken(token);

        socket.data.userId = user.userId;

        next();
    } catch {
        next(new Error("Invalid or expired access token"));
    }
}
