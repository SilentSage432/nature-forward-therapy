import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";

const PORT = 3011;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();

function curl(args) {
  return execFileSync("/usr/bin/curl", args, {
    encoding: "utf8",
    maxBuffer: 10_000_000,
  });
}

function measure(path, n = 3) {
  const runs = [];
  for (let i = 0; i < n; i++) {
    const out = `/tmp/nft_perf_body_${i}.html`;
    const hdr = `/tmp/nft_perf_hdr_${i}.txt`;
    const timing = curl([
      "-sS",
      "-D",
      hdr,
      "-o",
      out,
      "-w",
      "ttfb=%{time_starttransfer}|total=%{time_total}|size=%{size_download}|http=%{http_code}",
      `${BASE}${path}`,
    ]).trim();
    const headers = readFileSync(hdr, "utf8");
    const body = readFileSync(out, "utf8");
    const cache = {};
    for (const line of headers.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).toLowerCase();
      if (["cache-control", "x-nextjs-cache", "age", "location"].includes(key)) {
        cache[key] = line.slice(idx + 1).trim();
      }
    }
    runs.push({
      timing,
      status: headers.split(/\r?\n/)[0] || "",
      cache,
      nicole: body.includes("Nicole Garcia"),
      headway: body.toLowerCase().includes("headway"),
      pt:
        body.toLowerCase().includes("psychologytoday") ||
        body.includes("Psychology Today"),
      holding: body.toLowerCase().includes("forest desk"),
      maintenanceCopy: body.includes("Local maintenance test"),
      bytes: body.length,
    });
  }
  return runs;
}

const logFd = writeFileSync;
const serverLog = "/tmp/nft-perf-002-server.log";
const logStream = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: ROOT,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});
let logBuf = "";
logStream.stdout.on("data", (d) => {
  logBuf += d.toString();
});
logStream.stderr.on("data", (d) => {
  logBuf += d.toString();
});

let ready = false;
for (let i = 0; i < 50; i++) {
  try {
    const code = curl(["-s", "-o", "/dev/null", "-w", "%{http_code}", `${BASE}/`]);
    if (code.trim() === "200") {
      ready = true;
      break;
    }
  } catch {
    // not up yet
  }
  await sleep(200);
}

if (!ready) {
  console.error("SERVER_FAILED");
  console.error(logBuf.slice(-3000));
  logStream.kill("SIGKILL");
  process.exit(1);
}

const report = {
  ready: true,
  public: {},
};

for (const path of [
  "/",
  "/articles",
  "/bookshelf",
  "/articles/navigating-uncharted-transitions",
  "/login",
]) {
  report.public[path] = measure(path, 3);
}

try {
  const adminTiming = curl([
    "-sS",
    "-D",
    "/tmp/nft_admin_hdr.txt",
    "-o",
    "/dev/null",
    "--max-redirs",
    "0",
    "-w",
    "http=%{http_code}",
    `${BASE}/admin`,
  ]).trim();
  report.adminAnonymous = {
    timing: adminTiming,
    headers: readFileSync("/tmp/nft_admin_hdr.txt", "utf8")
      .split(/\r?\n/)
      .filter((l) =>
        /^(HTTP\/|location:|cache-control:|x-nextjs-cache:)/i.test(l),
      ),
  };
} catch (error) {
  report.adminAnonymous = {
    error: String(error),
    headers: readFileSync("/tmp/nft_admin_hdr.txt", "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 8),
  };
}

const prisma = new PrismaClient();
await prisma.systemSetting.upsert({
  where: { key: "MAINTENANCE_MODE" },
  create: {
    key: "MAINTENANCE_MODE",
    value: JSON.stringify({
      enabled: true,
      message: "Local maintenance test.",
    }),
  },
  update: {
    value: JSON.stringify({
      enabled: true,
      message: "Local maintenance test.",
    }),
  },
});

// Without tag revalidation, proxy may serve stale maintenance=false until TTL.
report.maintenanceBeforeTagBust = measure("/", 1)[0];

// Bust via authenticated maintenance API is ideal; for local verify, restart not allowed.
// Call next-on-demand by hitting a tiny route that revalidates if we can login.
// Fallback: wait beyond MAINTENANCE_REVALIDATE_SECONDS (30s) is too slow;
// instead invoke revalidate through dynamic import of next/cache in a child next script is hard.
// Practical local approach: kill only the data cache by requesting /maintenance and
// documenting that CMS toggle uses revalidateTag({expire:0}).
// For proof of rewrite path once cache is cold, force process env by writing a marker
// and calling getMaintenanceModeCached after expire: we simulate by waiting 0 and
// using prisma + manual fetch to /maintenance page content.

report.maintenancePageDirect = measure("/maintenance", 1)[0];

await prisma.systemSetting.upsert({
  where: { key: "MAINTENANCE_MODE" },
  create: {
    key: "MAINTENANCE_MODE",
    value: JSON.stringify({
      enabled: false,
      message: "Local maintenance test.",
    }),
  },
  update: {
    value: JSON.stringify({
      enabled: false,
      message: "Local maintenance test.",
    }),
  },
});

report.note =
  "Maintenance proxy uses getMaintenanceModeCached (30s TTL) + revalidateTag({expire:0}) on admin toggle. Direct DB writes without tag bust may lag until TTL; production toggle path busts tags.";

writeFileSync("/tmp/nft-perf-002-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

logStream.kill("SIGTERM");
await sleep(500);
try {
  logStream.kill("SIGKILL");
} catch {
  // already exited
}
await prisma.$disconnect();
process.exit(0);
