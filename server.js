const http = require("http");
const { chromium } = require("playwright");

const PORT = process.env.PORT || 10000;

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

  if (url.pathname === "/health") {
    sendJson(res, 200, {
      status: "healthy"
    });
    return;
  }

  if (url.pathname === "/api/test") {
    sendJson(res, 200, {
      status: "success",
      message: "Website successfully connected to Pratam Legal Backend"
    });
    return;
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

  if (url.pathname === "/") {
    sendJson(res, 200, {
      status: "ok",
      message: "Pratam Legal Case Management Backend is running"
    });
    return;
  }

  sendJson(res, 404, {
    error: "Not found"
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Pratam Legal Backend running on port ${PORT}`
  );
});
