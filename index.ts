// server.js

// Read configuration from environment variables.
const PORT = Number(process.env.PORT || 8080);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// Start a native HTTP server using Bun.serve.
Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle preflight OPTIONS requests.
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Extract the target URL from the path.
    // Example: For a request to "/https%3A%2F%2Fexample.com", the target is "https://example.com".
    const targetUrl = url.pathname.slice(1);
    if (!targetUrl) {
      return new Response("No target URL provided. Use /<encoded-target-url>", {
        status: 400,
      });
    }

    let target;
    try {
      // Decode the URL component and construct a new URL.
      target = new URL(decodeURIComponent(targetUrl));
    } catch (err) {
      return new Response("Invalid target URL.", { status: 400 });
    }

    // Clone the original request while removing the host header.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete("host");

    // Prepare the request initialization.
    const init = {
      method: req.method,
      headers: requestHeaders,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await req.arrayBuffer(),
    };

    try {
      // Perform the proxied request.
      const response = await fetch(target.toString(), init);
      const headers = new Headers(response.headers);

      // Append CORS headers to the proxied response.
      headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (err) {
      if (err instanceof TypeError) {
        return new Response("Error fetching the target URL: " + err.message, {
          status: 500,
        });
      }
      return new Response("Error fetching the target URL.", { status: 400 });
    }
  },
});

console.log(`Listening on port ${PORT}`);