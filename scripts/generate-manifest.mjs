// // FILE: script/generate-manifest.mjs

// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /**
//  * ✅ ROOT stable (không phụ thuộc script location)
//  */
// const ROOT = process.cwd();

// /**
//  * Source tools folder
//  */
// const DEFINITIONS = path.join(
//   ROOT,
//   "src",
//   "core",
//   "agent",
//   "tools",
//   "definitions"
// );

// /**
//  * Generated folder
//  */
// const GENERATED = path.join(
//   ROOT,
//   "src",
//   "core",
//   "agent",
//   "tools",
//   "generated"
// );

// /**
//  * Output file
//  */
// const OUTPUT = path.join(GENERATED, "tools.manifest.ts");

// /**
//  * Ensure output dir exists
//  */
// fs.mkdirSync(GENERATED, { recursive: true });

// const imports = [];
// const refs = [];

// const dirs = fs.existsSync(DEFINITIONS)
//   ? fs.readdirSync(DEFINITIONS, { withFileTypes: true })
//   : [];

// let index = 0;

// for (const dir of dirs) {
//   if (!dir.isDirectory()) continue;

//   const toolFile = path.join(DEFINITIONS, dir.name, "tool.ts");

//   if (!fs.existsSync(toolFile)) continue;

//   const alias = `tool${index++}`;

//   imports.push(`import * as ${alias} from "../definitions/${dir.name}/tool";`);

//   refs.push(`
// {
//   module: ${alias},
//   source: ${JSON.stringify(toolFile.replace(/\\/g, "/"))},
//   name: "${dir.name}"
// }
// `);
// }

// const content = `
// // AUTO GENERATED FILE
// // DO NOT EDIT

// ${imports.join("\n")}

// export const TOOL_MODULES = [
// ${refs.join(",\n")}
// ];
// `;

// if (fs.existsSync(OUTPUT)) {
//   fs.unlinkSync(OUTPUT);
// }

// fs.writeFileSync(OUTPUT, content, "utf8");

// console.log(`✅ Manifest regenerated: ${refs.length} tool(s)`);

    // "agent:sync": "node scripts/generate-manifest.mjs",

    // "predev": "npm run agent:sync",
    // "prebuild": "npm run agent:sync",