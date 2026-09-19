const http = require("http");

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

const server = http.createServer((req, res) => {

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "https://pfsplcredit-oss.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });

    res.end();
    return;
  }

  // Health check
  if (url.pathname === "/health") {
    sendJson(res, 200, {
      status: "healthy"
    });
    return;
  }

  // Backend connection test
  if (url.pathname === "/api/test") {
    sendJson(res, 200, {
      status: "success",
      message: "Website successfully connected to Pratam Legal Backend"
    });
    return;
  }

  // eCourts CNR preparation endpoint
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

  // Home
  if (url.pathname === "/") {
    sendJson(res, 200, {
      status: "ok",
      message: "Pratam Legal Case Management Backend is running"
    });
    return;
  }

  // Not found
  sendJson(res, 404, {
    error: "Not found"
  });

});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Pratam Legal Backend running on port ${PORT}`
  );
});
