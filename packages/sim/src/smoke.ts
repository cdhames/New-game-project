import { smokeStudy } from "./index.js";

process.stdout.write(
  `${JSON.stringify({ study: "phase1-smoke", deterministic: true, results: smokeStudy(100) }, null, 2)}\n`,
);
