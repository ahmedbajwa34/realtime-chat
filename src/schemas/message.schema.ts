

import type { ClientMessagePayload } from "../types/event.js";

export function parseName(name: unknown): string | null {
    if (typeof name !== "string") return null;
    const trimmed = name.trim();
    if (trimmed === "" || trimmed.length > 20) return null;
    return trimmed;
}

export function parseMessage(data: unknown): ClientMessagePayload | null {
    if (typeof data !== "object" || data === null) return null;

    const { to, text } = data as Record<string, unknown>;

    if (typeof text !== "string") return null;
    const cleanText = text.trim();
    if (cleanText === "" || cleanText.length > 500) {
        return null
    };

    if (to !== undefined && typeof to !== "string") {
        return null
    };

    const cleanTo = typeof to === "string" ? to.trim() : "";

    return cleanTo ? { to: cleanTo, text: cleanText } : { text: cleanText };
}