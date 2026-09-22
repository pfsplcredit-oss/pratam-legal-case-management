const http = require("http");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 10000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase environment variables are missing.");
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://pfsplcredit-oss.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });

  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "https://pfsplcredit-oss.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });

    res.end();
    return;
  }

  /*
   * HOME
   */
  if (url.pathname === "/") {
    sendJson(res, 200, {
      status: "ok",
      message: "Pratam Legal Case Management Backend is running"
    });
    return;
  }

  /*
   * HEALTH CHECK
   */
  if (url.pathname === "/health") {
    sendJson(res, 200, {
      status: "healthy"
    });
    return;
  }

  /*
   * CONNECTION TEST
   */
  if (url.pathname === "/api/test") {
    sendJson(res, 200, {
      status: "success",
      message: "Website successfully connected to Pratam Legal Backend"
    });
    return;
  }

  /*
   * GET LEGAL CASES FROM SUPABASE
   */
  if (url.pathname === "/api/cases" && req.method === "GET") {

    try {

      const { data, error } = await supabase
        .from("legal_cases")
        .select("*")
        

      if (error) {
        console.error("Supabase error:", error);

        sendJson(res, 500, {
          status: "error",
          message: "Unable to retrieve legal cases",
          error: error.message
        });

        return;
      }

      sendJson(res, 200, {
        status: "success",
        count: data.length,
        cases: data
      });

      return;

    } catch (error) {

      console.error("Server error:", error);

      sendJson(res, 500, {
        status: "error",
        message: "Server error while retrieving legal cases",
        error: error.message
      });

      return;
    }
  }

  /*
   * TEST PLAYWRIGHT
   */
  if (url.pathname === "/api/playwright-test") {

    let browser;

    try {

      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox"]
      });

      const page = await browser.newPage();

      await page.goto("https://example.com", {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      const title = await page.title();

      await browser.close();

      sendJson(res, 200, {
        status: "success",
        message: "Playwright Chromium launched successfully",
        page_title: title
      });

      return;

    } catch (error) {

      if (browser) {
        await browser.close().catch(() => {});
      }

      sendJson(res, 500, {
        status: "error",
        message: "Playwright Chromium failed to launch",
        error: error.message
      });

      return;
    }
  }

  /*
   * eCourts CNR endpoint
   */
  if (
    url.pathname === "/api/ecourts/search" &&
    req.method === "POST"
  ) {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {

      try {

        const data = JSON.parse(body || "{}");

        const cnr = String(data.cnr || "")
          .trim()
          .toUpperCase();

        if (!cnr) {
          sendJson(res, 400, {
            status: "error",
            message: "CNR number is required"
          });
          return;
        }

        sendJson(res, 200, {
          status: "success",
          message: "CNR received successfully",
          cnr: cnr
        });

      } catch (error) {

        sendJson(res, 400, {
          status: "error",
          message: "Invalid JSON request"
        });

      }

    });

    return;
  }

  /*
 * TEST ECOURTS WITH PLAYWRIGHT
 */
if (
  url.pathname === "/api/ecourts-test" &&
  req.method === "GET"
) {

  let browser;

  try {

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(
      "https://services.ecourts.gov.in/ecourtindia_v6/",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000
      }
    );

    const title = await page.title();

    await browser.close();

    sendJson(res, 200, {
      status: "success",
      message: "Playwright successfully opened eCourts",
      page_title: title
    });

    return;

  } catch (error) {

    if (browser) {
      await browser.close().catch(() => {});
    }

    sendJson(res, 500, {
      status: "error",
      message: "Unable to open eCourts with Playwright",
      error: error.message
    });

    return;
  }
}
     /*
   * UNKNOWN ROUTE
   */
  sendJson(res, 404, {
    error: "Not found"
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Pratam Legal Backend running on port ${PORT}`
  );
});
