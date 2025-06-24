export default {
  async fetch(request, env, ctx) {
    console.log("[Worker Debug] Worker invoked!"); // <--- ADD THIS LINE HERE
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split("/").filter(Boolean);

      console.log(`[Worker Debug] Incoming request path: ${url.pathname}`); // DEBUG

      if (pathSegments.length < 2 || pathSegments[0] !== "click") {
        console.log("[Worker Debug] Invalid path format or not a click request."); // DEBUG
        return new Response("Not Found", { status: 404 });
      }

      const linkId = pathSegments[1];
      console.log(`[Worker Debug] Extracted link ID: ${linkId}`); // DEBUG

      // Fetch brand data from KV
      const brandDataString = await env.BRAND_LINKS.get(linkId);
      console.log(`[Worker Debug] Raw KV response for ID ${linkId}: ${brandDataString ? brandDataString.substring(0, 100) + '...' : 'null/undefined'}`); // DEBUG (log first 100 chars)

      // Handle if link ID not found in KV
      if (!brandDataString) {
        console.error(`[Worker Error] Link ID ${linkId} not found in KV.`); // DEBUG ERROR
        return new Response("Invalid link ID or Brand not found", { status: 404 });
      }

      let brandData;
      try {
        brandData = JSON.parse(brandDataString); // Parse the JSON from KV
        console.log(`[Worker Debug] Parsed KV data for ID ${linkId}: ${JSON.stringify(brandData)}`); // DEBUG
      } catch (jsonError) {
        console.error(`[Worker Error] Failed to parse JSON from KV for ID ${linkId}: ${jsonError.message}. Raw data: ${brandDataString}`); // DEBUG ERROR
        return new Response("Server Error: Invalid KV data format", { status: 500 });
      }

      const gclidValue = url.searchParams.get("gclid") || "";
      console.log(`[Worker Debug] GCLID value: ${gclidValue}`); // DEBUG

      let finalDestinationUrl = brandData.baseUrl;
      let queryStringTemplate = brandData.fullQueryStringTemplate || "";
      console.log(`[Worker Debug] Base URL from KV: ${finalDestinationUrl}`); // DEBUG
      console.log(`[Worker Debug] Query String Template from KV: ${queryStringTemplate}`); // DEBUG

      // Replace {ACCOUNT_PREFIX}
      if (env.AU_PREFIX) {
        console.log(`[Worker Debug] AU_PREFIX is present: ${env.AU_PREFIX}. Replacing placeholder.`); // DEBUG
        queryStringTemplate = queryStringTemplate.replace(/{ACCOUNT_PREFIX}/g, env.AU_PREFIX);
      } else {
        console.log("[Worker Debug] AU_PREFIX is NOT present."); // DEBUG
      }

      // NEW: Replace {DYN2}
      if (env.DYN2) { // Access DYN2 value from environment
        console.log(`[Worker Debug] DYN2 is present: ${env.DYN2}. Replacing placeholder.`);
        queryStringTemplate = queryStringTemplate.replace(/{DYN2}/g, env.DYN2);
      } else {
        console.log("[Worker Debug] DYN2 is NOT present.");
      }

      // NEW: Replace {DYN3}
      if (env.DYN3) { // Access DYN3 value from environment
        console.log(`[Worker Debug] DYN3 is present: ${env.DYN3}. Replacing placeholder.`);
        queryStringTemplate = queryStringTemplate.replace(/{DYN3}/g, env.DYN3);
      } else {
        console.log("[Worker Debug] DYN3 is NOT present.");
      }
      
      // Replace {clickid} and {externalid} placeholders
      queryStringTemplate = queryStringTemplate
        .replace(/{clickid}/g, encodeURIComponent(gclidValue))
        .replace(/{externalid}/g, encodeURIComponent(gclidValue));
      console.log(`[Worker Debug] Processed Query String Template: ${queryStringTemplate}`); // DEBUG

      // Concatenate base URL and the processed query string
      finalDestinationUrl += queryStringTemplate;
      console.log(`[Worker Debug] Final Redirection URL: ${finalDestinationUrl}`); // DEBUG

      // Redirect the user
      return Response.redirect(finalDestinationUrl, 302);

    } catch (error) {
      console.error("Worker Catch Block Errors:", error.stack || error.message);
      return new Response("Server Error", { status: 500 });
    }
  }
};