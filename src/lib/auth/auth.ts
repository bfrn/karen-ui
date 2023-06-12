import type { Session } from "@auth/core/types";

export function authorized(session: Session | null, url: URL): boolean {
    const guardedPaths = [
        // "/modules",
        "/protected",
        // "/files"
    ];

    if (guardedPaths.some(path => url.pathname.includes(path))) {
        if (!session?.user) {
            return false
        }
    }

    return true
}
