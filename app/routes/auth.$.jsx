import { authenticate, login } from "../shopify.server";

export const loader = async ({ request }) => {
  const { pathname } = new URL(request.url);
  
  // If this is the login path, use login() instead of authenticate.admin()
  if (pathname === '/auth/login') {
    await login(request);
    return null;
  }
  
  // For other auth paths, use authenticate.admin()
  await authenticate.admin(request);

  return null;
};
