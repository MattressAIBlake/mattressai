/**
 * Client-side authentication utilities
 */

/**
 * Handles authentication errors by redirecting to OAuth re-auth
 */
export function handleAuthError(error) {
  if (error.status === 401 && error.data?.redirectTo) {
    // Redirect to the OAuth URL provided by the server
    window.location.href = error.data.redirectTo;
    return true;
  }
  return false;
}

/**
 * Wraps fetch requests with automatic auth error handling
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        // Ensure we pass through the Authorization header if it exists
        ...(window.Authorization && { Authorization: window.Authorization }),
      },
    });

    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.redirectTo) {
        window.location.href = errorData.redirectTo;
        return;
      }
    }

    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
}

/**
 * Stores the current session token for use in authenticated requests
 */
export function setSessionToken(token) {
  window.Authorization = token;
}
