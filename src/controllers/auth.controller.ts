import {
    createAccessToken, createRefreshToken, verifyRefreshToken,
} from "../services/token.service.js";
import { authConfig } from "../config/auth.config.js";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema.js";
import { registerUser, loginUser } from "../services/auth.service.js";
import type{ Request, Response, NextFunction } from "express";



const baseCookie = {
    httpOnly: authConfig.cookie.httpOnly,
    secure: authConfig.cookie.secure,
    sameSite: authConfig.cookie.sameSite,
};

const accessCookieOpts = {
    ...baseCookie,
    path: "/",
    maxAge: authConfig.accessToken.maxAgeMs,
};
const refreshCookieOpts = {
    ...baseCookie,
    path: "/auth",
    maxAge: authConfig.refreshToken.maxAgeMs,
};

function clearSession(res: Response): void {
    res.clearCookie(authConfig.accessToken.cookieName, { ...baseCookie, path: "/" });
    res.clearCookie(authConfig.refreshToken.cookieName, { ...baseCookie, path: "/auth" });
}

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const input = RegisterSchema.parse(req.body);
        const user = await registerUser(input);

        res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
            },
        });
    } catch (error: unknown) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const input = LoginSchema.parse(req.body);
        const user = await loginUser(input);

        res.cookie(authConfig.accessToken.cookieName, 
            createAccessToken(user.id), 
            accessCookieOpts);
        res.cookie(authConfig.refreshToken.cookieName, 
            createRefreshToken(user.id), 
            refreshCookieOpts);

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id, username: user.username,
                email: user.email, created_at: user.created_at,
            },
        });
    } catch (error: unknown) {
        next(error);
    }
}

export function refresh(req: Request, res: Response): void 
{
    const token = req.cookies?.[authConfig.refreshToken.cookieName];
    if (!token) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    try {
        const { userId } = verifyRefreshToken(token);  

        res.cookie(authConfig.accessToken.cookieName, 
            createAccessToken(userId), 
            accessCookieOpts);
        res.status(200).json({ 
            message: "Refreshed" });
    } catch {
        clearSession(res);
        res.status(401).json({ 
            message: "Invalid or expired refresh token" });
    }
}

export function logout(_req: Request, res: Response): void {
    clearSession(res);
    res.status(200).json({ 
        message: "Logged out" });
}