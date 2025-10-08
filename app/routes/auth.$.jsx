import { redirect } from "@remix-run/node";
import { login, authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { pathname } = new URL(request.url);
  
  // If this is the login path, use login() 
  // login() will throw a redirect Response to start OAuth flow
  if (pathname === '/auth/login') {
    await login(request);
    // If login doesn't redirect, go to app
    return redirect('/app');
  }
  
  // For other auth paths, use authenticate.admin()
  // This handles OAuth callbacks and other auth flows
  await authenticate.admin(request);
  
  // If authentication succeeds without redirecting, go to app
  return redirect('/app');
};
