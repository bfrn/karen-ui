import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types"
import { authorized } from "$lib/auth/auth";


export const load = ( async ({ locals, url }) => {
  const session = await locals?.getSession();
  if (!authorized(session, url)) {
      throw redirect(307, '/auth/signin');
  } 
  return { session }
}) satisfies LayoutServerLoad;
