import fs from "node:fs";
import path from "node:path";

const ENV_FILES = [
  ".env",
  ".env.production",
  ".env.local",
  ".env.production.local",
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equals = line.indexOf("=");
    if (equals <= 0) {
      continue;
    }

    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase();

  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host)) {
    return true;
  }

  return (
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

const env = {};
for (const file of ENV_FILES) {
  Object.assign(env, parseEnvFile(path.resolve(process.cwd(), file)));
}
Object.assign(env, process.env);

const rawUrl = env.NEXT_PUBLIC_KAEL_API_URL?.trim() ?? "";
const allowLocal = process.env.KAEL_ALLOW_LOCAL_BUILD === "1";

function fail(message) {
  console.error(`\n[KAEL build check] ${message}\n`);
  process.exit(1);
}

if (!rawUrl) {
  fail(
    "NEXT_PUBLIC_KAEL_API_URL is empty. Create frontend/.env.production " +
      "with the public backend URL, or pass the variable in the build shell.",
  );
}

let parsed;
try {
  parsed = new URL(rawUrl);
} catch {
  fail(`NEXT_PUBLIC_KAEL_API_URL is not a valid URL: ${rawUrl}`);
}

if (isPrivateHost(parsed.hostname) && !allowLocal) {
  fail(
    `Refusing to embed a local/LAN API URL into the static build: ${rawUrl}. ` +
      "Move the local URL to .env.development.local, remove .env.local, " +
      "or set the public URL for this build. " +
      "For a local static preview only, set KAEL_ALLOW_LOCAL_BUILD=1.",
  );
}

if (parsed.protocol !== "https:" && !(allowLocal && isPrivateHost(parsed.hostname))) {
  fail(
    `The public backend URL must use HTTPS, got: ${rawUrl}. ` +
      "For a local static preview only, set KAEL_ALLOW_LOCAL_BUILD=1.",
  );
}

if (/^(your-|yourbackend|example\.)/i.test(parsed.hostname)) {
  fail(
    `Replace the placeholder backend URL with your real deployed URL: ${rawUrl}`,
  );
}

if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
  fail(
    `NEXT_PUBLIC_KAEL_API_URL must be an origin without a path/query/hash: ${rawUrl}`,
  );
}

console.log(`[KAEL build check] Backend URL: ${rawUrl}`);
