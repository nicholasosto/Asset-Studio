#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFrontmatter, validateCapabilities } from "./lib/agent-capabilities.mjs";

const defaultRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Preserved from main: this delivery does not adopt the local routing helper or
// its idle/active protocol. Keep this boundary independently testable.
export function validateGenerationRoutingLegacy(root) {
  const errors = [];
  const error = (message) => errors.push(message);
const activePath = path.join(root, "generation", "ACTIVE.md");
if (!fs.existsSync(activePath)) {
  error("generation/ACTIVE.md is missing");
} else {
  const active = fs.readFileSync(activePath, "utf8");
  const activeFrontmatter = readFrontmatter(activePath);
  const contractMatch = active.match(/contracts\/([a-z0-9][a-z0-9-]*\.md)/);
  if (!contractMatch) {
    error("generation/ACTIVE.md does not identify an immutable contract");
  } else {
    const contractPath = path.join(root, "generation", "contracts", contractMatch[1]);
    if (!fs.existsSync(contractPath)) {
      error(`active generation contract is missing: ${contractPath}`);
    } else {
      const contract = fs.readFileSync(contractPath, "utf8");
      const batchPath = path.join(root, "generation", "BATCH.md");
      if (!fs.existsSync(batchPath)) {
        error("generation/BATCH.md is missing");
      } else {
        const batch = fs.readFileSync(batchPath, "utf8");
        const sharedMarker = "- **Batch id:**";
        const contractFilenameId = path.basename(contractPath, ".md");
        const contractBodyId = contract.match(/^- \*\*Batch id:\*\* `([^`]+)`\s*$/m)?.[1];
        const batchBodyId = batch.match(/^- \*\*Batch id:\*\* `([^`]+)`\s*$/m)?.[1];
        const identityValues = [
          activeFrontmatter.batch,
          contractFilenameId,
          contractBodyId,
          batchBodyId,
        ];
        if (
          identityValues.some((value) => !value) ||
          new Set(identityValues).size !== 1
        ) {
          error(
            `active generation identity mismatch: ${identityValues
              .map((value) => value ?? "(missing)")
              .join(" != ")}`
          );
        }
        const contractBody = contract.slice(contract.indexOf(sharedMarker));
        const batchBody = batch.slice(batch.indexOf(sharedMarker));
        if (
          !contractBody.startsWith(sharedMarker) ||
          !batchBody.startsWith(sharedMarker) ||
          contractBody !== batchBody
        ) {
          error("generation/BATCH.md substantive content differs from the active immutable contract");
        }
      }
    }
  }
}
  return errors;
}

function validateLegacyCodexConfiguration(home) {
  const errors = [];
  const error = (message) => errors.push(message);
const codexConfig = path.join(home, ".codex", "config.toml");
if (fs.existsSync(codexConfig)) {
  const source = fs.readFileSync(codexConfig, "utf8");
  if (/^\[mcp_servers\.figma\]\s*$/m.test(source)) {
    error("Codex still has the duplicate direct Figma MCP registration");
  }
  if (/^\[plugins\."figma@openai-curated"\]\s*$/m.test(source)) {
    error("Codex still has the superseded figma@openai-curated registration");
  }
}
  return errors;
}

export function runCli({
  root = defaultRoot,
  sourceRoot,
  home = os.homedir(),
  now = new Date(),
  registry,
  claudePlugins,
  write = (line) => console.log(line),
  quiet = false,
  json = false,
} = {}) {
  let report;
  try {
    report = validateCapabilities({ root, sourceRoot, home, now, registry, claudePlugins });
  } catch (cause) {
    report = { errors: [`capability validation failed: ${cause.message}`], warnings: [], findings: [], exitCode: 1 };
  }
  try {
    for (const message of validateGenerationRoutingLegacy(root)) {
      report.errors.push(message);
      report.findings.push({ id: "generation-routing", dimension: "routing", status: "fail", message });
    }
  } catch (cause) {
    const message = `generation routing could not be validated: ${cause.message}`;
    report.errors.push(message);
    report.findings.push({ id: "generation-routing", dimension: "routing", status: "fail", message });
  }
  try {
    for (const message of validateLegacyCodexConfiguration(home)) {
      report.errors.push(message);
      report.findings.push({ id: "codex-configuration", dimension: "configuration", status: "fail", message });
    }
  } catch (cause) {
    report.errors.push(`Codex configuration could not be validated: ${cause.message}`);
  }
  report.exitCode = report.errors.length ? 1 : 0;
  if (json) {
    write(JSON.stringify(report, null, 2));
  } else if (!quiet || report.errors.length || report.warnings.length) {
    write(`Agent capabilities: ${report.errors.length} required finding(s), ${report.warnings.length} advisory finding(s)`);
    for (const message of report.errors) write(`ERROR ${message}`);
    for (const message of report.warnings) write(`WARN  ${message}`);
    for (const finding of report.findings) {
      if (!["pass", "fail", "error", "review-required"].includes(finding.status)) {
        write(`STATUS ${finding.id} ${finding.dimension}: ${finding.status} — ${finding.message}`);
      }
    }
  }
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const unsupported = args.filter((argument) => !["--quiet", "--json"].includes(argument));
  if (unsupported.length) {
    console.error(`Unsupported argument(s): ${unsupported.join(", ")}`);
    process.exitCode = 1;
  } else {
    process.exitCode = runCli({ quiet: args.includes("--quiet"), json: args.includes("--json") }).exitCode;
  }
}
