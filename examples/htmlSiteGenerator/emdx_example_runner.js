import path from "path";
import { fileURLToPath } from "url";
import { EmdxHtmlGenerator } from "../../emdd.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(__dirname)
const generator = new EmdxHtmlGenerator(path.resolve(__dirname, "./config.json"));
generator.generate();