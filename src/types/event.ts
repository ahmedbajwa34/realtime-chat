
export interface ClientMessagePayload {
    to?: string;
    text: string;
}

export interface ServerMessagePayload {
    from: string;
    text: string;
    private: boolean;
    room?: string;
}

export type MessageAck =
    | {
          ok: true;
          target: "private";
          recipient: string;
      }
    | {
          ok: true;
          target: "room";
          room: string;
      }
    | {
          ok: false;
          error:
              | "REGISTER_REQUIRED"
              | "INVALID_MESSAGE"
              | "RECIPIENT_NOT_FOUND"
              | "NOT_IN_ROOM"
              | "DATABASE_ERROR";
          message: string;
      };

export interface ClientToServerEvents {
    register: (name: unknown) => void;
    "join-room": (room: unknown) => void;
    message: (
        data: unknown,
        acknowledge: (result: MessageAck) => void
    ) => void;
    "private-history": (
    otherUsername: unknown,
    acknowledge: (result: PrivateHistoryAck) => void
) => void;
}

export interface ServerToClientEvents {
    message: (data: ServerMessagePayload) => void;
    system: (text: string) => void;
    "room-history": (messages: RoomHistoryMessage[]) => void;
    "current-user": (user: {
    id: string;
    username: string;
}) => void;
}


export interface RoomHistoryMessage {
    id: string;
    sender_username: string;
    room_name: string;
    content: string;
    created_at: Date;
}


export interface PrivateHistoryMessage {
    id: string;
    sender_username: string;
    room_name: string | null;
    content: string;
    created_at: Date;
}

export type PrivateHistoryAck =
    | {
          ok: true;
          messages: PrivateHistoryMessage[];
      }
    | {
          ok: false;
          message: string;
      };
