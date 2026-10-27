
import type { Server, Socket } from "socket.io";
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "../types/event.js";

declare module "socket.io" {
    interface SocketData {
        userId: string;
    }
}

export type ChatServer = Server<
    ClientToServerEvents,
    ServerToClientEvents
>;

export type ChatSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents
>;

export type SocketSession = {
    username: string;
    currentRoom: string;
};
