import "dotenv/config";
import { Pool } from "pg";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} must be configured`);
    }
    return value;
}

export const pool = new Pool({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT) || 5432,
    database: requireEnv("DB_NAME"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),

    max: 10,                         // max connections in the pool
    idleTimeoutMillis: 30_000,       // close idle connections after 30s
    connectionTimeoutMillis: 5_000,  // fail fast instead of hanging forever
    statement_timeout: 10_000,     

    ssl: process.env.DB_SSL === "false" ? { rejectUnauthorized: false } : undefined,
});


pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
});