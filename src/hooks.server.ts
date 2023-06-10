import { SvelteKitAuth } from "@auth/sveltekit";
import GitHub from "@auth/core/providers/github";
import { GITHUB_ID, GITHUB_SECRET } from "$env/static/private";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

async function authorization({ event, resolve }) {
    // Protect any routes under /
    if (event.url.pathname.startsWith("/iam-visualizer")) {
        const session = await event.locals.getSession();
        if (!session) {
            throw redirect(303, "/auth");
        }
    }

    // If the request is still here, just proceed as normally
    return resolve(event);
}

// First handle authentication, then authorization
// Each function acts as a middleware, receiving the request handle
// And returning a handle which gets passed to the next function
export const handle: Handle = sequence(
    SvelteKitAuth({
        providers: [GitHub({ clientId: GITHUB_ID, clientSecret: GITHUB_SECRET })],
    }),
    authorization
);