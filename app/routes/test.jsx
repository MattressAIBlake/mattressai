// Ultra-minimal route - no imports
export function loader() {
  return new Response("OK - Server is alive", {
    headers: { "Content-Type": "text/plain" }
  });
}

