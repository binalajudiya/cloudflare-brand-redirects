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
      console.log(`[Worker Debug] Raw KV response for ID ${linkId}: ${brandDataString?.substring(0, 100) || 'null'}`);

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
      let queryStringTemplate = brandData.fullQueryStringTemplate || "";
      console.log(`[Worker Debug] Base URL: ${finalDestinationUrl}`);
      console.log(`[Worker Debug] Query Template: ${queryStringTemplate}`);

      // Replace placeholders in order
      const replacements = {
        "{ACCOUNT_PREFIX}": env.AU_PREFIX || "",
        "{DYN2_VALUE}": env.DYN2_VALUE || "",
        "{DYN3_VALUE}": env.DYN3_VALUE || "",
        "{clickid}": encodeURIComponent(gclidValue),
        "{externalid}": encodeURIComponent(gclidValue)
      };

      for (const [key, value] of Object.entries(replacements)) {
        queryStringTemplate = queryStringTemplate.replace(new RegExp(key, "g"), value);
      }

      console.log(`[Worker Debug] Processed Query: ${queryStringTemplate}`);
      finalDestinationUrl += queryStringTemplate;
      console.log(`[Worker Debug] Final URL: ${finalDestinationUrl}`);

      return Response.redirect(finalDestinationUrl, 302);

    } catch (error) {
      console.error("Worker Error:", error.stack || error.message);
      return new Response("Server Error", { status: 500 });
    }
  }
};