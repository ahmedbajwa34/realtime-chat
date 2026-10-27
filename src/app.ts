
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import { authenticate } from "./middleware/auth.middleware.js";

const app = express();

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use(express.static(path.resolve(currentDirectory, "../public")));


app.use(errorHandler);
app.get("/me", authenticate, (req, res) => {
    res.status(200).json({
        userId: req.auth?.userId,
    });
});

export default app;
