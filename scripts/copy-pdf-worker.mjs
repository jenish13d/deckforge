// Copies pdf.js's worker (the build that also runs in older browsers) into public/ so the
// browser can read PDFs (run after npm install). public/ may not exist in a fresh checkout.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });
copyFileSync("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
