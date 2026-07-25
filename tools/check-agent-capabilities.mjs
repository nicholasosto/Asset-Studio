#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const quiet = process.argv.includes("--quiet");
const registryPath = path.join(root, "agent-assets", "capabilities.yaml");
const errors = [];
const warnings = [];

const error = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

function resolveRegisteredPath(value) {
  if (!value) return null;
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (cause) {
    error(`${file}: invalid JSON-compatible YAML (${cause.message})`);
    return null;
  }
}

function readFrontmatter(file) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.+?)\s*$/);
    if (field) result[field[1]] = field[2].replace(/^["']|["']$/g, "");
  }
  return result;
}

function walkTextFiles(directory) {
  const found = [];
  const stack = [directory];
  const allowed = new Set([".md", ".json", ".yaml", ".yml", ".py", ".sh", ".mjs"]);

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.name === "__pycache__" || entry.name.endsWith(".pyc")) {
        error(`generated Python bytecode in canonical skill source: ${path.relative(root, absolute)}`);
        continue;
      }
      if (entry.name === ".DS_Store") continue;
      if (entry.isDirectory()) stack.push(absolute);
      else if (allowed.has(path.extname(entry.name))) found.push(absolute);
    }
  }
  return found;
}

function discoverSkillFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  const visited = new Set();
  const stack = [directory];

  while (stack.length) {
    const current = stack.pop();
    const realCurrent = fs.realpathSync.native(current);
    if (visited.has(realCurrent)) continue;
    visited.add(realCurrent);

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.name === "SKILL.md" && (entry.isFile() || entry.isSymbolicLink())) {
        found.push(absolute);
        continue;
      }
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else if (entry.isSymbolicLink()) {
        try {
          if (fs.statSync(absolute).isDirectory()) stack.push(absolute);
        } catch {
          // Broken install links are reported by their registered capability check.
        }
      }
    }
  }

  return found;
}

function collectTreeFiles(directory) {
  const files = [];
  const stack = [directory];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".DS_Store" || entry.name === "__pycache__" || entry.name.endsWith(".pyc")) {
        continue;
      }
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile() || entry.isSymbolicLink()) {
        files.push(path.relative(directory, absolute));
      }
    }
  }

  return files.sort();
}

const registry = readJson(registryPath);
if (!registry) process.exitCode = 1;

if (registry) {
  if (registry.schemaVersion !== "1.0.0") {
    error(`unsupported capabilities schema ${registry.schemaVersion ?? "(missing)"}`);
  }
  const inventoryPath = path.join(
    root,
    "agent-assets",
    `inventory-${registry.verifiedAt}.md`
  );
  if (!fs.existsSync(inventoryPath)) {
    error(`dated capability inventory is missing: ${inventoryPath}`);
  }

  const seen = new Set();
  const owned = new Set();
  const forbidden = [
    "/Users/nicholasosto/GameDev",
    "assets/ai-output/"
  ];

  for (const capability of registry.capabilities ?? []) {
    if (!capability.id) {
      error("capability without id");
      continue;
    }
    if (seen.has(capability.id)) error(`duplicate capability id: ${capability.id}`);
    seen.add(capability.id);

    const canonical = resolveRegisteredPath(capability.canonicalPath);
    if (capability.canonicalPath && !fs.existsSync(canonical)) {
      error(`${capability.id}: canonical path missing: ${canonical}`);
      continue;
    }

    if (capability.kind === "owned-skill") {
      owned.add(capability.id);
      const skillFile = path.join(canonical, "SKILL.md");
      if (!fs.existsSync(skillFile)) {
        error(`${capability.id}: missing SKILL.md`);
        continue;
      }

      const frontmatter = readFrontmatter(skillFile);
      if (frontmatter.name !== capability.id) {
        error(`${capability.id}: SKILL name is ${frontmatter.name ?? "(missing)"}`);
      }
      if (frontmatter.version !== capability.version) {
        error(
          `${capability.id}: registry version ${capability.version} does not match SKILL ${frontmatter.version ?? "(missing)"}`
        );
      }

      for (const file of walkTextFiles(canonical)) {
        const source = fs.readFileSync(file, "utf8");
        for (const stale of forbidden) {
          if (source.includes(stale)) {
            error(`${capability.id}: retired path "${stale}" in ${path.relative(root, file)}`);
          }
        }
      }

      for (const install of capability.installs ?? []) {
        if (!fs.existsSync(install.path)) {
          error(`${capability.id}: ${install.runtime} install missing: ${install.path}`);
          continue;
        }
        if (install.mode === "symlink") {
          const stat = fs.lstatSync(install.path);
          if (!stat.isSymbolicLink()) {
            error(`${capability.id}: ${install.runtime} install is not a symlink: ${install.path}`);
            continue;
          }
          const installedTarget = fs.realpathSync.native(install.path);
          const canonicalTarget = fs.realpathSync.native(canonical);
          if (installedTarget !== canonicalTarget) {
            error(
              `${capability.id}: ${install.runtime} resolves to ${installedTarget}, expected ${canonicalTarget}`
            );
          }
        }
      }
    }

    if (capability.kind === "external-skill" && capability.version && canonical) {
      const skillFile = path.join(canonical, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        const frontmatter = readFrontmatter(skillFile);
        if (frontmatter.version !== capability.version) {
          error(
            `${capability.id}: registered version ${capability.version} does not match source ${frontmatter.version ?? "(missing)"}`
          );
        }
      }
    }

    if (capability.kind === "external-skill" && capability.sourceCommit && canonical) {
      try {
        const sourceHead = execFileSync("git", ["-C", canonical, "rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim();
        if (sourceHead !== capability.sourceCommit) {
          error(
            `${capability.id}: registered source commit ${capability.sourceCommit} does not match HEAD ${sourceHead}`
          );
        }
      } catch (cause) {
        error(`${capability.id}: could not verify source commit (${cause.message})`);
      }
    }

    if (capability.kind === "external-skill" && canonical) {
      if (
        capability.availability === "project-local-handoff" &&
        (capability.installs ?? []).some((install) => install.scope !== "project-local")
      ) {
        error(`${capability.id}: project-local handoff install is missing project-local scope`);
      }
      for (const install of capability.installs ?? []) {
        if (!fs.existsSync(install.path)) {
          error(`${capability.id}: ${install.runtime} install missing: ${install.path}`);
          continue;
        }

        if (install.registry && install.registryId) {
          if (!fs.existsSync(install.registry)) {
            error(`${capability.id}: ${install.runtime} registry missing: ${install.registry}`);
          } else {
            const installRegistry = readJson(install.registry);
            const records = installRegistry?.plugins?.[install.registryId] ?? [];
            const expectedVersion = install.pluginVersion ?? capability.version;
            if (!records.some((record) => record.version === expectedVersion)) {
              error(
                `${capability.id}: ${install.runtime} registry does not record version ${expectedVersion}`
              );
            }
          }
        }

        if (install.mode === "symlink" || install.mode === "plugin-source-symlink") {
          const installedTarget = fs.realpathSync.native(install.path);
          const canonicalTarget = fs.realpathSync.native(canonical);
          if (installedTarget !== canonicalTarget) {
            error(
              `${capability.id}: ${install.runtime} resolves to ${installedTarget}, expected ${canonicalTarget}`
            );
          }
        }

        if (install.mode === "skill-file-symlink") {
          const installedSkill = path.join(install.path, "SKILL.md");
          const canonicalSkill = path.join(canonical, "SKILL.md");
          if (!fs.existsSync(installedSkill)) {
            error(`${capability.id}: ${install.runtime} SKILL.md is missing`);
          } else if (
            fs.realpathSync.native(installedSkill) !== fs.realpathSync.native(canonicalSkill)
          ) {
            error(`${capability.id}: ${install.runtime} SKILL.md does not resolve to canonical`);
          }
        }

        if (install.mode === "generated-plugin-cache") {
          const sourceFiles = collectTreeFiles(canonical);
          const installedFiles = collectTreeFiles(install.path);
          if (JSON.stringify(installedFiles) !== JSON.stringify(sourceFiles)) {
            error(
              `${capability.id}: ${install.runtime} generated cache file set differs from canonical`
            );
          } else {
            for (const relativeFile of sourceFiles) {
              const installedFile = path.join(install.path, relativeFile);
              const canonicalFile = path.join(canonical, relativeFile);
              if (!fs.readFileSync(installedFile).equals(fs.readFileSync(canonicalFile))) {
                error(
                  `${capability.id}: ${install.runtime} generated cache differs at ${relativeFile}`
                );
              }
            }
          }
        }
      }
    }

    if (capability.kind === "vendor-adapter") {
      const installs = capability.installs ?? [];
      for (const install of installs) {
        if (install.path && !fs.existsSync(install.path)) {
          error(`${capability.id}: observed ${install.runtime} path is missing: ${install.path}`);
          continue;
        }
        if (
          !install.lastUpdated &&
          !install.lastObserved &&
          !install.registryLastUpdated
        ) {
          error(`${capability.id}: ${install.runtime} observation has no update/observation date`);
        }
        if (
          install.path &&
          capability.version &&
          capability.version !== "unversioned"
        ) {
          const pluginManifest = path.join(
            install.path,
            ".codex-plugin",
            "plugin.json"
          );
          if (fs.existsSync(pluginManifest)) {
            const installedManifest = readJson(pluginManifest);
            if (
              installedManifest &&
              installedManifest.version !== capability.version
            ) {
              error(
                `${capability.id}: observed ${install.runtime} plugin version ${installedManifest.version} does not match ${capability.version}`
              );
            }
          }
        }
      }
      if (capability.id === "figma") {
        const activeCodex = installs.filter(
          (install) =>
            install.runtime === "codex" &&
            install.state === "installed-enabled"
        );
        if (activeCodex.length !== 1) {
          error(`figma: expected one active Codex integration, found ${activeCodex.length}`);
        }
        const claude = installs.find((install) => install.runtime === "claude");
        if (!claude || claude.state !== "unverified") {
          error("figma: Claude availability must remain explicitly unverified until proven");
        }
      }
    }
  }

  const skillsRoot = path.join(
    root,
    "agent-assets",
    "plugins",
    "asset-production",
    "skills"
  );
  const skillDirectories = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const directory of skillDirectories) {
    if (!owned.has(directory)) error(`unregistered owned skill directory: ${directory}`);
  }
  for (const id of owned) {
    if (!skillDirectories.includes(id)) error(`registered owned skill directory missing: ${id}`);
  }

  for (const [runtime, skillsRoot] of [
    ["Codex", path.join(process.env.HOME ?? "", ".codex", "skills")],
    ["Claude", path.join(process.env.HOME ?? "", ".claude", "skills")]
  ]) {
    const discoveredSkills = discoverSkillFiles(skillsRoot).map((file) => ({
      file,
      frontmatter: readFrontmatter(file)
    }));
    for (const id of owned) {
      const canonicalSkill = fs.realpathSync.native(
        path.join(root, "agent-assets", "plugins", "asset-production", "skills", id, "SKILL.md")
      );
      const matches = discoveredSkills.filter(({ frontmatter }) => frontmatter.name === id);
      if (matches.length !== 1) {
        error(`${runtime} discovers ${matches.length} copies of owned skill ${id}; expected exactly one`);
      } else if (fs.realpathSync.native(matches[0].file) !== canonicalSkill) {
        error(`${id}: ${runtime}-discovered SKILL.md does not resolve to canonical source`);
      }
    }
    for (const legacyName of ["figma", "figma-implement-design"]) {
      const matches = discoveredSkills.filter(
        ({ frontmatter }) => frontmatter.name === legacyName
      );
      if (matches.length) {
        error(
          `${runtime} still discovers legacy standalone skill ${legacyName}: ${matches
            .map(({ file }) => file)
            .join(", ")}`
        );
      }
    }
  }

  const pluginRoot = path.join(
    root,
    "agent-assets",
    "plugins",
    "asset-production"
  );
  const bundle = registry.pluginBundle ?? {};
  if (
    bundle.id !== "asset-production" ||
    bundle.version !== "0.1.0" ||
    bundle.distribution !== "local-source" ||
    bundle.marketplaceReady !== false
  ) {
    error("pluginBundle must declare asset-production 0.1.0 as non-marketplace local-source");
  }

  const manifests = new Map();
  for (const manifestName of [".claude-plugin", ".codex-plugin"]) {
    const manifestPath = path.join(
      pluginRoot,
      manifestName,
      "plugin.json"
    );
    const manifest = readJson(manifestPath);
    if (!manifest) continue;
    manifests.set(manifestName, manifest);
    if (manifest.name !== bundle.id) {
      error(`${manifestName} manifest name is ${manifest.name}, expected ${bundle.id}`);
    }
    if (manifest.version !== bundle.version) {
      error(
        `${manifestName} manifest version is ${manifest.version}, expected ${bundle.version}`
      );
    }
    if (manifest.skills !== "./skills") {
      error(`${manifestName} manifest skills path must be ./skills`);
    } else if (path.resolve(pluginRoot, manifest.skills) !== path.resolve(skillsRoot)) {
      error(`${manifestName} manifest skills path does not resolve to the owned skill root`);
    }
  }

  const claudeManifest = manifests.get(".claude-plugin");
  const codexManifest = manifests.get(".codex-plugin");
  if (claudeManifest && codexManifest) {
    for (const field of [
      "name",
      "version",
      "description",
      "author",
      "keywords",
      "skills",
    ]) {
      if (JSON.stringify(claudeManifest[field]) !== JSON.stringify(codexManifest[field])) {
        error(`Claude/Codex plugin manifests differ at ${field}`);
      }
    }
  }

  if (codexManifest) {
    const requiredInterface = [
      "displayName",
      "shortDescription",
      "longDescription",
      "developerName",
      "category",
      "capabilities",
      "defaultPrompt",
    ];
    for (const field of requiredInterface) {
      if (!(field in (codexManifest.interface ?? {}))) {
        error(`Codex plugin interface is missing ${field}`);
      }
    }
    if (bundle.marketplaceReady) {
      for (const field of ["websiteURL", "privacyPolicyURL", "termsOfServiceURL"]) {
        if (!(field in (codexManifest.interface ?? {}))) {
          error(`marketplace-ready Codex plugin interface is missing ${field}`);
        }
      }
    }
  }
}

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

const codexConfig = path.join(process.env.HOME ?? "", ".codex", "config.toml");
if (fs.existsSync(codexConfig)) {
  const source = fs.readFileSync(codexConfig, "utf8");
  if (/^\[mcp_servers\.figma\]\s*$/m.test(source)) {
    error("Codex still has the duplicate direct Figma MCP registration");
  }
  if (/^\[plugins\."figma@openai-curated"\]\s*$/m.test(source)) {
    error("Codex still has the superseded figma@openai-curated registration");
  }
}

if (!quiet || errors.length || warnings.length) {
  console.log(
    `Agent capabilities: ${errors.length} error(s), ${warnings.length} warning(s)`
  );
  for (const message of errors) console.log(`ERROR ${message}`);
  for (const message of warnings) console.log(`WARN  ${message}`);
}

if (errors.length) process.exitCode = 1;
