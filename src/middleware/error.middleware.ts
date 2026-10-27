


import type {
    ErrorRequestHandler,
    Request,
    Response,
    NextFunction,
} from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (res.headersSent) {
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request data",
                details: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
        });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
            },
        });
        return;
    }

    // Handle PostgreSQL unique-constraint violations without
    // returning database internals to the client.
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
    ) {
        res.status(409).json({
            success: false,
            error: {
                code: "DUPLICATE_RESOURCE",
                message: "A record with these details already exists",
            },
        });
        return;
    }

    console.error("Unhandled application error:", error);

    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
        },
    });
};
