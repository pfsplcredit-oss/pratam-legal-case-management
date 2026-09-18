const http = require("http");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });

  if (req.url === "/") {
    res.end(JSON.stringify({
      status: "ok",
      message: "Pratam Legal Case Management Backend is running"
    }));
    return;
  }

  if (req.url === "/health") {
    res.end(JSON.stringify({
      status: "healthy"
    }));
    return;
  }

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
