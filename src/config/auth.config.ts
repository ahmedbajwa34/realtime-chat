import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type Ttl = NonNullable<SignOptions["expiresIn"]>;

function getRequiredEnv(name: string, minLength = 1): string {
    const value = process.env[name];

    if (!value || value.length < minLength) {
        throw new Error(`${name} must be configured`);
    }

    return value;
}

function getSecret(name: string): string {
    return getRequiredEnv(name, 32);
}

const accessSecret = getSecret("ACCESS_TOKEN_SECRET");
const refreshSecret = getSecret("REFRESH_TOKEN_SECRET");

if (accessSecret === refreshSecret) {
    throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must differ");
}

export const authConfig = {
    accessToken: {
        secret: accessSecret,
        expiresIn: getRequiredEnv("ACCESS_TOKEN_TTL") as Ttl, 
        cookieName: "access_token",
    },
    refreshToken: {
        secret: refreshSecret,
        expiresIn: getRequiredEnv("REFRESH_TOKEN_TTL") as Ttl,
        cookieName: "refresh_token",
    },
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
    },
};