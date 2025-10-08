import { login, authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { pathname } = new URL(request.url);
  
  // If this is the login path, use login() instead of authenticate.admin()
  if (pathname === '/auth/login') {
    return await login(request);
  }
  
  // For other auth paths, use authenticate.admin()
  return await authenticate.admin(request);
};
