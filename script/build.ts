import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@anthropic-ai/sdk",
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "node-ical",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  // Banner to provide CommonJS compatibility in ESM bundle
  const esmBanner = `
import { createRequire as __createRequire } from 'module';
import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirname_fn } from 'path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_fn(__filename);
`;

  // Build as ESM to preserve import.meta usage
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "esm",
    outfile: "dist/index.mjs",
    banner: {
      js: esmBanner.trim(),
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Create a CJS wrapper that dynamically imports the ESM bundle
  const cjsWrapper = `// CommonJS wrapper to load ESM bundle
(async () => {
  await import('./index.mjs');
})();
`;
  await writeFile("dist/index.cjs", cjsWrapper.trim());
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
