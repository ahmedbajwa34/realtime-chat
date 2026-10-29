export function createRateLimiter(limit: number, windowMs: number): () => boolean {
    let count = 0;
    let windowStart = Date.now();
 
    return function allow(): boolean {
        const now = Date.now();
 
        if (now - windowStart >= windowMs) {
            windowStart = now;
            count = 0;
        }
 
        count += 1;
        return count <= limit;
    };
}
    