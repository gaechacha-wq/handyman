/**
 * Avvio per hosting Plesk (Application startup file: app.js).
 * Phusion Passenger intercetta di solito il *primo* server.listen() (reverse port binding).
 * Non usiamo listen('passenger') + autoInstall:false: su alcuni stack va in errore e
 * tutte le richieste rispondono 500. Vedi:
 * https://www.phusionpassenger.com/library/indepth/nodejs/reverse_port_binding.html
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const host = "0.0.0.0";

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.on("error", (err) => {
      console.error("HTTP server error:", err);
    });

    server.listen(port, host, () => {
      console.log(`> Ready on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Next.js prepare() failed:", err);
    process.exit(1);
  });
