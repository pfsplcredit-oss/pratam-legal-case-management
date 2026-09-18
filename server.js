const http = require("http");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });

    res.end(JSON.stringify({
      status: "healthy"
    }));

    return;
  }

  // Backend connection test
  if (url.pathname === "/api/test") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });

    res.end(JSON.stringify({
      status: "success",
      message: "Website successfully connected to Pratam Legal Backend"
    }));

    return;
  }

  // Home
  if (url.pathname === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });

    res.end(JSON.stringify({
      status: "ok",
      message: "Pratam Legal Case Management Backend is running"
    }));

    return;
  }

  // Not found
  res.writeHead(404, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pratam Legal Backend running on port ${PORT}`);
});
