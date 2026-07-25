#!/usr/bin/env node

// Codex adapter for the vendored Project-System. The canonical Claude guard
// understands Write/Edit payloads; Codex reports apply_patch with one patch
// command. This adapter protects the immutable vendored core before a patch and
// validates the real graph after edits and at turn completion.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

function readPayload() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function findRoot(cwd) {
  try {
    return execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return cwd;
  }
}

function patchPaths(command) {
  const paths = [];
  for (const line of String(command ?? "").split(/\r?\n/)) {
    const match =
      line.match(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$/) ??
      line.match(/^\*\*\* Move to:\s*(.+?)\s*$/);
    if (match) paths.push(match[1]);
  }
  return paths;
}

function inside(candidatePath, directory) {
  const rel = relative(directory, candidatePath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function deny(reason) {
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })}\n`,
  );
}

function validate(root) {
  const validator = resolve(root, ".project-system/tools/validate.mjs");
  const config = resolve(root, "project-system.config.json");
  if (!existsSync(validator) || !existsSync(config)) {
    return { ok: false, message: "Project-System validator or config is missing." };
  }

  const result = spawnSync(
    process.execPath,
    [validator, "--root", root, "--config", config, "--json"],
    { cwd: root, encoding: "utf8" },
  );

  try {
    const report = JSON.parse(result.stdout);
    const summary = report.summary ?? {};
    const message =
      `[${summary.project ?? "project-system"}] ${summary.files ?? 0} files · ` +
      `${summary.error ?? 0} errors · ${summary.warning ?? 0} warnings · ` +
      `${summary.info ?? 0} info`;
    return { ok: result.status === 0 && summary.error === 0, message };
  } catch {
    const detail = (result.stderr || result.stdout || "validator failed").trim();
    return {
      ok: false,
      message: `Project-System validation could not run: ${detail}`,
    };
  }
}

const payload = readPayload();
const cwd = payload.cwd || process.cwd();
const root = findRoot(cwd);
const event = payload.hook_event_name;

if (event === "PreToolUse") {
  const vendored = resolve(root, ".project-system");
  const command = payload.tool_input?.command;
  const touchesCore = patchPaths(command).some((candidate) => {
    const absolute = isAbsolute(candidate) ? resolve(candidate) : resolve(cwd, candidate);
    return inside(absolute, vendored);
  });
  if (touchesCore) {
    deny(
      ".project-system is a vendored immutable mirror. Re-vendor schema, lib, and tools from the canonical Project-System checkout instead of patching it in place.",
    );
  }
  process.exit(0);
}

const result = validate(root);

if (event === "SessionStart") {
  process.stdout.write(`${result.message}\n`);
} else if (event === "PostToolUse" && !result.ok) {
  process.stdout.write(
    `${JSON.stringify({
      systemMessage: `${result.message}. Fix the Project-System graph before continuing.`,
    })}\n`,
  );
} else if (event === "Stop" && !result.ok) {
  process.stdout.write(
    `${JSON.stringify({
      decision: "block",
      reason: `${result.message}. Repair the graph and validate again before finishing.`,
      systemMessage: `${result.message}. Repair the graph and validate again before finishing.`,
    })}\n`,
  );
}
