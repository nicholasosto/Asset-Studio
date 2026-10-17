import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const KINDS = new Set(["owned-skill", "external-skill", "vendor-adapter", "pending-local-skill"]);
const STATES = new Set(["enabled", "available", "session-exposed", "unverified", "not-installed", "not-locally-available", "retained", "cached-unverified"]);
const MODES = new Set(["symlink", "skill-file-symlink", "project-skill", "local-skill", "frozen-plugin-cache", "directory-source", "vendor-plugin-cache", "built-in-tool", "remote-connector", "handoff", "vendor-skill"]);
const SOURCE_STATES = new Set(["committed", "local-unreviewed", "unversioned"]);
const NO_PATH = new Set(["built-in-tool", "remote-connector", "handoff"]);
const HEX40 = /^[a-f0-9]{40}$/;
const HEX64 = /^[a-f0-9]{64}$/;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const inside = (parent, child) => { const rel = path.relative(parent, child); return rel === "" || (!path.isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${path.sep}`)); };
const git = (root, ...args) => execFileSync("git", ["-C", root, ...args], { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
const gitText = (root, ...args) => git(root, ...args).toString("utf8").trim();
const repoIdentity = (value) => typeof value === "string" ? value.replace(/\/$/, "").replace(/\.git$/, "").replace(/^git@([^:]+):/, "https://$1/") : value;

function scalar(source) {
  const value = source.trim();
  if (!value) throw new Error("empty or nested scalar is unsupported");
  if (value.startsWith('"')) {
    const match = value.match(/^"(?:[^"\\]|\\.)*"/);
    if (!match || !/^\s*(?:#.*)?$/.test(value.slice(match[0].length))) throw new Error("invalid quoted scalar");
    try { return JSON.parse(match[0]); } catch { throw new Error("invalid double-quoted scalar"); }
  }
  if (value.startsWith("'")) {
    const match = value.match(/^'(?:[^']|'')*'/);
    if (!match || !/^\s*(?:#.*)?$/.test(value.slice(match[0].length))) throw new Error("invalid single-quoted scalar");
    return match[0].slice(1, -1).replace(/''/g, "'");
  }
  const plain = value.replace(/\s+#.*$/, "").trimEnd();
  if (!plain || /^[\[\]{}!&*|>]/.test(plain) || /:\s/.test(plain)) throw new Error("unsupported scalar syntax");
  return plain;
}

/** A deliberately limited frontmatter reader, not a general YAML parser. */
export function parseFrontmatter(source) {
  if (typeof source !== "string") throw new Error("frontmatter source must be a string");
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") return {};
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error("unterminated frontmatter");
  const result = {};
  let section = null;
  let block = false;
  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    if (/^[ \t]/.test(line)) {
      if (block) continue;
      if (section !== "metadata") throw new Error("unsupported nested frontmatter");
      const match = line.match(/^ {2}([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
      if (!match) throw new Error("metadata must be a flat string mapping");
      if (Object.hasOwn(result.metadata, match[1])) throw new Error(`duplicate metadata key ${match[1]}`);
      result.metadata[match[1]] = scalar(match[2]);
      continue;
    }
    section = null;
    block = false;
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) throw new Error("unsupported frontmatter syntax");
    const [, key, value] = match;
    if (Object.hasOwn(result, key)) throw new Error(`duplicate frontmatter key ${key}`);
    if (key === "metadata" && /^\s*(?:#.*)?$/.test(value)) {
      result.metadata = {};
      section = "metadata";
    } else if (key === "metadata") {
      throw new Error("metadata must be a flat string mapping");
    } else if (key === "description" && /^[>|][+-]?\s*(?:#.*)?$/.test(value)) {
      result.description = "";
      block = true;
    } else {
      result[key] = scalar(value);
    }
  }
  const declared = result.metadata?.source_version;
  if (result.version && declared && result.version !== declared) throw new Error("conflicting version and metadata.source_version");
  if (!result.version && declared) result.version = declared;
  return result;
}

export function readFrontmatter(file) { return parseFrontmatter(fs.readFileSync(file, "utf8")); }

function safeRelative(value) {
  return nonempty(value) && !path.isAbsolute(value) && !value.includes("\\") && value.split("/").every((part) => part && part !== "." && part !== "..");
}

function treeFiles(directory) {
  if (!fs.lstatSync(directory).isDirectory()) throw new Error("named artifact subtree root must be a directory, not a symlink");
  const files = Object.create(null);
  const realRoot = fs.realpathSync(directory);
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(directory, absolute).split(path.sep).join("/");
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(absolute);
        if (path.isAbsolute(target) || !inside(path.resolve(directory), path.resolve(path.dirname(absolute), target))) throw new Error(`escaping symlink ${relative}`);
        if (!inside(realRoot, fs.realpathSync(absolute))) throw new Error(`escaping symlink ${relative}`);
        files[relative] = { mode: "120000", sha256: hash(target) };
      } else if (stat.isDirectory()) visit(absolute);
      else if (stat.isFile()) files[relative] = { mode: stat.mode & 0o111 ? "100755" : "100644", sha256: hash(fs.readFileSync(absolute)) };
      else throw new Error(`unsupported file type ${relative}`);
    }
  }
  visit(directory);
  return files;
}

function equalFiles(expected, actual) {
  const errors = [];
  for (const name of Object.keys(expected)) {
    if (!Object.hasOwn(actual, name)) errors.push(`missing file ${name}`);
    else if (expected[name].mode !== actual[name].mode) errors.push(`mode differs at ${name}`);
    else if (expected[name].sha256 !== actual[name].sha256) errors.push(`hash differs at ${name}`);
  }
  for (const name of Object.keys(actual)) if (!Object.hasOwn(expected, name)) errors.push(`extra file ${name}`);
  return errors;
}

function artifactTree(artifact) {
  if (!object(artifact) || !nonempty(artifact.repository) || !nonempty(artifact.root) || !HEX40.test(artifact.commit ?? "") || !safeRelative(artifact.path) || !object(artifact.files) || Object.keys(artifact.files).length === 0) throw new Error("invalid immutable source artifact");
  if (!path.isAbsolute(artifact.root)) throw new Error("artifact root must be absolute");
  if (artifact.version !== undefined && !nonempty(artifact.version)) throw new Error("artifact version must be a nonempty string");
  for (const [name, file] of Object.entries(artifact.files)) {
    if (!safeRelative(name) || !object(file) || !["100644", "100755", "120000"].includes(file.mode) || !HEX64.test(file.sha256 ?? "")) throw new Error(`invalid artifact file ${name}`);
  }
  const actualOrigin = gitText(artifact.root, "remote", "get-url", "origin");
  if (fs.realpathSync(gitText(artifact.root, "rev-parse", "--show-toplevel")) !== fs.realpathSync(artifact.root)) throw new Error("artifact root must be the Git repository root");
  if (repoIdentity(actualOrigin) !== repoIdentity(artifact.repository)) throw new Error("artifact repository origin identity differs");
  if (gitText(artifact.root, "rev-parse", `${artifact.commit}^{commit}`) !== artifact.commit) throw new Error("artifact commit does not resolve exactly");
  if (gitText(artifact.root, "cat-file", "-t", `${artifact.commit}:${artifact.path}`) !== "tree") throw new Error("artifact path is not a Git directory");
  const files = Object.create(null);
  for (const record of git(artifact.root, "ls-tree", "-rz", artifact.commit, "--", `${artifact.path}/`).toString("utf8").split("\0").filter(Boolean)) {
    const match = record.match(/^(\d+) (\S+) ([a-f0-9]{40})\t([\s\S]*)$/);
    if (!match || match[2] !== "blob") throw new Error("artifact subtree contains unsupported Git entry");
    const [, mode, , oid, fullPath] = match;
    const name = fullPath.slice(artifact.path.length + 1);
    if (!safeRelative(name)) throw new Error("artifact file path escapes subtree");
    const bytes = git(artifact.root, "cat-file", "blob", oid);
    if (mode === "120000") {
      const target = bytes.toString("utf8");
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
      if (path.posix.isAbsolute(target) || resolved === ".." || resolved.startsWith("../")) throw new Error(`escaping Git symlink ${name}`);
    }
    files[name] = { mode, sha256: hash(bytes) };
  }
  const differences = equalFiles(artifact.files, files);
  if (differences.length) throw new Error(`artifact Git manifest differs: ${differences.join("; ")}`);
  return files;
}

function relevantConfig(file) {
  const result = { plugins: {}, marketplaces: {} };
  if (!fs.existsSync(file)) return result;
  let selected = null;
  const sections = new Set();
  for (const sourceLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("[")) {
      selected = null;
      const match = line.match(/^\[(plugins|marketplaces)\.(?:"([^"\\]+)"|([A-Za-z0-9_-]+))\]\s*(?:#.*)?$/);
      if (match) {
        const name = match[2] ?? match[3];
        const key = `${match[1]}.${name}`;
        if (sections.has(key)) throw new Error(`duplicate config section ${key}`);
        sections.add(key);
        result[match[1]][name] = {};
        selected = result[match[1]][name];
      } else if (/^\[(plugins|marketplaces)\./.test(line)) throw new Error("unsupported relevant plugin config section");
      continue;
    }
    if (!selected) continue;
    const field = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.*)$/);
    if (!field) throw new Error("unsupported relevant plugin config declaration");
    if (Object.hasOwn(selected, field[1])) throw new Error(`duplicate config key ${field[1]}`);
    const value = field[2].trim();
    const boolean = value.match(/^(true|false)\s*(?:#.*)?$/);
    if (boolean) selected[field[1]] = boolean[1] === "true";
    else selected[field[1]] = scalar(value);
  }
  return result;
}

function discoverSkills(directory) {
  const found = [];
  function visit(current, ancestors = new Set()) {
    let real;
    try { real = fs.realpathSync(current); } catch { return; }
    if (ancestors.has(real)) return;
    const nextAncestors = new Set([...ancestors, real]);
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.name === "SKILL.md") {
        try {
          found.push({ file, real: fs.realpathSync(file), name: readFrontmatter(file).name });
        } catch (cause) {
          // Unsupported unrelated vendor headers are outside this registry's scope.
          // Preserve recognizable owned identities so a malformed duplicate cannot disappear.
          const names = [];
          try {
            const lines = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
            if (lines[0] === "---") {
              const end = lines.indexOf("---", 1);
              for (const line of lines.slice(1, end < 0 ? undefined : end)) {
                const match = line.match(/^(name|"(?:[^"\\]|\\.)*"|'(?:[^']|'')*')\s*:\s*(.*)$/);
                if (match) { try { if (scalar(match[1]) === "name") names.push(scalar(match[2])); } catch { /* Ambiguous identity is not inferred. */ } }
              }
            }
          } catch { /* Broken links cannot be loaded; registered paths report them. */ }
          found.push({ file, names, parseError: cause.message });
        }
      } else if (entry.isDirectory()) visit(file, nextAncestors);
      else if (entry.isSymbolicLink()) { try { if (fs.statSync(file).isDirectory()) visit(file, nextAncestors); } catch { /* Registered install validation handles broken links. */ } }
    }
  }
  if (fs.existsSync(directory)) visit(directory);
  return found;
}

/** Read-only validation of source provenance, native loading and dated observations. */
export function validateCapabilities(options = {}) {
  const { root, home = os.homedir() } = options;
  const errors = [];
  const warnings = [];
  const findings = [];
  const report = (id, dimension, status, message) => {
    findings.push({ id, dimension, status, message });
    if (["error", "review-required"].includes(status)) errors.push(`${id}: ${message}`);
    if (["warning", "newer-guidance-not-adopted"].includes(status)) warnings.push(`${id}: ${message}`);
  };
  const attempt = (id, dimension, fn) => { try { return fn(); } catch (cause) { report(id, dimension, "error", cause.message); return undefined; } };
  const now = new Date(options.now ?? new Date());
  function date(value, label) {
    if (!nonempty(value) || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value) > now.getTime()) throw new Error(`${label} must be a valid non-future ISO date`);
    const calendar = value.slice(0, 10);
    if (new Date(`${calendar}T00:00:00Z`).toISOString().slice(0, 10) !== calendar) throw new Error(`${label} has an invalid calendar date`);
  }
  function observation(value, label) {
    if (!object(value) || !nonempty(value.scope)) throw new Error(`${label} requires scope`);
    date(value.observedAt, `${label}.observedAt`);
  }
  function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
  if (!nonempty(root) || !Number.isFinite(now.getTime())) {
    report("registry", "schema", "error", "root and valid now are required");
    return { errors, warnings, findings, exitCode: 1 };
  }
  const registry = options.registry ?? attempt("registry", "schema", () => readJson(path.join(root, "agent-assets", "capabilities.yaml")));
  if (!object(registry)) {
    report("registry", "schema", "error", "registry must be an object");
    return { errors, warnings, findings, exitCode: 1 };
  }
  const declaredRoot = options.sourceRoot ?? registry.sourceRepository?.root ?? root;
  if (!nonempty(declaredRoot)) {
    report("registry", "schema", "error", "sourceRoot must be a path string");
    return { errors, warnings, findings, exitCode: 1 };
  }
  const sourceRoot = path.resolve(declaredRoot);
  const registeredPath = (value) => path.isAbsolute(value) ? value : path.resolve(sourceRoot, value);
  attempt("registry", "schema", () => {
    if (registry.schemaVersion !== "2.0.0") throw new Error(`unsupported capabilities schema ${registry.schemaVersion ?? "(missing)"}`);
    date(registry.verifiedAt, "verifiedAt");
    if (!fs.existsSync(path.join(root, "agent-assets", `inventory-${registry.verifiedAt}.md`))) throw new Error("dated capability inventory is missing");
    observation(registry.observation, "observation");
    observation(registry.workflowGapReview, "workflowGapReview");
    if (!object(registry.policy)) throw new Error("policy must be an object");
    if (registry.policy.memoryAuthority !== "evidence-only" || registry.policy.cacheAuthority !== "derived-only") throw new Error("policy must preserve evidence-only memory and derived-only cache authority");
    if (!Array.isArray(registry.capabilities) || !Array.isArray(registry.historicalObservations)) throw new Error("capabilities and historicalObservations must be arrays");
    for (const history of registry.historicalObservations) observation(history, "historicalObservations entry");
    if (registry.workingBundleObservation !== undefined) {
      observation(registry.workingBundleObservation, "workingBundleObservation");
      if (registry.workingBundleObservation.state !== "unreviewed" || !nonempty(registry.workingBundleObservation.version)) throw new Error("workingBundleObservation requires unreviewed state and string version");
      const workingBundleRoot = path.join(sourceRoot, "agent-assets", "plugins", "asset-production");
      for (const folder of [".claude-plugin", ".codex-plugin"]) {
        const file = path.join(workingBundleRoot, folder, "plugin.json");
        if (!inside(fs.realpathSync(workingBundleRoot), fs.realpathSync(file))) throw new Error("working bundle manifest escapes bundle root");
        const observedManifest = readJson(file);
        if (observedManifest.name !== registry.pluginBundle?.id || observedManifest.version !== registry.workingBundleObservation.version) throw new Error(`workingBundleObservation differs from current ${folder} manifest`);
      }
      report("asset-production", "source-readiness", "review-required", `working bundle ${registry.workingBundleObservation.version} remains unreviewed; accepted bundle is ${registry.pluginBundle?.version ?? "unknown"}`);
    }
    const source = registry.sourceRepository;
    if (!object(source) || !nonempty(source.root) || !path.isAbsolute(source.root) || !nonempty(source.repository) || !HEX40.test(source.commit ?? "")) throw new Error("sourceRepository requires absolute root, repository and full commit");
    if (repoIdentity(gitText(root, "remote", "get-url", "origin")) !== repoIdentity(source.repository)) throw new Error("validation repository origin differs from sourceRepository");
    if (gitText(root, "rev-parse", `${source.commit}^{commit}`) !== source.commit) throw new Error("sourceRepository commit is unavailable");
    const common = (directory) => fs.realpathSync(gitText(directory, "rev-parse", "--path-format=absolute", "--git-common-dir"));
    if (common(root) !== common(sourceRoot)) {
      if (repoIdentity(gitText(sourceRoot, "remote", "get-url", "origin")) !== repoIdentity(source.repository) || gitText(sourceRoot, "rev-parse", `${source.commit}^{commit}`) !== source.commit) throw new Error("sourceRoot is not the declared owning repository");
    }
    if (path.resolve(registry.sourceRepository.root) !== sourceRoot && !options.sourceRoot) throw new Error("invalid owning sourceRoot");
  });
  const config = attempt("codex", "native-identity", () => relevantConfig(path.join(home, ".codex", "config.toml"))) ?? { plugins: {}, marketplaces: {} };
  let claudeRows = options.claudePlugins;
  const getClaudeRows = () => {
    if (claudeRows === undefined) {
      if (path.resolve(home) !== path.resolve(os.homedir())) throw new Error("a fixture home requires explicit claudePlugins observations; real host state will not be read");
      claudeRows = JSON.parse(execFileSync("claude", ["plugin", "list", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 }));
    }
    if (!Array.isArray(claudeRows)) throw new Error("Claude native plugin rows must be an array");
    return claudeRows;
  };
  const verifiedArtifacts = new Map();
  const verifyArtifact = (artifact) => {
    const key = JSON.stringify(artifact);
    if (!verifiedArtifacts.has(key)) verifiedArtifacts.set(key, artifactTree(artifact));
    return verifiedArtifacts.get(key);
  };
  const verifyTree = (directory, files) => {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) throw new Error(`directory missing: ${directory}`);
    const differences = equalFiles(files, treeFiles(directory));
    if (differences.length) throw new Error(differences.join("; "));
  };
  function manifest(install, effectiveRoot, expectedName = install.pluginId?.split("@")[0], expectedVersion = install.pluginVersion) {
    const candidates = [install.runtime === "claude" ? ".claude-plugin/plugin.json" : ".codex-plugin/plugin.json", ".claude-plugin/plugin.json"];
    const relative = candidates.find((candidate) => fs.existsSync(path.join(effectiveRoot, candidate)));
    if (!relative) throw new Error("plugin manifest is missing");
    const file = path.join(effectiveRoot, relative);
    if (!inside(fs.realpathSync(effectiveRoot), fs.realpathSync(file))) throw new Error("plugin manifest symlink escapes plugin root");
    const data = readJson(file);
    if (expectedName && data.name !== expectedName) throw new Error(`plugin manifest name ${data.name} differs from ${expectedName}`);
    if (expectedVersion && data.version !== expectedVersion) throw new Error(`plugin manifest version ${data.version ?? "(missing)"} differs from ${expectedVersion}`);
    return data;
  }
  function nativeIdentity(install) {
    if (install.role !== "active") return;
    if (!nonempty(install.pluginId)) throw new Error("active plugin install requires pluginId");
    if (install.runtime === "codex") {
      if (config.plugins[install.pluginId]?.enabled !== true) throw new Error(`Codex plugin ${install.pluginId} is not enabled`);
      if (["frozen-plugin-cache", "vendor-plugin-cache"].includes(install.mode)) {
        const [pluginName, marketplaceName] = install.pluginId.split("@");
        const version = install.pluginVersion ?? install.versionLabel;
        if (!marketplaceName || !nonempty(version) || path.resolve(install.pluginRoot ?? "") !== path.join(home, ".codex", "plugins", "cache", marketplaceName, pluginName, version)) throw new Error("Codex native plugin cache root identity differs");
      }
      if (install.marketplaceSource) {
        const marketName = install.pluginId.split("@")[1];
        const market = config.marketplaces[marketName];
        if (!market || market.source !== install.marketplaceSource) throw new Error("Codex configured marketplace source differs");
        if (market.source_type && market.source_type !== "local") throw new Error("Codex selected artifact requires a local marketplace source");
      }
    } else {
      const rows = getClaudeRows().filter((row) => row.id === install.pluginId);
      if (rows.length !== 1 || rows[0].enabled !== true) throw new Error(`Claude native plugin ${install.pluginId} is not uniquely enabled`);
      const row = rows[0];
      if (install.pluginVersion && row.version !== install.pluginVersion) throw new Error("Claude registered plugin version differs");
      if (install.versionLabel && row.version !== install.versionLabel) throw new Error("Claude registered plugin version label differs");
      if (!nonempty(install.pluginRoot) || path.resolve(row.installPath ?? "") !== path.resolve(install.pluginRoot)) throw new Error("Claude registered plugin root differs");
      if (install.mode === "directory-source" && path.resolve(row.readFromFolder ?? "") !== path.resolve(install.sourceFolder ?? "")) throw new Error("Claude readFromFolder differs from effective sourceFolder");
    }
  }
  function selection(install, artifact, files) {
    if (!object(install.selection) || !nonempty(install.selection.path) || !path.isAbsolute(install.selection.path) || !nonempty(install.selection.name) || !nonempty(install.marketplaceSource)) throw new Error("Codex frozen artifact requires absolute selection path and marketplaceSource");
    if (!inside(path.resolve(artifact.root), path.resolve(install.selection.path)) || !inside(fs.realpathSync(artifact.root), fs.realpathSync(install.selection.path))) throw new Error("selection catalog escapes artifact repository");
    const catalog = readJson(install.selection.path);
    const rows = (catalog.candidates ?? []).filter((row) => row.name === install.selection.name);
    if (rows.length !== 1) throw new Error("selection candidate is missing or duplicated");
    const candidate = rows[0];
    if (catalog.marketplace !== install.pluginId?.split("@")[1] || candidate.name !== install.pluginId?.split("@")[0] || candidate.commit !== artifact.commit || repoIdentity(candidate.repositoryUrl) !== repoIdentity(artifact.repository) || candidate.targetVersion !== install.pluginVersion || !safeRelative(candidate.pluginPath) || !artifact.path.startsWith(`${candidate.pluginPath}/`)) throw new Error("selection candidate repository, commit, path, plugin identity or version differs");
    if (!Array.isArray(candidate.overrides) || candidate.overrides.length !== 0) throw new Error("selection has undeclared overrides for an exact source artifact");
    const pinnedPlugin = JSON.parse(git(artifact.root, "show", `${artifact.commit}:${candidate.pluginPath}/.codex-plugin/plugin.json`).toString("utf8"));
    if (pinnedPlugin.name !== candidate.name || pinnedPlugin.version !== candidate.sourceVersion || candidate.sourceVersion !== candidate.targetVersion) throw new Error("selection source version or plugin identity differs from its pinned Git manifest");
    if (!safeRelative(catalog.outputPath) || path.resolve(artifact.root, catalog.outputPath) !== path.resolve(install.marketplaceSource)) throw new Error("selection outputPath differs from configured marketplaceSource");
    const marketFile = path.join(install.marketplaceSource, ".agents", "plugins", "marketplace.json");
    const marketplace = readJson(marketFile);
    if (!inside(fs.realpathSync(install.marketplaceSource), fs.realpathSync(marketFile))) throw new Error("marketplace manifest escapes source");
    const routes = (marketplace.plugins ?? []).filter((row) => row.name === candidate.name);
    if (marketplace.name !== catalog.marketplace || routes.length !== 1 || routes[0].source?.source !== "local") throw new Error("native marketplace does not select the candidate");
    const selectedRoot = path.resolve(install.marketplaceSource, routes[0].source.path);
    if (!inside(path.resolve(install.marketplaceSource), selectedRoot) || !inside(fs.realpathSync(install.marketplaceSource), fs.realpathSync(selectedRoot))) throw new Error("marketplace candidate path escapes source");
    manifest(install, selectedRoot);
    verifyTree(path.join(selectedRoot, artifact.path.slice(candidate.pluginPath.length + 1)), files);
  }
  const seen = new Set();
  const owned = new Set();
  for (const capability of Array.isArray(registry.capabilities) ? registry.capabilities : []) {
    const id = capability?.id ?? "(missing capability id)";
    const validSchema = attempt(id, "schema", () => {
      if (!object(capability) || !nonempty(capability.id) || !nonempty(capability.owner) || !KINDS.has(capability.kind)) throw new Error("capability requires valid id, owner and kind");
      if (seen.has(id)) throw new Error("duplicate capability id");
      seen.add(id);
      if (capability.version !== undefined && !nonempty(capability.version)) throw new Error("version must be a nonempty string");
      if (capability.kind !== "vendor-adapter" && !SOURCE_STATES.has(capability.sourceStatus)) throw new Error("sourceStatus is missing or unsupported");
      if (capability.sourceStatus !== undefined && !SOURCE_STATES.has(capability.sourceStatus)) throw new Error("unsupported sourceStatus");
      if (capability.canonicalPath !== undefined && !nonempty(capability.canonicalPath)) throw new Error("canonicalPath must be a string");
      if (capability.kind !== "vendor-adapter" && !capability.canonicalPath) throw new Error("skill canonicalPath is required");
      if (capability.canonicalPath && !path.isAbsolute(capability.canonicalPath) && !safeRelative(capability.canonicalPath)) throw new Error("canonicalPath escapes sourceRoot");
      if (!Array.isArray(capability.installs) || !Array.isArray(capability.historicalInstalls ?? [])) throw new Error("installs and historicalInstalls must be arrays");
      if (!Array.isArray(capability.requiredActiveRuntimes) || capability.requiredActiveRuntimes.some((runtime) => !["codex", "claude"].includes(runtime)) || new Set(capability.requiredActiveRuntimes).size !== capability.requiredActiveRuntimes.length) throw new Error("requiredActiveRuntimes must be a unique array of codex or claude");
      if (capability.installs.some((install) => install?.role === "active" && !capability.requiredActiveRuntimes.includes(install.runtime))) throw new Error("active install runtime is missing from requiredActiveRuntimes");
      for (const history of capability.historicalInstalls ?? []) {
        date(history.observedAt, "historical install observedAt");
        if (!nonempty(history.reason) || !object(history.record)) throw new Error("historical install requires reason and original record");
      }
      if (capability.workingObservation !== undefined) {
        observation(capability.workingObservation, "workingObservation");
        if (capability.workingObservation.state !== "unreviewed") throw new Error("workingObservation.state must be unreviewed");
        if (capability.workingObservation.version !== undefined && !nonempty(capability.workingObservation.version)) throw new Error("workingObservation version must be a string");
      }
      return true;
    });
    if (!validSchema) continue;
    const currentInstalls = Array.isArray(capability.installs) ? capability.installs : [];
    for (const runtime of capability.requiredActiveRuntimes) {
      const active = currentInstalls.filter((install) => install?.runtime === runtime && install.role === "active");
      if (active.length !== 1) report(id, "loading", "error", `required ${runtime} runtime needs exactly one active install record; found ${active.length}`);
    }
    const canonical = capability.canonicalPath ? registeredPath(capability.canonicalPath) : null;
    if (capability.kind === "owned-skill") {
      owned.add(id);
      if (capability.canonicalPath !== `agent-assets/plugins/asset-production/skills/${id}`) report(id, "schema", "error", "owned skill canonicalPath must be its exact bundle directory");
      for (const runtime of ["codex", "claude"]) {
        const active = currentInstalls.filter((install) => install?.runtime === runtime && install.role === "active");
        if (active.length !== 1) report(id, "loading", "error", `owned skill requires exactly one active ${runtime} install record; found ${active.length}`);
      }
    }
    if (capability.kind === "pending-local-skill") report(id, "source-readiness", "review-required", "pending local skill is unreviewed and is not an accepted bundle member");
    if (capability.sourceStatus === "local-unreviewed") report(id, "source-readiness", "review-required", "local source has no accepted immutable provenance");
    if (capability.kind !== "vendor-adapter" && capability.sourceStatus === "unversioned") report(id, "source-readiness", "review-required", "unversioned skill source has no accepted immutable provenance");
    let actualFrontmatter;
    if (canonical) actualFrontmatter = attempt(id, "source", () => {
      if (!fs.existsSync(path.join(canonical, "SKILL.md"))) throw new Error(`canonical SKILL.md missing: ${canonical}`);
      if (capability.kind === "owned-skill" && !inside(fs.realpathSync(sourceRoot), fs.realpathSync(canonical))) throw new Error("owned canonical source path escapes owning sourceRoot");
      const frontmatter = readFrontmatter(path.join(canonical, "SKILL.md"));
      if (capability.kind !== "vendor-adapter" && frontmatter.name !== id.split(":").at(-1)) throw new Error(`SKILL name ${frontmatter.name} differs from capability identity ${id}`);
      if (capability.workingObservation?.version && frontmatter.version !== capability.workingObservation.version) throw new Error("workingObservation version differs from source");
      return frontmatter;
    });
    if (capability.sourceStatus === "committed") attempt(id, "source-integrity", () => {
      const files = verifyArtifact(capability.sourceArtifact);
      if (capability.kind === "owned-skill") {
        if (repoIdentity(capability.sourceArtifact.repository) !== repoIdentity(registry.sourceRepository?.repository) || capability.sourceArtifact.commit !== registry.sourceRepository?.commit || capability.sourceArtifact.path !== capability.canonicalPath) throw new Error("owned source artifact differs from selected sourceRepository");
        if (!inside(fs.realpathSync(root), fs.realpathSync(path.join(root, capability.canonicalPath)))) throw new Error("validation checkout canonical source escapes its owning root");
        verifyTree(path.join(root, capability.canonicalPath), files);
        for (const relative of Object.keys(files).filter((file) => /\.(?:md|json|ya?ml|py|sh|mjs)$/.test(file))) {
          const content = fs.readFileSync(path.join(root, capability.canonicalPath, relative), "utf8");
          for (const retired of ["/Users/nicholasosto/GameDev", "assets/ai-output/"]) if (content.includes(retired)) throw new Error(`retired path ${retired} in ${relative}`);
        }
      } else if (path.resolve(canonical) !== path.resolve(capability.sourceArtifact.root, capability.sourceArtifact.path) || !inside(fs.realpathSync(capability.sourceArtifact.root), fs.realpathSync(canonical))) throw new Error("canonical path differs from or escapes artifact repository path");
      const acceptedSource = git(capability.sourceArtifact.root, "show", `${capability.sourceArtifact.commit}:${capability.sourceArtifact.path}/SKILL.md`).toString("utf8");
      const accepted = parseFrontmatter(acceptedSource);
      if (accepted.name !== id.split(":").at(-1)) throw new Error("artifact SKILL name differs from capability identity");
      if (capability.version && accepted.version !== capability.version) throw new Error(`artifact source version ${accepted.version ?? "(missing)"} differs from registry ${capability.version}`);
      if (capability.sourceArtifact.version && accepted.version !== capability.sourceArtifact.version) throw new Error("artifact declared version differs from Git frontmatter");
      report(id, "source-integrity", "pass", "named committed source artifact matches its complete Git manifest");
      const acceptedHeader = acceptedSource.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
      if (capability.kind === "owned-skill" && /^version:/m.test(acceptedHeader)) report(id, "source-readiness", "review-required", "committed skill uses legacy top-level version frontmatter; host-compatible metadata migration remains unreviewed");
      const differences = equalFiles(files, treeFiles(canonical));
      if (differences.length) report(id, "source-readiness", "review-required", `working source diverges from accepted artifact: ${differences.join("; ")}`);
    });
    const installIdentities = new Set();
    for (const install of currentInstalls) {
      const label = `${id}/${install?.runtime ?? "unknown"}`;
      attempt(label, "install", () => {
        if (!object(install) || !["codex", "claude"].includes(install.runtime) || !["active", "observed", "unverified"].includes(install.role) || !STATES.has(install.state) || !MODES.has(install.mode)) throw new Error("unsupported install runtime, role, state or mode");
        for (const field of ["path", "pluginId", "pluginVersion", "versionLabel", "pluginRoot", "sourceFolder", "marketplaceSource"]) if (install[field] !== undefined && !nonempty(install[field])) throw new Error(`install ${field} must be a nonempty string`);
        const identity = JSON.stringify([install.runtime, install.role, install.mode, install.path ?? null, install.pluginId ?? null]);
        if (installIdentities.has(identity)) throw new Error("duplicate install observation identity");
        installIdentities.add(identity);
        date(install.observedAt, "install observedAt");
        if (!nonempty(install.observationScope) || install.execution !== "unverified") throw new Error("install requires observationScope and execution:unverified");
        if (install.scope !== undefined && !["project-local", "global"].includes(install.scope)) throw new Error("unsupported install scope");
        if (capability.availability === "project-local-handoff" && install.scope !== "project-local") throw new Error("project-local handoff requires project-local scope");
        const remoteFigmaObservation = id === "figma" && capability.kind === "vendor-adapter" && install.runtime === "codex" && install.mode === "vendor-plugin-cache" && install.state === "session-exposed" && !install.pluginId;
        const activePlugin = install.role === "active" && ["frozen-plugin-cache", "directory-source", "vendor-plugin-cache"].includes(install.mode) && !remoteFigmaObservation;
        if (activePlugin && install.state !== "enabled") throw new Error("active plugin install must be enabled");
        if (install.role === "active" && !["enabled", "available", "session-exposed"].includes(install.state)) throw new Error("active install requires enabled, available or session-exposed loading evidence");
        if (NO_PATH.has(install.mode)) {
          if (install.role === "active" && !(install.mode === "built-in-tool" && install.state === "session-exposed")) throw new Error("remote or handoff observation cannot claim active local loading");
          report(label, "execution", "unverified", "availability remains a dated observation; no fresh execution or permissions claim");
          return;
        }
        if (!nonempty(install.path) || !path.isAbsolute(install.path) || !fs.existsSync(install.path)) throw new Error(`install path is missing: ${install.path ?? "(missing)"}`);
        if (["symlink", "skill-file-symlink", "project-skill", "local-skill"].includes(install.mode)) {
          if (!canonical) throw new Error("source-linked install requires canonicalPath");
          const installedSkill = path.join(install.path, "SKILL.md");
          if (install.mode === "symlink" && !fs.lstatSync(install.path).isSymbolicLink()) throw new Error("install is not a symlink");
          if (install.mode === "skill-file-symlink" && !fs.lstatSync(installedSkill).isSymbolicLink()) throw new Error("installed SKILL.md is not a symlink");
          if (fs.realpathSync(installedSkill) !== fs.realpathSync(path.join(canonical, "SKILL.md"))) throw new Error("installed SKILL.md does not resolve to canonical source");
          if (install.mode === "symlink" && fs.realpathSync(install.path) !== fs.realpathSync(canonical)) throw new Error("install directory does not resolve to canonical source");
          if (readFrontmatter(installedSkill).version !== actualFrontmatter?.version) throw new Error("installed source version differs");
        } else if (install.mode === "frozen-plugin-cache") {
          const files = verifyArtifact(install.artifact);
          verifyTree(install.path, files);
          if (!capability.sourceArtifact || repoIdentity(install.artifact.repository) !== repoIdentity(capability.sourceArtifact.repository) || install.artifact.path !== capability.sourceArtifact.path) throw new Error("frozen artifact repository or named subtree differs from canonical authority");
          if (!nonempty(install.pluginRoot) || !inside(path.resolve(install.pluginRoot), path.resolve(install.path)) || !inside(fs.realpathSync(install.pluginRoot), fs.realpathSync(install.path))) throw new Error("frozen skill path escapes pluginRoot");
          const installedRelative = path.relative(install.pluginRoot, install.path).split(path.sep).join("/");
          if (!install.artifact.path.endsWith(`/${installedRelative}`)) throw new Error("frozen installed skill path differs from artifact named subtree");
          manifest(install, install.pluginRoot);
          if (install.runtime === "codex" && install.role === "active") selection(install, install.artifact, files);
          nativeIdentity(install);
          report(label, "integrity", "pass", "named installed subtree matches its pinned Git artifact, including file set and modes");
          const installed = readFrontmatter(path.join(install.path, "SKILL.md"));
          if (install.artifact.version && installed.version !== install.artifact.version) throw new Error("frozen artifact version differs from installed SKILL.md");
          if (capability.version && installed.version !== capability.version) {
            if (install.role === "active") report(label, "freshness", "newer-guidance-not-adopted", `selected source ${installed.version ?? "unversioned"}; current canonical guidance ${capability.version} has not been adopted`);
            else report(label, "freshness", "observed", `retained snapshot ${installed.version ?? "unversioned"} differs from canonical ${capability.version}; this observation does not select effective runtime loading`);
          }
        } else if (install.mode === "directory-source") {
          if (!canonical || !nonempty(install.sourceFolder) || !nonempty(install.pluginRoot)) throw new Error("directory-source requires canonicalPath, pluginRoot and sourceFolder");
          nativeIdentity(install);
          if (!inside(path.resolve(install.sourceFolder), path.resolve(install.path)) || fs.realpathSync(install.path) !== fs.realpathSync(canonical)) throw new Error("effective directory-source differs from canonical path");
          manifest(install, install.sourceFolder);
        } else if (install.mode === "vendor-plugin-cache") {
          const pluginRoot = install.pluginRoot ?? install.path;
          if (!inside(path.resolve(pluginRoot), path.resolve(install.path)) || !inside(fs.realpathSync(pluginRoot), fs.realpathSync(install.path))) throw new Error("vendor path escapes plugin root");
          manifest(install, pluginRoot, install.pluginId?.split("@")[0] ?? id, install.pluginVersion ?? (capability.version === "unversioned" ? undefined : capability.version));
          if (activePlugin) nativeIdentity(install);
          report(label, "execution", "unverified", "plugin files and dated loading identity do not establish execution, permission or acceptance");
        } else if (install.mode === "vendor-skill") {
          readFrontmatter(path.join(install.path, "SKILL.md"));
        }
        report(label, "loading", "pass", "declared filesystem loading and applicable native identity checks passed");
      });
    }
    if (id === "figma") {
      const installs = currentInstalls;
      if (installs.filter((install) => install.runtime === "codex" && install.role === "active").length !== 1) report(id, "loading", "error", "expected exactly one active Codex Figma integration");
      const claude = installs.filter((install) => install.runtime === "claude");
      if (claude.length !== 1 || claude[0].state !== "unverified" || claude[0].role !== "unverified") report(id, "loading", "error", "Claude Figma availability must remain explicitly unverified until proven");
    }
  }
  const bundleRoot = path.join(root, "agent-assets", "plugins", "asset-production");
  attempt("asset-production", "bundle", () => {
    const bundle = registry.pluginBundle;
    if (!object(bundle) || bundle.id !== "asset-production" || !nonempty(bundle.version) || bundle.distribution !== "local-source" || bundle.marketplaceReady !== false) throw new Error("pluginBundle must be a versioned non-marketplace local-source asset-production bundle");
    const skillsRoot = path.join(bundleRoot, "skills");
    const directories = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    for (const id of directories) if (!owned.has(id)) throw new Error(`unregistered owned skill directory: ${id}`);
    for (const id of owned) if (!directories.includes(id)) throw new Error(`registered owned skill directory missing: ${id}`);
    const manifests = [".claude-plugin", ".codex-plugin"].map((folder) => {
      const file = path.join(bundleRoot, folder, "plugin.json");
      if (!inside(fs.realpathSync(bundleRoot), fs.realpathSync(file))) throw new Error("bundle manifest symlink escapes plugin root");
      const data = readJson(file);
      if (data.name !== bundle.id || data.version !== bundle.version || data.skills !== "./skills") throw new Error(`${folder} bundle manifest identity, version or skills differs`);
      return data;
    });
    for (const field of ["name", "version", "description", "author", "keywords", "skills"]) if (JSON.stringify(manifests[0][field]) !== JSON.stringify(manifests[1][field])) throw new Error(`Claude/Codex bundle manifests differ at ${field}`);
    for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category", "capabilities", "defaultPrompt"]) if (!(field in (manifests[1].interface ?? {}))) throw new Error(`Codex plugin interface is missing ${field}`);
    report("asset-production", "bundle", "pass", "bundle manifests agree without claiming marketplace readiness");
  });
  for (const runtime of ["codex", "claude"]) {
    attempt(runtime, "discovery", () => {
      const skills = discoverSkills(path.join(home, `.${runtime}`, "skills"));
      for (const entry of skills.filter((skill) => skill.parseError && skill.names?.length === 0)) report(runtime, "discovery", "error", `cannot safely identify discovered skill ${entry.file}: ${entry.parseError}`);
      for (const id of owned) {
        const matches = skills.filter((entry) => entry.name === id || entry.names?.includes(id));
        for (const entry of matches.filter((match) => match.parseError)) report(id, "discovery", "error", `${runtime} cannot validate discovered owned skill ${entry.file}: ${entry.parseError}`);
        if (matches.length !== 1) report(id, "discovery", "error", `${runtime} discovers ${matches.length} copies of owned skill; expected exactly one`);
        else if (matches[0].real !== fs.realpathSync(path.join(sourceRoot, "agent-assets", "plugins", "asset-production", "skills", id, "SKILL.md"))) report(id, "discovery", "error", `${runtime} discovered skill does not resolve to owning source`);
      }
      for (const name of ["figma", "figma-implement-design"]) if (skills.some((entry) => entry.name === name || entry.names?.includes(name))) report(name, "discovery", "error", `${runtime} still discovers legacy standalone skill ${name}`);
    });
  }
  return { errors, warnings, findings, exitCode: errors.length ? 1 : 0 };
}
