/**
 * Avvio per hosting Plesk (Application startup file: app.js).
 * Usa il server programmatico di Next; rispetta PORT e NODE_ENV dal pannello.
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const host = "0.0.0.0";

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, host, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${host}:${port}`);
  });
});
