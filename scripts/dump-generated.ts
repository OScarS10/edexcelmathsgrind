import { writeFileSync } from "node:fs";
import { sampleVerificationSpecs } from "@/lib/nn/question-generator";

const specs = sampleVerificationSpecs(25);
writeFileSync(
  "python/generated_specs.json",
  JSON.stringify({ specs }, null, 2) + "\n",
  "utf-8",
);
console.log(`Wrote ${specs.length} generated-question verification specs to python/generated_specs.json`);
