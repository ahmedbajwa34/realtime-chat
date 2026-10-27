
import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "./types/event.js";
import { registerConnectionHandlers } from "./socket/connection.handler.js";
import { pool } from "./db/db.js";
import { authenticateSocket } from "./socket/auth.socket.js";


const PORT = 3000;


const httpServer = createServer(app);

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents
>(httpServer);

io.use(authenticateSocket);
registerConnectionHandlers(io);
io.engine.on("connection_error", (error) => {
    console.error("Engine.IO connection error:", {
        code: error.code,
        message: error.message,
        context: error.context,
    });
});

async function startServer(): Promise<void> {
    try {
        console.log({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            passwordLoaded: typeof process.env.DB_PASSWORD === "string",
        });

        const result = await pool.query("SELECT NOW() AS current_time");

        console.log(
            "PostgreSQL connected:",
            result.rows[0].current_time
        );

        httpServer.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to PostgreSQL:", error);
        await pool.end();
        process.exitCode = 1;
    }
}

void startServer();
