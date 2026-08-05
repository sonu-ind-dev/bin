import { performance } from "perf_hooks";
import config from "../src/config/config.js";

const [, , target = config.APP_URL, totalRequestsArg = "2000", concurrencyArg = "200"] = process.argv;
const totalRequests = Number(totalRequestsArg);
const concurrency = Number(concurrencyArg);
const path = "/api/auth/register";

if (!target.startsWith("http://") && !target.startsWith("https://")) {
  throw new Error("Target must start with http:// or https://");
}

if (Number.isNaN(totalRequests) || totalRequests < 1) {
  throw new Error("Total requests must be a positive integer.");
}

if (Number.isNaN(concurrency) || concurrency < 1) {
  throw new Error("Concurrency must be a positive integer.");
}

let nextIndex = 0;
let completed = 0;
let successCount = 0;
let failureCount = 0;
let totalLatencyMs = 0;
let minLatencyMs = Number.POSITIVE_INFINITY;
let maxLatencyMs = 0;
let firstError;

const startTime = performance.now();

function buildPayload(index) {
  const suffix = String(index + Date.now()).padStart(12, "0");
  return {
    phone_number: `999${suffix.slice(-10)}`,
    password: `TestPassword!${suffix}`,
  };
}

async function sendRequest(index) {
  const payload = buildPayload(index);
  const requestStart = performance.now();

  try {
    const response = await fetch(`${target}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const latency = performance.now() - requestStart;
    totalLatencyMs += latency;
    minLatencyMs = Math.min(minLatencyMs, latency);
    maxLatencyMs = Math.max(maxLatencyMs, latency);

    if (response.ok) {
      successCount += 1;
    } else {
      failureCount += 1;
      if (!firstError) {
        const body = await response.text();
        firstError = `HTTP ${response.status}: ${body}`;
      }
    }
  } catch (error) {
    const latency = performance.now() - requestStart;
    totalLatencyMs += latency;
    minLatencyMs = Math.min(minLatencyMs, latency);
    maxLatencyMs = Math.max(maxLatencyMs, latency);
    failureCount += 1;
    if (!firstError) {
      firstError = error.message;
    }
  } finally {
    completed += 1;
    if (completed % Math.max(1, Math.floor(totalRequests / 10)) === 0) {
      console.log(`Progress: ${completed}/${totalRequests} completed`);
    }
  }
}

async function worker() {
  while (true) {
    const index = nextIndex;
    if (index >= totalRequests) {
      break;
    }
    nextIndex += 1;
    await sendRequest(index);
  }
}

async function run() {
  console.time("EXECUTE: Testing Execusion Time");
  console.log(`Starting load test: ${totalRequests} requests, concurrency ${concurrency}, target ${target}${path}`);

  const workers = new Array(Math.min(concurrency, totalRequests)).fill(null).map(() => worker());
  await Promise.all(workers);

  console.time("EXECUTE: Testing Execusion Time");

  const durationSeconds = (performance.now() - startTime) / 1000;
  const averageLatency = completed > 0 ? totalLatencyMs / completed : 0;
  const rps = completed / Math.max(durationSeconds, 0.0001);

  console.log("\nLoad test finished");
  console.log(`Total requests: ${completed}`);
  console.log(`Successes: ${successCount}`);
  console.log(`Failures: ${failureCount}`);
  console.log(`Duration: ${durationSeconds.toFixed(2)}s`);
  console.log(`Requests/sec: ${rps.toFixed(2)}`);
  console.log(`Average latency: ${averageLatency.toFixed(2)}ms`);
  console.log(`Min latency: ${minLatencyMs.toFixed(2)}ms`);
  console.log(`Max latency: ${maxLatencyMs.toFixed(2)}ms`);

  if (firstError) {
    console.log(`First error: ${firstError}`);
  }
}

run().catch((error) => {
  console.error("Load test failed:", error.message || error);
  process.exit(1);
});
