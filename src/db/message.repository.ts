


import { pool } from "./db.js";


export interface NewMessage {
    senderUsername: string;
    recipientUsername: string | null;
    roomName: string | null;
    content: string;
    clientMsgId: string;
}

export async function saveMessage(m: NewMessage): Promise<StoredMessage> {
    const inserted = await pool.query<StoredMessage>(
        `
        INSERT INTO messages
            (sender_username, recipient_username, room_name, content, client_msg_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (sender_username, client_msg_id) DO NOTHING
        RETURNING ${MESSAGE_COLUMNS}
        `,
        [m.senderUsername, m.recipientUsername, m.roomName, m.content, m.clientMsgId]
    );
    if (inserted.rows[0]) return inserted.rows[0];

    const existing = await pool.query<StoredMessage>(
        `SELECT ${MESSAGE_COLUMNS} FROM messages
         WHERE sender_username = $1 AND client_msg_id = $2`,
        [m.senderUsername, m.clientMsgId]
    );
    const row = existing.rows[0];
    if (!row) throw new Error("Message save failed");
    return row;
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
    otherUsername: string,
    beforeId?: string
): Promise<StoredMessage[]> {
    const result = await pool.query<StoredMessage>(
        `
        SELECT ${MESSAGE_COLUMNS}
        FROM messages
        WHERE room_name IS NULL
          AND (
              (sender_username = $1 AND recipient_username = $2)
              OR
              (sender_username = $2 AND recipient_username = $1)
          )
          AND ($3::bigint IS NULL OR id < $3::bigint)
        ORDER BY id DESC
        LIMIT 50
        `,
        [username.toLowerCase(), otherUsername.toLowerCase(), beforeId ?? null]
    );

    return result.rows.reverse();
}





export async function markMessageDelivered(
    messageId: string,
    recipientUsername: string
): Promise<{ id: string; senderUsername: string; deliveredAt: Date } | null> {
    const result = await pool.query<{
        id: string;
        sender_username: string;
        delivered_at: Date;
    }>(
        `
        UPDATE messages
        SET delivered_at = NOW()
        WHERE id = $1
          AND recipient_username = $2
          AND room_name IS NULL
          AND delivered_at IS NULL
        RETURNING id, sender_username, delivered_at
        `,
        [messageId, recipientUsername]
    );

    const row = result.rows[0];
    if (!row) return null; 

    return {
        id: row.id,
        senderUsername: row.sender_username,
        deliveredAt: row.delivered_at,
    };
}




const MESSAGE_COLUMNS = `
    id,
    sender_username,
    recipient_username,
    room_name,
    content,
    created_at,
    delivered_at,
    read_at
`;



export interface StoredMessage {
    id: string;
    sender_username: string;
    recipient_username: string | null;
    room_name: string | null;
    content: string;
    created_at: Date;
    delivered_at: Date | null;
    read_at: Date | null;
}



export async function getPendingPrivateMessages(
    recipientUsername: string,
    afterId: string = "0",
    limit: number = 200
): Promise<StoredMessage[]> {
    const result = await pool.query<StoredMessage>(
        `
        SELECT ${MESSAGE_COLUMNS}
        FROM messages
        WHERE recipient_username = $1
          AND delivered_at IS NULL
          AND room_name IS NULL
          AND id > $2
        ORDER BY id ASC
        LIMIT $3
        `,
        [recipientUsername, afterId, limit]
    );

    return result.rows;
}