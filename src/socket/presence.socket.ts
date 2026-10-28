const connections = new Map<string, Set<string>>();
const keyOf = (u: string) => u.trim().toLowerCase();

/** Returns true if this is the user's first live socket (offline -> online). */
export function addConnection(username: string, socketId: string): boolean {
    const key = keyOf(username);
    let sockets = connections.get(key);
    const wasOffline = !sockets || sockets.size === 0;
    if (!sockets) {
        sockets = new Set();
        connections.set(key, sockets);
    }
    sockets.add(socketId);
    return wasOffline;
}


export function removeConnection(username: string, socketId: string): boolean {
    const key = keyOf(username);
    const sockets = connections.get(key);
    if (!sockets || !sockets.delete(socketId)) return false;
    if (sockets.size === 0) {
        connections.delete(key);
        return true;
    }
    return false;
}

export function isOnline(username: string): boolean {
    return (connections.get(keyOf(username))?.size ?? 0) > 0;
}

/** Keys are lowercased, which is fine if you normalize usernames to lowercase at auth. */
export function getOnlineUsernames(): string[] {
    return [...connections.keys()];
}