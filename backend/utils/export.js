import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import fs from "fs";
import { create } from "xmlbuilder2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = resolve(__dirname, "../output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

export function exportJson(data, filename = "filtrirano.json") {
  const filePath = join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

export function exportXml(list, filename = "filtrirano.xml") {
  const root = { animals: { animal: list } };
  const xml = create({ version: "1.0" }, root).end({ prettyPrint: true });
  const filePath = join(outputDir, filename);
  fs.writeFileSync(filePath, xml, "utf8");
  return filePath;
}
