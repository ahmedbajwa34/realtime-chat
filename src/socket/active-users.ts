
const usernameToSocketId = new Map<string, string>();

export function claimUsername(
    username: string,
    socketId: string
): boolean {
    const key = username.trim().toLowerCase();

    if (usernameToSocketId.has(key)) {
        return false;
    }

    usernameToSocketId.set(key, socketId);
    return true;
}

export function releaseUsername(
    username: string,
    socketId: string
): void {
    const key = username.trim().toLowerCase();

    // Only the socket that owns the username can release it.
    if (usernameToSocketId.get(key) === socketId) {
        usernameToSocketId.delete(key);
    }
}


export function isUsernameActive(username: string): boolean {
    const key = username.trim().toLowerCase();
    return usernameToSocketId.has(key);
}
