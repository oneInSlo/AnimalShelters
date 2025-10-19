import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";
import { XMLParser } from "fast-xml-parser";

// Reads and parses XML into JS objects

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: true,
  trimValues: true,
});

export function readXml(filename) {
  const filePath = resolve(__dirname, "../../data", filename);
  const xml = fs.readFileSync(filePath, "utf8");
  return parser.parse(xml);
}
