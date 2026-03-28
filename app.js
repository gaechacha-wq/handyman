/**
 * Avvio per hosting Plesk (Application startup file: app.js).
 * Con Phusion Passenger: usare listen('passenger') — vedi
 * https://www.phusionpassenger.com/library/indepth/nodejs/reverse_port_binding.html
 */
/* global PhusionPassenger */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const host = "0.0.0.0";

const passenger =
  typeof PhusionPassenger !== "undefined" ? PhusionPassenger : undefined;

if (passenger) {
  passenger.configure({ autoInstall: false });
}

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    if (passenger) {
      server.listen("passenger", () => {
        console.log("> Ready (Phusion Passenger)");
      });
    } else {
      server.listen(port, host, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${host}:${port}`);
      });
    }
  })
  .catch((err) => {
    console.error("Next.js prepare() failed:", err);
    process.exit(1);
  });
