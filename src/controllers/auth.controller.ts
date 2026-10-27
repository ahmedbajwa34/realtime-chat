
import type { Request, Response, NextFunction } from "express";
import { RegisterSchema, LoginSchema } from "../schemas/auth.schema.js";
import { registerUser, loginUser} from "../services/auth.service.js";
import { createAccessToken, createRefreshToken } from "../services/token.service.js";
import { authConfig } from "../config/auth.config.js";

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







export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const input = LoginSchema.parse(req.body);
        const user = await loginUser(input);

        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);

        const cookieOptions = {
            httpOnly: authConfig.cookie.httpOnly,
            secure: authConfig.cookie.secure,
            sameSite: authConfig.cookie.sameSite,
            path: authConfig.cookie.path,
        };

        res.cookie(
            authConfig.accessToken.cookieName,
            accessToken,
            cookieOptions
        );

        res.cookie(
            authConfig.refreshToken.cookieName,
            refreshToken,
            cookieOptions
        );

        res.status(200).json({
            message: "Login successful",
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


