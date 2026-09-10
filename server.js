#!/usr/bin/env node
/**
 * Tiny static server for JOBTRAK.
 * Always sends Cache-Control: no-store so CSS/JS edits show up without version query strings.
 */
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");

var ROOT = __dirname;
var PORT = Number(process.env.PORT) || 8080;

var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function safeJoin(root, urlPath) {
  var decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (decoded === "/") decoded = "/index.html";
  var resolved = path.normalize(path.join(root, decoded));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

var server = http.createServer(function (req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, { "Content-Type": "text/plain; charset=utf-8" }, "Method Not Allowed\n");
    return;
  }

  var filePath = safeJoin(ROOT, req.url);
  if (!filePath) {
    send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden\n");
    return;
  }

  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) {
      send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found\n");
      return;
    }

    var ext = path.extname(filePath).toLowerCase();
    var headers = {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Content-Length": String(stat.size),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    };

    if (req.method === "HEAD") {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    var stream = fs.createReadStream(filePath);
    res.writeHead(200, headers);
    stream.pipe(res);
    stream.on("error", function () {
      if (!res.headersSent) send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server Error\n");
      else res.destroy();
    });
  });
});

server.listen(PORT, function () {
  console.log("JOBTRAK running at http://localhost:" + PORT);
  console.log("Serving " + ROOT + " (no-cache)");
});
