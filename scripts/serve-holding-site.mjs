import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(projectRoot, "holding-page", "index.html");
const page = await readFile(pagePath);
const port = Number(process.env.PORT ?? process.env.DEV_PORT ?? 8080);

const server = createServer((request, response) => {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(request.method === "HEAD" ? undefined : page);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Holding page available on http://localhost:${port}`);
});
