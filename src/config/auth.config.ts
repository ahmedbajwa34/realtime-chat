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

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

// Accepts only "30s", "15m", "12h", "3d". Rejects "900", "15 minutes", etc.
function getTtl(name: string): { value: Ttl; ms: number } {
    const raw = getRequiredEnv(name);
    const match = /^(\d+)([smhd])$/.exec(raw);

    if (!match) {
        throw new Error(`${name} must look like 15m, 12h or 3d (got "${raw}")`);
    }

    const amount = Number(match[1]);
    const unit = match[2] as keyof typeof UNIT_MS;

    if (amount <= 0) {
        throw new Error(`${name} must be greater than zero`);
    }

    return { value: raw as Ttl, ms: amount * UNIT_MS[unit] };
}

const accessSecret = getSecret("ACCESS_TOKEN_SECRET");
const refreshSecret = getSecret("REFRESH_TOKEN_SECRET");

if (accessSecret === refreshSecret) {
    throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must differ");
}

const accessTtl = getTtl("ACCESS_TOKEN_TTL");
const refreshTtl = getTtl("REFRESH_TOKEN_TTL");

export const authConfig = {
    accessToken: {
        secret: accessSecret,
        expiresIn: accessTtl.value,
        maxAgeMs: accessTtl.ms,
        cookieName: "access_token",
    },
    refreshToken: {
        secret: refreshSecret,
        expiresIn: refreshTtl.value,
        maxAgeMs: refreshTtl.ms,
        cookieName: "refresh_token",
    },
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
    },
};