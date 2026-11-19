import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.resolve(projectRoot, "dist-holding");
const sourcePage = path.resolve(projectRoot, "holding-page", "index.html");

if (!outputDirectory.startsWith(`${projectRoot}${path.sep}`)) {
  throw new Error("Refusing to write outside the project build output directory.");
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await copyFile(sourcePage, path.join(outputDirectory, "index.html"));

const publishedFiles = await readdir(outputDirectory);
if (publishedFiles.length !== 1 || publishedFiles[0] !== "index.html") {
  throw new Error("The holding page publish directory must contain only index.html.");
}

console.log("Built the single-page holding site.");
