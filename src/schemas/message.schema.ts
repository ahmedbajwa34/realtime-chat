import type { ClientMessagePayload } from "../types/event.js";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseName(name: unknown): string | null {
    if (typeof name !== "string") return null;
    const trimmed = name.trim();
    if (trimmed === "" || trimmed.length > 20) return null;
    return trimmed;
}

export function parseMessage(data: unknown): ClientMessagePayload | null {
    if (typeof data !== "object" || data === null) return null;

    const { to, text, clientMsgId } = data as Record<string, unknown>;

    if (typeof clientMsgId !== "string" || !UUID_RE.test(clientMsgId)) {
        return null;
    }

    if (typeof text !== "string") return null;
    const cleanText = text.trim();
    if (cleanText === "" || cleanText.length > 500) return null;

    if (to !== undefined && typeof to !== "string") return null;
    const cleanTo = typeof to === "string" ? to.trim().toLowerCase() : "";

    return cleanTo
        ? { clientMsgId: clientMsgId.toLowerCase(), to: cleanTo, text: cleanText }
        : { clientMsgId: clientMsgId.toLowerCase(), text: cleanText };
}