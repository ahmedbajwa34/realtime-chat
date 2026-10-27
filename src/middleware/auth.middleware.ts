import type { Request, Response, NextFunction } from "express";
import { authConfig } from "../config/auth.config.js";
import { verifyAccessToken } from "../services/token.service.js";

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const token = req.cookies?.[authConfig.accessToken.cookieName];

    if (!token) {
        res.status(401).json({
            message: "Authentication required",
        });
        return;
    }

    try {
        const user = verifyAccessToken(token);

        req.auth = {
            userId: user.userId,
        };

        next();
    } catch {
        res.status(401).json({
            message: "Invalid or expired access token",
        });
    }
}