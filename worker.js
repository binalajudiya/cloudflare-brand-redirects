// worker.js

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split("/").filter(Boolean);

      // Basic sanity check for the URL path format (e.g., /click/1)
      if (pathSegments.length < 2 || pathSegments[0] !== "click") {
        return new Response("Not Found", { status: 404 });
      }

      // The ID from the path (e.g., "1" from /click/1)
      const linkId = pathSegments[1];

      // 1) Fetch the brand data from KV using the linkId as the key
      // env.BRAND_LINKS corresponds to the binding name you set in wrangler.toml
      const brandDataString = await env.BRAND_LINKS.get(linkId);

      if (!brandDataString) {
        // If the linkId is not found in KV
        return new Response("Invalid link ID or Brand not found", { status: 404 });
      }

      // Parse the JSON string retrieved from KV into a JavaScript object
      const brandData = JSON.parse(brandDataString);

      // Extract query parameters from the incoming request URL
      const gclid = url.searchParams.get("gclid") || ""; // Use empty string if not found
      // As per your original code, {externalid} and {clickid} are both replaced by gclid
      const externalIdValue = gclid;

      // Start building the final destination URL with the base URL from KV
      let finalDestination = brandData.baseUrl;

      // Get the full query string template from KV
      let queryStringTemplate = brandData.fullQueryStringTemplate || ""; // Ensure it's not undefined

      // Replace {ACCOUNT_PREFIX} with the value from the Worker's environment variables (e.g., AU213)
      if (env.AU_PREFIX) {
        queryStringTemplate = queryStringTemplate.replace(/{ACCOUNT_PREFIX}/g, env.AU_PREFIX);
      }

      // Replace {clickid} and {externalid} placeholders with the extracted value (gclid)
      // Use a global replace flag (g) to catch all occurrences
      queryStringTemplate = queryStringTemplate
        .replace(/{clickid}/g, encodeURIComponent(externalIdValue))
        .replace(/{externalid}/g, encodeURIComponent(externalIdValue));

      // Append the processed query string template to the base URL
      finalDestination += queryStringTemplate;

      // 6) Return a 302 redirect to the final constructed URL
      return Response.redirect(finalDestination, 302);

    } catch (err) {
      // Log the error to your Worker's dashboard (via console.error)
      console.error("Worker Error:", err.stack || err.message); 
      // Return a generic server error response to the user
      return new Response("Server Error", { status: 500 });
    }
  }
};