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

const PORT = Number(process.env.PORT) || 3000;

// Set CLIENT_ORIGIN to your real https domain in production.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? `http://localhost:${PORT}`;

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: CLIENT_ORIGIN, credentials: true },
    // Blocks other websites from opening a socket with a logged-in user's cookie.
    // Browsers always send Origin on cross-site requests. Same-origin polling
    // requests may omit it, so a missing Origin is allowed (the login cookie is
    // still required by authenticateSocket).
    allowRequest: (req, callback) => {
        const origin = req.headers.origin;
        callback(null, origin === undefined || origin === CLIENT_ORIGIN);
    },
    maxHttpBufferSize: 1e5, // 100 KB per message
});

io.use(authenticateSocket);
app.set("io", io);
registerConnectionHandlers(io);

io.engine.on("connection_error", (error) => {
    console.error("Engine.IO connection error:", {
        code: error.code,
        message: error.message,
    });
});

async function startServer(): Promise<void> {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");
        console.log("PostgreSQL connected:", result.rows[0].current_time);

        httpServer.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to PostgreSQL:", error);
        await pool.end();
        process.exitCode = 1;
    }
}

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received, shutting down`);

    // Safety net: never hang forever waiting for connections to close
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();

    try {
        // Closes all sockets (clients see "io server disconnect" and reconnect)
        // and the HTTP server.
        await io.close();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

void startServer();