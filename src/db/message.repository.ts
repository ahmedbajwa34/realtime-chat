


import { pool } from "./db.js";

export interface NewMessage {
    senderUsername: string;
    recipientUsername: string | null;
    roomName: string | null;
    content: string;
}

export async function saveMessage(
    message: NewMessage
): Promise<void> {
    await pool.query(
        `
        INSERT INTO messages (
            sender_username,
            recipient_username,
            room_name,
            content
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
            message.senderUsername,
            message.recipientUsername,
            message.roomName,
            message.content,
        ]
    );
}




export interface StoredMessage {
    id: string;
    sender_username: string;
    room_name: string;
    content: string;
    created_at: Date;
}

export async function getRoomHistory(
    roomName: string
): Promise<StoredMessage[]> {
    const result = await pool.query<StoredMessage>(
        `
        SELECT
            id,
            sender_username,
            room_name,
            content,
            created_at
        FROM messages
        WHERE room_name = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 50
        `,
        [roomName]
    );

    return result.rows.reverse();
}



export async function getPrivateHistory(
    username: string,
    otherUsername: string
): Promise<StoredMessage[]> {
    const result = await pool.query<StoredMessage>(
        `
        SELECT
            id,
            sender_username,
            room_name,
            content,
            created_at
        FROM messages
        WHERE recipient_username IS NOT NULL
          AND (
              (
                  LOWER(sender_username) = LOWER($1)
                  AND LOWER(recipient_username) = LOWER($2)
              )
              OR
              (
                  LOWER(sender_username) = LOWER($2)
                  AND LOWER(recipient_username) = LOWER($1)
              )
          )
        ORDER BY created_at DESC, id DESC
        LIMIT 50
        `,
        [username, otherUsername]
    );

    return result.rows.reverse();
}

