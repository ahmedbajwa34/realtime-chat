
import { pool } from "./db.js";

export interface CreateUserRecord {
    username: string;
    email: string;
    passwordHash: string;
}

export interface ChatUser {
    id: string;
    username: string;
    email: string;
    created_at: Date;
}


export interface AuthUser extends ChatUser {
    password_hash: string;
}


export async function createUser(
    user: CreateUserRecord
): Promise<ChatUser> {
    const result = await pool.query<ChatUser>(
        `INSERT INTO chat_users (
            username,
            email,
            password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at`,
        [
            user.username,
            user.email,
            user.passwordHash,
        ]
    );

    const createdUser = result.rows[0];

    if (!createdUser) {
        throw new Error("User creation returned no record");
    }

    return createdUser;
}




export async function findUserByEmail(
    email: string
): Promise<AuthUser | null> {
    const result = await pool.query<AuthUser>(
        `SELECT
            id,
            username,
            email,
            password_hash,
            created_at
         FROM chat_users
         WHERE email = $1
         LIMIT 1`,
        [email]
    );

    return result.rows[0] ?? null;
}


export async function findUserById(
    userId: string
): Promise<ChatUser | null> {
    const result = await pool.query<ChatUser>(
        `SELECT id, username, email, created_at
         FROM chat_users
         WHERE id = $1
         LIMIT 1`,
        [userId]
    );

    return result.rows[0] ?? null;
}


export async function findUserByUsername(
    username: string
): Promise<ChatUser | null> {
    const result = await pool.query<ChatUser>(
        `SELECT id, username, email, created_at
         FROM chat_users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
    );

    return result.rows[0] ?? null;
}
