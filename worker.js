export default {
  async fetch(request, env, ctx) {
    console.log("[Worker Debug] Worker invoked!");
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split("/").filter(Boolean);

      console.log(`[Worker Debug] Incoming request path: ${url.pathname}`);

      if (pathSegments.length < 2 || pathSegments[0] !== "click") {
        console.log("[Worker Debug] Invalid path format");
        return new Response("Not Found", { status: 404 });
      }

      const linkId = pathSegments[1];
      console.log(`[Worker Debug] Extracted link ID: ${linkId}`);

      const brandDataString = await env.BRAND_LINKS.get(linkId);
      if (!brandDataString) {
        console.error(`[Worker Error] Link ID ${linkId} not found`);
        return new Response("Invalid link ID", { status: 404 });
      }

      let brandData;
      try {
        brandData = JSON.parse(brandDataString);
        console.log(`[Worker Debug] Parsed KV data: ${JSON.stringify(brandData)}`);
      } catch (error) {
        console.error(`[Worker Error] JSON parse failed: ${error.message}`);
        return new Response("Invalid KV data", { status: 500 });
      }

      const gclidValue = url.searchParams.get("gclid") || "";
      console.log(`[Worker Debug] GCLID value: ${gclidValue}`);

      let finalDestinationUrl = brandData.baseUrl;
      let queryString = brandData.fullQueryStringTemplate || "";
      console.log(`[Worker Debug] Base URL: ${finalDestinationUrl}`);
      console.log(`[Worker Debug] Query Template: ${queryString}`);

      // DEBUG: Log environment variables
      console.log(`[Worker Debug] Env: AU_PREFIX=${env.AU_PREFIX}, DYN2=${env.DYN2_VALUE}, DYN3=${env.DYN3_VALUE}`);

      // Replace placeholders
      queryString = queryString
        .replace(/{ACCOUNT_PREFIX}/g, env.AU_PREFIX || "")
        .replace(/{DYN2}/g, env.DYN2_VALUE || "")
        .replace(/{DYN3}/g, env.DYN3_VALUE || "")
        .replace(/{clickid}/g, encodeURIComponent(gclidValue))
        .replace(/{externalid}/g, encodeURIComponent(gclidValue));

      console.log(`[Worker Debug] Processed Query: ${queryString}`);
      finalDestinationUrl += queryString;
      console.log(`[Worker Debug] Final URL: ${finalDestinationUrl}`);

      return