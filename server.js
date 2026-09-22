const http = require("http");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 10000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    "Access-Control-Allow-Origin":
      "https://pfsplcredit-oss.github.io",
    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization"
  });

  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  /*
   * CORS
   */
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":
        "https://pfsplcredit-oss.github.io",
      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization"
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
      message:
        "Pratam Legal Case Management Backend is running"
    });
    return;
  }

  /*
   * HEALTH
   */
  if (url.pathname === "/health") {
    sendJson(res, 200, {
      status: "healthy"
    });
    return;
  }

  /*
   * TEST CONNECTION
   */
  if (url.pathname === "/api/test") {
    sendJson(res, 200, {
      status: "success",
      message:
        "Website successfully connected to Pratam Legal Backend"
    });
    return;
  }

  /*
   * GET LEGAL CASES
   */
  if (
    url.pathname === "/api/cases" &&
    req.method === "GET"
  ) {
    try {

      const { data, error } = await supabase
        .from("legal_cases")
        .select("*");

      if (error) {
        sendJson(res, 500, {
          status: "error",
          message:
            "Unable to retrieve legal cases",
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

      sendJson(res, 500, {
        status: "error",
        message:
          "Server error while retrieving legal cases",
        error: error.message
      });

      return;
    }
  }

  /*
   * PLAYWRIGHT TEST
   */
  if (
    url.pathname === "/api/playwright-test" &&
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
        "https://example.com",
        {
          waitUntil: "domcontentloaded",
          timeout: 30000
        }
      );

      const title = await page.title();

      await browser.close();

      sendJson(res, 200, {
        status: "success",
        message:
          "Playwright successfully opened example.com",
        page_title: title
      });

      return;

    } catch (error) {

      if (browser) {
        await browser.close().catch(() => {});
      }

      sendJson(res, 500, {
        status: "error",
        message:
          "Playwright Chromium failed to launch",
        error: error.message
      });

      return;
    }
  }

  /*
   * ECOURTS TEST
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

      const pageText =
        await page.locator("body").innerText();

      const inputs =
        await page.locator("input").evaluateAll(
          elements =>
            elements.map(el => ({
              name: el.name,
              id: el.id,
              type: el.type,
              placeholder: el.placeholder
            }))
        );

      const buttons =
        await page
          .locator(
            "button, input[type='submit']"
          )
          .evaluateAll(
            elements =>
              elements.map(el => ({
                text:
                  el.innerText ||
                  el.value ||
                  "",
                id: el.id,
                name: el.name,
                type: el.type
              }))
          );

      await browser.close();

      sendJson(res, 200, {
        status: "success",
        message:
          "Playwright successfully opened eCourts",
        page_title: title,
        page_text:
          pageText.substring(0, 3000),
        inputs: inputs,
        buttons: buttons
      });

      return;

    } catch (error) {

      if (browser) {
        await browser.close().catch(() => {});
      }

      sendJson(res, 500, {
        status: "error",
        message:
          "Unable to open eCourts with Playwright",
        error: error.message
      });

      return;
    }
  }

  /*
   * ECOURTS CNR FILL TEST
   *
   * This fills only the CNR field.
   * CAPTCHA is NOT bypassed.
   * Search is NOT clicked.
   */
  if (
    url.pathname === "/api/ecourts-fill-cnr" &&
    req.method === "GET"
  ) {

    const cnr =
      String(url.searchParams.get("cnr") || "")
        .trim()
        .toUpperCase();

    if (!cnr) {
      sendJson(res, 400, {
        status: "error",
        message:
          "Please provide a CNR number."
      });

      return;
    }

    if (!/^[A-Z0-9]{16}$/.test(cnr)) {
      sendJson(res, 400, {
        status: "error",
        message:
          "CNR must contain exactly 16 letters/numbers.",
        cnr: cnr
      });

      return;
    }

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

      /*
       * Fill CNR field.
       */
      await page
        .locator("#cino")
        .fill(cnr);

      /*
       * Read back the value to confirm
       * that the field was filled.
       */
      const enteredCnr =
        await page
          .locator("#cino")
          .inputValue();

      /*
       * Confirm CAPTCHA field exists.
       */
      const captchaExists =
        await page
          .locator("#fcaptcha_code")
          .count();

      /*
       * Confirm Search button exists.
       */
      const searchButtonExists =
        await page
          .locator("#searchbtn")
          .count();

      await browser.close();

      sendJson(res, 200, {
        status: "success",
        message:
          "CNR was successfully entered into the eCourts CNR field.",
        cnr: enteredCnr,
        captcha_field_found:
          captchaExists > 0,
        search_button_found:
          searchButtonExists > 0,
        next_action:
          "CAPTCHA must be entered manually. Search was not clicked."
      });

      return;

    } catch (error) {

      if (browser) {
        await browser.close().catch(() => {});
      }

      sendJson(res, 500, {
        status: "error",
        message:
          "Unable to fill CNR on eCourts.",
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

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Pratam Legal Backend running on port ${PORT}`
    );
  }
);
