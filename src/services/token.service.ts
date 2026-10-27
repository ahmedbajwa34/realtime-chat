


import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { authConfig } from "../config/auth.config.js";

const TOKEN_ISSUER = "realtime-chat-api";
const ACCESS_TOKEN_AUDIENCE = "realtime-chat-api";
const REFRESH_TOKEN_AUDIENCE = "realtime-chat-refresh";

export interface AuthenticatedUser {
    userId: string;
}

interface AccessTokenClaims extends JwtPayload {
    sub: string;
    type: "access";
}

interface RefreshTokenClaims extends JwtPayload {
    sub: string;
    type: "refresh";
}

export function createAccessToken(userId: string): string {
    const options: SignOptions = {
        subject: userId,
        expiresIn: authConfig.accessToken.expiresIn, 
        issuer: TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        algorithm: "HS256",
    };

    return jwt.sign({ type: "access" }, authConfig.accessToken.secret, options);
}

export function createRefreshToken(userId: string): string {
    const options: SignOptions = {
        subject: userId,
        expiresIn: authConfig.refreshToken.expiresIn, 
        issuer: TOKEN_ISSUER,
        audience: REFRESH_TOKEN_AUDIENCE,
        algorithm: "HS256",
    };

    return jwt.sign({ type: "refresh" }, authConfig.refreshToken.secret, options);
}

function isAccessTokenClaims(
    payload: string | JwtPayload
): payload is AccessTokenClaims {
    return (
        typeof payload !== "string" &&
        typeof payload.sub === "string" &&
        payload.sub.length > 0 &&
        payload.type === "access"
    );
}

function isRefreshTokenClaims(
    payload: string | JwtPayload
): payload is RefreshTokenClaims {
    return (
        typeof payload !== "string" &&
        typeof payload.sub === "string" &&
        payload.sub.length > 0 &&
        payload.type === "refresh"
    );
}

export function verifyAccessToken(
    token: string
): AuthenticatedUser {
    const payload = jwt.verify(
        token,
        authConfig.accessToken.secret,
        {
            issuer: TOKEN_ISSUER,
            audience: ACCESS_TOKEN_AUDIENCE,
            algorithms: ["HS256"],
        }
    );

    if (!isAccessTokenClaims(payload)) {
        throw new Error("Invalid access token claims");
    }

    return { userId: payload.sub };
}

export function verifyRefreshToken(
    token: string
): AuthenticatedUser {
    const payload = jwt.verify(
        token,
        authConfig.refreshToken.secret,
        {
            issuer: TOKEN_ISSUER,
            audience: REFRESH_TOKEN_AUDIENCE,
            algorithms: ["HS256"],
        }
    );

    if (!isRefreshTokenClaims(payload)) {
        throw new Error("Invalid refresh token claims");
    }

    return { userId: payload.sub };
}
