import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  parseFrontmatter,
  readFrontmatter,
  validateCapabilities,
} from "../lib/agent-capabilities.mjs";
import { runCli, validateGenerationRoutingLegacy } from "../check-agent-capabilities.mjs";

const NOW = "2026-10-17T12:00:00Z";
const OBSERVED = "2026-10-17";
const REPOSITORY = "https://example.invalid/asset-studio.git";
const SKILL_PATH = "agent-assets/plugins/asset-production/skills/fixture-craft";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const clone = (value) => JSON.parse(JSON.stringify(value));

function write(root, relativePath, contents) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  return file;
}

function json(root, relativePath, value) {
  return write(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: os.devNull,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_AUTHOR_NAME: "Capability fixture",
      GIT_AUTHOR_EMAIL: "capability-fixture@example.invalid",
      GIT_COMMITTER_NAME: "Capability fixture",
      GIT_COMMITTER_EMAIL: "capability-fixture@example.invalid",
    },
  }).trim();
}

function initRepo(root, repository = REPOSITORY) {
  fs.mkdirSync(root, { recursive: true });
  git(root, "init", "--quiet");
  git(root, "remote", "add", "origin", repository);
}

function commit(root, message = "Fixture source") {
  git(root, "add", "--all");
  git(root, "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function skill(name = "fixture-craft", version = "1.0.0") {
  return `---\nname: ${name}\ndescription: Disposable fixture craft.\nmetadata:\n  source_version: "${version}"\n---\n\n# Fixture craft\n\nFixture guidance.\n`;
}

function sourceArtifact(root, commitId, relativePath, version = "1.0.0", repository = REPOSITORY) {
  const files = {};
  const entries = execFileSync("git", ["-C", root, "ls-tree", "-rz", commitId, "--", relativePath]);
  for (const entry of entries.toString("utf8").split("\0").filter(Boolean)) {
    const match = entry.match(/^(\d+) blob ([0-9a-f]+)\t(.+)$/);
    assert.ok(match, `fixture requires an ordinary Git blob: ${entry}`);
    const [, mode, objectId, fullPath] = match;
    const relative = path.posix.relative(relativePath, fullPath);
    const bytes = execFileSync("git", ["-C", root, "cat-file", "blob", objectId]);
    files[relative] = { mode, sha256: sha256(bytes) };
  }
  return { repository, root, commit: commitId, path: relativePath, version, files };
}

function observation(overrides = {}) {
  return {
    runtime: "codex",
    role: "active",
    state: "enabled",
    observedAt: OBSERVED,
    observationScope: "Disposable fixture filesystem and native selection only.",
    execution: "unverified",
    ...overrides,
  };
}

function withFixture(run) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "asset-studio-capabilities-"));
  const root = path.join(temporary, "source");
  const home = path.join(temporary, "home");
  initRepo(root);
  fs.mkdirSync(home, { recursive: true });
  write(root, `${SKILL_PATH}/SKILL.md`, skill());
  write(root, `${SKILL_PATH}/references/guide.md`, "# Fixture guide\n");
  const executable = write(root, `${SKILL_PATH}/scripts/check.sh`, "#!/bin/sh\nexit 0\n");
  fs.chmodSync(executable, 0o755);
  write(root, "agent-assets/inventory-2026-07-24.md", "# Historical fixture inventory\n");
  const manifest = {
    name: "asset-production",
    version: "0.1.0",
    description: "Disposable source bundle.",
    author: { name: "Fixture author" },
    keywords: ["fixture"],
    skills: "./skills",
  };
  json(root, "agent-assets/plugins/asset-production/.claude-plugin/plugin.json", manifest);
  json(root, "agent-assets/plugins/asset-production/.codex-plugin/plugin.json", {
    ...manifest,
    interface: {
      displayName: "Fixture production",
      shortDescription: "Disposable fixture",
      longDescription: "Disposable fixture for registry verification.",
      developerName: "Fixture author",
      category: "Design",
      capabilities: ["Read"],
      defaultPrompt: ["Inspect the fixture."],
    },
  });
  write(root, "generation/ACTIVE.md", "---\nbatch: fixture-batch\n---\n\n[Contract](contracts/fixture-batch.md)\n");
  const body = "- **Batch id:** `fixture-batch`\n\nFixture candidates only.\n";
  write(root, "generation/contracts/fixture-batch.md", `# Immutable fixture\n\n${body}`);
  write(root, "generation/BATCH.md", `# Compatibility fixture\n\n${body}`);
  const commitId = commit(root);
  const canonical = path.join(root, SKILL_PATH);
  const installs = ["codex", "claude"].map((runtime) => {
    const installed = path.join(home, `.${runtime}`, "skills", "fixture-craft");
    fs.mkdirSync(path.dirname(installed), { recursive: true });
    fs.symlinkSync(canonical, installed);
    return observation({ runtime, mode: "symlink", scope: "global", path: installed });
  });
  const capability = {
    id: "fixture-craft",
    kind: "owned-skill",
    owner: "Asset-Studio",
    canonicalPath: SKILL_PATH,
    version: "1.0.0",
    sourceStatus: "committed",
    sourceArtifact: sourceArtifact(root, commitId, SKILL_PATH),
    requiredActiveRuntimes: ["codex", "claude"],
    installs,
    historicalInstalls: [],
  };
  const registry = {
    schemaVersion: "2.0.0",
    verifiedAt: "2026-07-24",
    observation: { observedAt: OBSERVED, scope: "Disposable fixture filesystem inventory; no execution." },
    sourceRepository: { root, repository: REPOSITORY, commit: commitId },
    pluginBundle: { id: "asset-production", version: "0.1.0", distribution: "local-source", marketplaceReady: false },
    policy: { memoryAuthority: "evidence-only", cacheAuthority: "derived-only" },
    capabilities: [capability],
    historicalObservations: [],
    workflowGapReview: { observedAt: OBSERVED, scope: "Fixture review boundary." },
  };
  const fixture = {
    temporary, root, home, registry, canonical, capability,
    validate(overrides = {}) {
      return validateCapabilities({ root, sourceRoot: root, home, now: NOW, registry, claudePlugins: [], ...overrides });
    },
    cli(overrides = {}) {
      const output = [];
      const result = runCli({ root, sourceRoot: root, home, now: NOW, registry, claudePlugins: [], write: (value) => output.push(value), ...overrides });
      return { result, output };
    },
  };
  try {
    return run(fixture);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function assertSuccess(result) {
  assert.equal(result.exitCode, 0, result.errors.join("\n"));
  assert.deepEqual(result.errors, []);
}

function assertFailure(result, signal) {
  assert.equal(result.exitCode, 1, "incomplete or invalid evidence must not report success");
  assert.ok(result.errors.length, "a refusal must explain the remaining gap");
  if (signal) assert.match(result.errors.join("\n"), signal);
}

function copyPinnedFiles(artifact, destination) {
  for (const [relative, entry] of Object.entries(artifact.files)) {
    const objectPath = `${artifact.commit}:${artifact.path}/${relative}`;
    const bytes = execFileSync("git", ["-C", artifact.root, "show", objectPath]);
    const target = path.join(destination, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (entry.mode === "120000") fs.symlinkSync(bytes.toString("utf8"), target);
    else {
      fs.writeFileSync(target, bytes);
      fs.chmodSync(target, entry.mode === "100755" ? 0o755 : 0o644);
    }
  }
}

function addFrozenExternal(fixture) {
  const root = path.join(fixture.temporary, "external-source");
  const repository = "https://example.invalid/trembus.git";
  const relative = "roblox-dev/skills/asset-conventions";
  initRepo(root, repository);
  write(root, `${relative}/SKILL.md`, skill("asset-conventions", "1.0.0"));
  write(root, `${relative}/references/folders.md`, "# Approved folders\n");
  const script = write(root, `${relative}/scripts/check.sh`, "#!/bin/sh\nexit 0\n");
  fs.chmodSync(script, 0o755);
  json(root, "roblox-dev/.codex-plugin/plugin.json", { name: "roblox-dev", version: "0.8.3", skills: "./skills" });
  json(root, "roblox-dev/.claude-plugin/plugin.json", { name: "roblox-dev", version: "0.8.3", skills: "./skills" });
  const oldCommit = commit(root, "Selected older plugin source");
  const selected = sourceArtifact(root, oldCommit, relative, "1.0.0", repository);
  write(root, `${relative}/SKILL.md`, skill("asset-conventions", "1.1.0"));
  write(root, `${relative}/references/folders.md`, "# Newer source guidance awaiting adoption\n");
  const currentCommit = commit(root, "Newer canonical guidance");
  const canonical = sourceArtifact(root, currentCommit, relative, "1.1.0", repository);
  const pluginRoot = path.join(fixture.home, ".codex/plugins/cache/trembus/roblox-dev/0.8.3");
  const installedPath = path.join(pluginRoot, "skills/asset-conventions");
  copyPinnedFiles(selected, installedPath);
  json(pluginRoot, ".codex-plugin/plugin.json", { name: "roblox-dev", version: "0.8.3", skills: "./skills" });
  const marketplaceSource = path.join(root, "candidate-marketplace");
  copyPinnedFiles(selected, path.join(marketplaceSource, "roblox-dev/skills/asset-conventions"));
  json(marketplaceSource, "roblox-dev/.codex-plugin/plugin.json", { name: "roblox-dev", version: "0.8.3", skills: "./skills" });
  json(marketplaceSource, ".agents/plugins/marketplace.json", { name: "trembus", plugins: [{ name: "roblox-dev", source: { source: "local", path: "./roblox-dev" } }] });
  const selectionPath = json(root, "candidate-selection.json", {
    marketplace: "trembus", outputPath: "candidate-marketplace",
    candidates: [{ name: "roblox-dev", repositoryUrl: repository, commit: oldCommit, pluginPath: "roblox-dev", sourceVersion: "0.8.3", targetVersion: "0.8.3", overrides: [] }],
  });
  const install = observation({
    mode: "frozen-plugin-cache", path: installedPath,
    pluginId: "roblox-dev@trembus", pluginVersion: "0.8.3", pluginRoot,
    marketplaceSource, artifact: selected, selection: { path: selectionPath, name: "roblox-dev" },
  });
  const capability = {
    id: "roblox-dev:asset-conventions", kind: "external-skill", owner: "roblox-dev",
    canonicalPath: path.join(root, relative), version: "1.1.0", sourceStatus: "committed",
    sourceArtifact: canonical, requiredActiveRuntimes: ["codex"], installs: [install], historicalInstalls: [],
  };
  fixture.registry.capabilities.push(capability);
  write(fixture.home, ".codex/config.toml", `[plugins."roblox-dev@trembus"]\nenabled = true\n\n[marketplaces.trembus]\nsource = ${JSON.stringify(marketplaceSource)}\n`);
  return { root, repository, relative, oldCommit, currentCommit, selected, canonical, pluginRoot, installedPath, marketplaceSource, selectionPath, install, capability };
}

test("a complete pinned local bundle passes using disposable inputs only", () => {
  withFixture((fixture) => {
    assertSuccess(fixture.validate());
    assert.deepEqual(validateGenerationRoutingLegacy(fixture.root), []);
    assertSuccess(fixture.cli().result);
  });
});

test("subtree source provenance survives unrelated later commits", () => {
  withFixture((fixture) => {
    const pinned = fixture.capability.sourceArtifact.commit;
    write(fixture.root, "unrelated/report.md", "# Later unrelated report\n");
    const later = commit(fixture.root, "Unrelated later report");
    assert.notEqual(later, pinned);
    assertSuccess(fixture.validate());
  });
});

test("a selected older package remains intact while newer canonical guidance is separately visible", () => {
  withFixture((fixture) => {
    const external = addFrozenExternal(fixture);
    assert.notEqual(external.selected.commit, external.canonical.commit);
    const result = fixture.validate();
    assertSuccess(result);
    assert.ok(result.findings.some((finding) => `${finding.status} ${finding.message}`.includes("newer-guidance-not-adopted")), "freshness must remain visible without claiming that the approved older bytes are corrupt");
    assert.ok(result.findings.some((finding) => finding.dimension === "integrity" && /pass|match|intact|verified/.test(finding.status)), "named installed artifact must retain its own integrity finding");
  });
});

test("selected frozen artifacts refuse changed, omitted, extra and executable-mode cache files", async (t) => {
  const cases = [
    ["changed bytes", (e) => fs.writeFileSync(path.join(e.installedPath, "references/folders.md"), "tampered cache\n"), /hash|file|content|differ/i],
    ["missing file", (e) => fs.unlinkSync(path.join(e.installedPath, "references/folders.md")), /file|missing|set/i],
    ["extra file", (e) => write(e.installedPath, "extra.md", "unselected cache content\n"), /file|extra|set/i],
    ["mode change", (e) => fs.chmodSync(path.join(e.installedPath, "scripts/check.sh"), 0o644), /mode/i],
    ["same bytes outside named subtree", (e) => {
      const original = path.join(e.installedPath, "references/folders.md");
      const outside = write(e.pluginRoot, "outside-folders.md", fs.readFileSync(original));
      fs.unlinkSync(original);
      fs.symlinkSync(path.relative(path.dirname(original), outside), original);
    }, /symlink|escap|mode/i],
    ["selected source bytes changed", (e) => fs.writeFileSync(path.join(e.marketplaceSource, "roblox-dev/skills/asset-conventions/references/folders.md"), "changed marketplace bytes\n"), /marketplace|file|hash|differ/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      const external = addFrozenExternal(fixture);
      mutate(external);
      assertFailure(fixture.validate(), signal);
    }));
  }
});

test("frozen loading binds enabled native identity, plugin root, manifest, marketplace and candidate", async (t) => {
  const editSelection = (external, mutate) => {
    const value = JSON.parse(fs.readFileSync(external.selectionPath, "utf8"));
    mutate(value);
    fs.writeFileSync(external.selectionPath, JSON.stringify(value));
  };
  const cases = [
    ["disabled native plugin", (f, e) => write(f.home, ".codex/config.toml", `[plugins."roblox-dev@trembus"]\nenabled = false\n[marketplaces.trembus]\nsource = ${JSON.stringify(e.marketplaceSource)}\n`), /enabled|disabled/i],
    ["wrong native ID", (f, e) => { e.install.pluginId = "other@trembus"; }, /plugin|identity|enabled/i],
    ["wrong plugin version", (f, e) => { e.install.pluginVersion = "0.8.4"; }, /version/i],
    ["wrong plugin root", (f, e) => { e.install.pluginRoot = path.join(e.root, "not-installed"); }, /plugin|root|missing|path/i],
    ["wrong manifest name", (f, e) => json(e.pluginRoot, ".codex-plugin/plugin.json", { name: "another-plugin", version: "0.8.3", skills: "./skills" }), /name|identity|manifest/i],
    ["wrong manifest version", (f, e) => json(e.pluginRoot, ".codex-plugin/plugin.json", { name: "roblox-dev", version: "9.0.0", skills: "./skills" }), /version|manifest/i],
    ["wrong configured marketplace", (f, e) => write(f.home, ".codex/config.toml", '[plugins."roblox-dev@trembus"]\nenabled = true\n[marketplaces.trembus]\nsource = "/unrelated/marketplace"\n'), /marketplace|source|config/i],
    ["missing selection catalog", (f, e) => fs.unlinkSync(e.selectionPath), /catalog|selection|missing/i],
    ["different selected candidate commit", (f, e) => editSelection(e, (s) => { s.candidates[0].commit = e.currentCommit; }), /commit|selection|candidate/i],
    ["different selected candidate version", (f, e) => editSelection(e, (s) => { s.candidates[0].targetVersion = "0.8.4"; }), /version|selection|candidate/i],
    ["false selected source version", (f, e) => editSelection(e, (s) => { s.candidates[0].sourceVersion = "9.0.0"; }), /version|selection|candidate/i],
    ["different selected source repository", (f, e) => editSelection(e, (s) => { s.candidates[0].repositoryUrl = "https://example.invalid/substitute.git"; }), /repository|selection|candidate|identity/i],
    ["candidate overrides", (f, e) => editSelection(e, (s) => { s.candidates[0].overrides = [{ path: "skills/asset-conventions/SKILL.md", contents: "substituted" }]; }), /override|selection|candidate/i],
    ["duplicate enabled declarations", (f, e) => write(f.home, ".codex/config.toml", `[plugins."roblox-dev@trembus"]\nenabled = true\nenabled = false\n[marketplaces.trembus]\nsource = ${JSON.stringify(e.marketplaceSource)}\n`), /duplicate|conflict/i],
    ["duplicate selected candidates", (f, e) => editSelection(e, (s) => { s.candidates.push(clone(s.candidates[0])); }), /duplicate|candidate|selection/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      const external = addFrozenExternal(fixture);
      mutate(fixture, external);
      assertFailure(fixture.validate(), signal);
    }));
  }
});

test("self-consistent substituted provenance cannot replace the actually configured marketplace", () => {
  withFixture((fixture) => {
    const external = addFrozenExternal(fixture);
    const substitute = path.join(fixture.temporary, "substitute-source");
    initRepo(substitute, "https://example.invalid/substitute.git");
    write(substitute, `${external.relative}/SKILL.md`, skill("asset-conventions", "1.0.0"));
    write(substitute, `${external.relative}/references/folders.md`, "# Different but internally consistent package\n");
    const script = write(substitute, `${external.relative}/scripts/check.sh`, "#!/bin/sh\nexit 0\n");
    fs.chmodSync(script, 0o755);
    const selectedCommit = commit(substitute);
    const artifact = sourceArtifact(substitute, selectedCommit, external.relative, "1.0.0", "https://example.invalid/substitute.git");
    fs.rmSync(external.installedPath, { recursive: true });
    copyPinnedFiles(artifact, external.installedPath);
    const substitutedSource = path.join(substitute, "candidate-marketplace");
    copyPinnedFiles(artifact, path.join(substitutedSource, "roblox-dev/skills/asset-conventions"));
    json(substitutedSource, "roblox-dev/.codex-plugin/plugin.json", { name: "roblox-dev", version: "0.8.3", skills: "./skills" });
    json(substitutedSource, ".agents/plugins/marketplace.json", { name: "trembus", plugins: [{ name: "roblox-dev", source: { source: "local", path: "./roblox-dev" } }] });
    external.install.artifact = artifact;
    external.install.marketplaceSource = substitutedSource;
    external.capability.canonicalPath = path.join(substitute, external.relative);
    external.capability.version = "1.0.0";
    external.capability.sourceArtifact = clone(artifact);
    external.install.selection.path = json(substitute, "candidate-selection.json", {
      marketplace: "trembus", outputPath: "candidate-marketplace",
      candidates: [{ name: "roblox-dev", repositoryUrl: artifact.repository, commit: selectedCommit, pluginPath: "roblox-dev", sourceVersion: "0.8.3", targetVersion: "0.8.3", overrides: [] }],
    });
    assertFailure(fixture.validate(), /marketplace|source|identity|config/i);
  });
});

test("required external runtimes need current active records rather than native presence or history", async (t) => {
  const cases = [
    ["no current installs", (e) => { e.capability.installs = []; }, /required|active|codex/i],
    ["history only", (e) => {
      e.capability.historicalInstalls = [{ observedAt: OBSERVED, reason: "Historical selected-cache observation.", record: clone(e.install) }];
      e.capability.installs = [];
    }, /required|active|codex/i],
    ["only observed retained cache", (e) => { e.install.role = "observed"; e.install.state = "retained"; }, /required|active|codex/i],
    ["two active records for required runtime", (e) => { e.capability.installs.push(clone(e.install)); }, /required|active|exactly|duplicate/i],
    ["omitted runtime requirement", (e) => { delete e.capability.requiredActiveRuntimes; }, /requiredActiveRuntimes|required|runtime/i],
    ["duplicate required runtime", (e) => { e.capability.requiredActiveRuntimes = ["codex", "codex"]; }, /requiredActiveRuntimes|required|duplicate/i],
    ["unsupported required runtime", (e) => { e.capability.requiredActiveRuntimes = ["other"]; }, /requiredActiveRuntimes|required|runtime/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      const external = addFrozenExternal(fixture);
      mutate(external);
      assertFailure(fixture.validate(), signal);
    }));
  }
});

test("Claude directory sources follow a current enabled native binding rather than old cache history", async (t) => {
  const nativeFixture = (fixture) => {
    const external = addFrozenExternal(fixture);
    const sourceFolder = path.join(external.root, "roblox-dev");
    const install = observation({
      runtime: "claude", mode: "directory-source", path: external.capability.canonicalPath,
      pluginId: "roblox-dev@trembus", pluginVersion: "0.8.3", pluginRoot: sourceFolder, sourceFolder,
    });
    external.capability.installs.push(install);
    external.capability.requiredActiveRuntimes.push("claude");
    const native = { id: "roblox-dev@trembus", enabled: true, version: "0.8.3", installPath: sourceFolder, readFromFolder: sourceFolder };
    return { external, install, native };
  };
  await t.test("matching current directory source", () => withFixture((fixture) => {
    const { native } = nativeFixture(fixture);
    assertSuccess(fixture.validate({ claudePlugins: [native] }));
  }));
  await t.test("a fixture home cannot fall back to reading the real host Claude registry", () => withFixture((fixture) => {
    nativeFixture(fixture);
    const stub = write(fixture.temporary, "bin/claude", "#!/bin/sh\n: > \"$CAPABILITY_FIXTURE_CLAUDE_MARKER\"\nprintf '%s\\n' '[]'\n");
    fs.chmodSync(stub, 0o755);
    const marker = path.join(fixture.temporary, "native-cli-was-called");
    const previousPath = process.env.PATH;
    const previousMarker = process.env.CAPABILITY_FIXTURE_CLAUDE_MARKER;
    process.env.PATH = `${path.dirname(stub)}${path.delimiter}${previousPath ?? ""}`;
    process.env.CAPABILITY_FIXTURE_CLAUDE_MARKER = marker;
    try {
      assertFailure(fixture.validate({ claudePlugins: undefined }), /fixture home requires explicit claudePlugins/i);
      assert.equal(fs.existsSync(marker), false, "fixture validation must not invoke even the disposable Claude CLI stub");
    } finally {
      if (previousPath === undefined) delete process.env.PATH;
      else process.env.PATH = previousPath;
      if (previousMarker === undefined) delete process.env.CAPABILITY_FIXTURE_CLAUDE_MARKER;
      else process.env.CAPABILITY_FIXTURE_CLAUDE_MARKER = previousMarker;
    }
  }));
  const cases = [
    ["disabled native row", (f) => { f.native.enabled = false; }, /enabled|disabled/i],
    ["wrong native ID", (f) => { f.native.id = "other@trembus"; }, /identity|native|plugin|enabled/i],
    ["wrong native version", (f) => { f.native.version = "0.8.4"; }, /version/i],
    ["wrong source folder", (f) => { f.native.readFromFolder = path.join(f.external.root, "different"); }, /sourceFolder|folder|directory|source|path/i],
    ["wrong native install path", (f) => { f.native.installPath = path.join(f.external.root, "different"); }, /installPath|path|root/i],
    ["duplicate native rows", (f, rows) => rows.push(clone(f.native)), /duplicate|native|identity|uniquely enabled/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      const fixtureNative = nativeFixture(fixture);
      const rows = [fixtureNative.native];
      mutate(fixtureNative, rows);
      assertFailure(fixture.validate({ claudePlugins: rows }), signal);
    }));
  }
});

test("vendor loading keeps native enablement strict and scopes the remote Figma observation", async (t) => {
  const vendor = (fixture, id, version, marketplace) => {
    const pluginRoot = path.join(fixture.home, ".codex/plugins/cache", marketplace, id, version);
    json(pluginRoot, ".codex-plugin/plugin.json", { name: id, version, skills: "./skills" });
    const install = observation({ mode: "vendor-plugin-cache", path: pluginRoot, pluginRoot, pluginVersion: version, pluginId: `${id}@${marketplace}` });
    const capability = { id, kind: "vendor-adapter", owner: "Fixture vendor", version, requiredActiveRuntimes: ["codex"], installs: [install], historicalInstalls: [] };
    fixture.registry.capabilities.push(capability);
    write(fixture.home, ".codex/config.toml", `[plugins.${JSON.stringify(install.pluginId)}]\nenabled = true\n`);
    return { capability, install };
  };
  await t.test("an enabled vendor plugin has ordinary native identity evidence", () => withFixture((fixture) => {
    vendor(fixture, "frontend-design", "1.0.0", "claude-plugins-official");
    assertSuccess(fixture.validate());
  }));
  await t.test("a disabled frontend plugin cannot waive native identity by claiming session exposure", () => withFixture((fixture) => {
    const { install } = vendor(fixture, "frontend-design", "1.0.0", "claude-plugins-official");
    write(fixture.home, ".codex/config.toml", '[plugins."frontend-design@claude-plugins-official"]\nenabled = false\n');
    delete install.pluginId;
    install.state = "session-exposed";
    assertFailure(fixture.validate(), /active plugin|enabled|pluginId|identity/i);
  }));
  await t.test("Figma remote availability remains a dated observation without invented native identity or execution", () => withFixture((fixture) => {
    const { capability, install } = vendor(fixture, "figma", "16.0.0", "openai-curated-remote");
    delete install.pluginId;
    install.state = "session-exposed";
    capability.installs.push(observation({ runtime: "claude", role: "unverified", state: "unverified", mode: "remote-connector" }));
    write(fixture.home, ".codex/config.toml", "# No invented local Figma plugin identity.\n");
    const result = fixture.validate();
    assertSuccess(result);
    assert.ok(result.findings.some((finding) => finding.id === "figma/codex" && finding.dimension === "execution" && finding.status === "unverified"));
  }));
});

test("complete source artifacts refuse file, hash, mode, commit, path and origin substitution", async (t) => {
  const cases = [
    ["changed source bytes", (f) => write(f.root, `${SKILL_PATH}/references/guide.md`, "changed\n"), /file|hash|content|diverg|differ|unreviewed/i],
    ["missing source file", (f) => fs.unlinkSync(path.join(f.canonical, "references/guide.md")), /file|missing|diverg|differ/i],
    ["extra source file", (f) => write(f.root, `${SKILL_PATH}/references/extra.md`, "not in approved source\n"), /file|extra|diverg|differ/i],
    ["changed executable mode", (f) => fs.chmodSync(path.join(f.canonical, "scripts/check.sh"), 0o644), /mode|diverg|differ/i],
    ["omitted approved file", (f) => delete f.capability.sourceArtifact.files["references/guide.md"], /file|complete|set/i],
    ["invented approved file", (f) => { f.capability.sourceArtifact.files["invented.txt"] = { mode: "100644", sha256: sha256("invented") }; }, /file|complete|set/i],
    ["false approved digest", (f) => { f.capability.sourceArtifact.files["SKILL.md"].sha256 = "a".repeat(64); }, /hash|digest|sha256/i],
    ["false approved mode", (f) => { f.capability.sourceArtifact.files["scripts/check.sh"].mode = "100644"; }, /mode/i],
    ["nonexistent commit", (f) => { f.capability.sourceArtifact.commit = "a".repeat(40); }, /commit|object|git/i],
    ["abbreviated commit", (f) => { f.capability.sourceArtifact.commit = f.capability.sourceArtifact.commit.slice(0, 8); }, /commit|40|full|invalid immutable source artifact/i],
    ["missing subtree", (f) => { f.capability.sourceArtifact.path = "missing/skill"; }, /path|subtree|file|missing/i],
    ["wrong repository identity", (f) => { f.capability.sourceArtifact.repository = "https://example.invalid/other.git"; }, /repository|origin|identity/i],
    ["absolute artifact path", (f) => { f.capability.sourceArtifact.path = f.canonical; }, /path|relative|unsafe|invalid immutable source artifact/i],
    ["escaping artifact path", (f) => { f.capability.sourceArtifact.path = "../outside"; }, /path|relative|unsafe|invalid immutable source artifact/i],
    ["escaping manifest entry", (f) => { f.capability.sourceArtifact.files["../outside"] = { mode: "100644", sha256: sha256("outside") }; }, /path|relative|unsafe|invalid artifact file/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      mutate(fixture);
      assertFailure(fixture.validate(), signal);
    }));
  }
});

test("escaping source symlinks cannot be legitimized by their Git blob digest", () => {
  withFixture((fixture) => {
    const outside = write(fixture.temporary, "outside-secret.txt", "outside fixture source\n");
    fs.symlinkSync(outside, path.join(fixture.canonical, "escape.txt"));
    const commitId = commit(fixture.root, "Escaping symlink fixture");
    fixture.capability.sourceArtifact = sourceArtifact(fixture.root, commitId, SKILL_PATH);
    fixture.registry.sourceRepository.commit = commitId;
    assertFailure(fixture.validate(), /symlink|escap|outside/i);
  });
});

test("an ancestor symlink cannot move correct canonical bytes outside their owning repository", () => {
  withFixture((fixture) => {
    const external = addFrozenExternal(fixture);
    const ancestor = path.join(external.root, "roblox-dev/skills");
    const outside = path.join(fixture.temporary, "outside-owned-source");
    fs.cpSync(ancestor, outside, { recursive: true });
    fs.rmSync(ancestor, { recursive: true });
    fs.symlinkSync(outside, ancestor);
    assertFailure(fixture.validate(), /canonical|symlink|escap|owning|repository|source/i);
  });
});

test("a pinned relative symlink wholly inside its named source subtree is valid", () => {
  withFixture((fixture) => {
    fs.symlinkSync("guide.md", path.join(fixture.canonical, "references/guide-alias.md"));
    const commitId = commit(fixture.root, "Internal alias belongs to the source artifact");
    fixture.capability.sourceArtifact = sourceArtifact(fixture.root, commitId, SKILL_PATH);
    fixture.registry.sourceRepository.commit = commitId;
    assertSuccess(fixture.validate());
  });
});

test("a self-consistent alternate subtree cannot stand in for the declared canonical source", () => {
  withFixture((fixture) => {
    const alternative = "other-owner/fixture-craft";
    fs.cpSync(fixture.canonical, path.join(fixture.root, alternative), { recursive: true });
    const commitId = commit(fixture.root, "Same name does not establish the same source identity");
    fixture.capability.sourceArtifact = sourceArtifact(fixture.root, commitId, alternative);
    fixture.registry.sourceRepository.commit = commitId;
    assertFailure(fixture.validate(), /canonical|path|source|identity|subtree/i);
  });
});

test("registered symlinks must resolve to the exact canonical directory", async (t) => {
  await t.test("ordinary copied directory is not a source link", () => withFixture((fixture) => {
    const install = fixture.capability.installs[0];
    fs.unlinkSync(install.path);
    fs.cpSync(fixture.canonical, install.path, { recursive: true });
    assertFailure(fixture.validate(), /symlink|canonical|resolv/i);
  }));
  await t.test("a same-version different source is refused", () => withFixture((fixture) => {
    const alternative = path.join(fixture.temporary, "alternative");
    fs.cpSync(fixture.canonical, alternative, { recursive: true });
    const install = fixture.capability.installs[0];
    fs.unlinkSync(install.path);
    fs.symlinkSync(alternative, install.path);
    assertFailure(fixture.validate(), /canonical|resolv|target/i);
  }));
  await t.test("missing registered path is refused", () => withFixture((fixture) => {
    fs.unlinkSync(fixture.capability.installs[0].path);
    assertFailure(fixture.validate(), /missing|discover/i);
  }));
});

test("global duplicate discovery remains strict even when the registered path is correct", async (t) => {
  for (const runtime of ["codex", "claude"]) {
    await t.test(runtime, () => withFixture((fixture) => {
      write(fixture.home, `.${runtime}/skills/duplicate/SKILL.md`, skill());
      assertFailure(fixture.validate(), /duplicate|discovers 2|2 copies/i);
    }));
    await t.test(`${runtime} same-source symlink alias`, () => withFixture((fixture) => {
      fs.symlinkSync(fixture.canonical, path.join(fixture.home, `.${runtime}/skills/duplicate-alias`));
      assertFailure(fixture.validate(), /duplicate|discovers 2|2 copies/i);
    }));
  }
  await t.test("legacy standalone Figma remains refused", () => withFixture((fixture) => {
    write(fixture.home, ".codex/skills/old-figma/SKILL.md", skill("figma"));
    assertFailure(fixture.validate(), /legacy.*figma|figma.*legacy/i);
  }));
  await t.test("malformed duplicate metadata cannot hide an owned name", () => withFixture((fixture) => {
    write(fixture.home, ".codex/skills/duplicate/SKILL.md", "---\nname: fixture-craft\nversion: 1.0.0\nmetadata:\n  source_version: 2.0.0\n---\n");
    assertFailure(fixture.validate(), /duplicate|copies|frontmatter|conflict|discovers/i);
  }));
  await t.test("unsupported duplicate header cannot hide an owned name", () => withFixture((fixture) => {
    write(fixture.home, ".claude/skills/duplicate/SKILL.md", "---\nname: fixture-craft\nallowed-tools: [Read, Write]\n---\n");
    assertFailure(fixture.validate(), /duplicate|copies|frontmatter|unsupported|discovers/i);
  }));
  await t.test("a quoted name key cannot hide an owned duplicate", () => withFixture((fixture) => {
    write(fixture.home, ".codex/skills/duplicate/SKILL.md", '---\n"name": fixture-craft\nversion: 1.0.0\n---\n');
    assertFailure(fixture.validate(), /duplicate|copies|frontmatter|unsupported|discovers/i);
  }));
  await t.test("an unclassifiable flow-mapping header fails closed", () => withFixture((fixture) => {
    write(fixture.home, ".codex/skills/duplicate/SKILL.md", "---\n{name: fixture-craft, version: 1.0.0}\n---\n");
    assertFailure(fixture.validate(), /duplicate|copies|frontmatter|unsupported|classif|identif|discovers/i);
  }));
  await t.test("an unclassifiable anchored name fails closed", () => withFixture((fixture) => {
    write(fixture.home, ".claude/skills/duplicate/SKILL.md", "---\nname: &owner fixture-craft\nversion: 1.0.0\n---\n");
    assertFailure(fixture.validate(), /duplicate|copies|frontmatter|unsupported|classif|identif|discovers/i);
  }));
  await t.test("an unrelated vendor header outside the selected parser grammar is not an owned duplicate", () => withFixture((fixture) => {
    write(fixture.home, ".codex/skills/unrelated-vendor/SKILL.md", "---\nname: unrelated-vendor\nallowed-tools: [Read, Write]\n---\n");
    assertSuccess(fixture.validate());
  }));
});

test("historical install evidence cannot satisfy current active loading", () => {
  withFixture((fixture) => {
    const old = fixture.capability.installs.shift();
    fixture.capability.historicalInstalls.push({ observedAt: "2026-07-24", reason: "Superseded fixture observation.", record: old });
    fs.unlinkSync(old.path);
    assertFailure(fixture.validate(), /codex|active|discover/i);
    assert.ok(!fixture.validate().errors.some((message) => message.includes("historical") && message.includes("missing")), "absent historical paths are not current requirements");
  });
});

test("global discovery and merely observed records cannot replace required active install evidence", async (t) => {
  await t.test("no current install records", () => withFixture((fixture) => {
    fixture.capability.installs = [];
    assertFailure(fixture.validate(), /active|install|codex|claude/i);
  }));
  await t.test("only observed current rows", () => withFixture((fixture) => {
    for (const install of fixture.capability.installs) install.role = "observed";
    assertFailure(fixture.validate(), /active|install|codex|claude/i);
  }));
});

test("unreviewed owned and pending local skills remain review-required", async (t) => {
  await t.test("owned working observation cannot promote a source revision", () => withFixture((fixture) => {
    write(fixture.root, `${SKILL_PATH}/SKILL.md`, skill("fixture-craft", "1.1.0"));
    fixture.capability.sourceStatus = "local-unreviewed";
    fixture.capability.workingObservation = { observedAt: OBSERVED, scope: "Unreviewed fixture source.", version: "1.1.0", state: "unreviewed" };
    assertFailure(fixture.validate(), /unreviewed|review|diverg|no accepted immutable provenance/i);
  }));
  await t.test("pending standalone source never becomes an accepted bundle member", () => withFixture((fixture) => {
    write(fixture.root, "agent-assets/skills/pending-kernel/SKILL.md", skill("pending-kernel", "2.0.0"));
    fixture.registry.capabilities.push({
      id: "pending-kernel", kind: "pending-local-skill", owner: "Asset-Studio",
      canonicalPath: "agent-assets/skills/pending-kernel", version: "2.0.0", sourceStatus: "local-unreviewed",
      workingObservation: { observedAt: OBSERVED, scope: "Untracked pending fixture source.", version: "2.0.0", state: "unreviewed" }, requiredActiveRuntimes: [], installs: [], historicalInstalls: [],
    });
    assertFailure(fixture.validate(), /pending|unreviewed|review/i);
  }));
  await t.test("an observed newer local bundle is not an accepted release", () => withFixture((fixture) => {
    const sourceRoot = path.join(fixture.temporary, "working-bundle");
    git(fixture.root, "worktree", "add", "--detach", "--quiet", sourceRoot, fixture.registry.sourceRepository.commit);
    for (const runtime of ["claude", "codex"]) {
      const relative = `agent-assets/plugins/asset-production/.${runtime}-plugin/plugin.json`;
      const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, relative), "utf8"));
      manifest.version = "0.2.0";
      json(sourceRoot, relative, manifest);
    }
    for (const install of fixture.capability.installs) {
      fs.unlinkSync(install.path);
      fs.symlinkSync(path.join(sourceRoot, SKILL_PATH), install.path);
    }
    fixture.registry.workingBundleObservation = { observedAt: OBSERVED, scope: "Unreviewed local bundle observation.", version: "0.2.0", state: "unreviewed" };
    assertFailure(fixture.validate({ sourceRoot }), /bundle.*unreviewed|unreviewed.*bundle/i);
    assert.equal(fixture.registry.pluginBundle.version, "0.1.0");
  }));
  await t.test("a pinned legacy version header still requires a host metadata migration", () => withFixture((fixture) => {
    write(fixture.root, `${SKILL_PATH}/SKILL.md`, "---\nname: fixture-craft\nversion: 1.0.0\ndescription: Legacy fixture format.\n---\n");
    const commitId = commit(fixture.root, "Pinned legacy format remains a readiness gap");
    fixture.registry.sourceRepository.commit = commitId;
    fixture.capability.sourceArtifact = sourceArtifact(fixture.root, commitId, SKILL_PATH);
    assertFailure(fixture.validate(), /legacy|metadata|migration/i);
  }));
});

test("isolated validation accepts its owning Git worktree but refuses an arbitrary source root", async (t) => {
  await t.test("same common Git directory is trusted", () => withFixture((fixture) => {
    const isolated = path.join(fixture.temporary, "isolated");
    git(fixture.root, "worktree", "add", "--detach", "--quiet", isolated, fixture.registry.sourceRepository.commit);
    assertSuccess(fixture.validate({ root: isolated, sourceRoot: fixture.root }));
  }));
  await t.test("unrelated root with copied bytes and another origin is refused", () => withFixture((fixture) => {
    const impostor = path.join(fixture.temporary, "impostor");
    fs.cpSync(fixture.root, impostor, { recursive: true, filter: (candidate) => path.basename(candidate) !== ".git" });
    initRepo(impostor, "https://example.invalid/impostor.git");
    commit(impostor, "Copied source does not establish provenance");
    assertFailure(fixture.validate({ sourceRoot: impostor }), /source.?root|repository|identity|origin|trust/i);
  }));
});

test("schema, types, observation dates and bundle metadata reject unsupported claims", async (t) => {
  const cases = [
    ["schema", (f) => { f.registry.schemaVersion = "1.0.0"; }, /schema/i],
    ["capability list type", (f) => { f.registry.capabilities = {}; }, /capabilities|array/i],
    ["duplicate ID", (f) => f.registry.capabilities.push(clone(f.capability)), /duplicate/i],
    ["unknown kind", (f) => { f.capability.kind = "accepted-magic"; }, /kind/i],
    ["unknown source status", (f) => { f.capability.sourceStatus = "promoted-by-cache"; }, /sourceStatus|source status/i],
    ["unknown runtime", (f) => { f.capability.installs[0].runtime = "other"; }, /runtime/i],
    ["unknown mode", (f) => { f.capability.installs[0].mode = "generated-plugin-cache"; }, /mode/i],
    ["unknown state", (f) => { f.capability.installs[0].state = "accepted"; }, /state/i],
    ["unknown role", (f) => { f.capability.installs[0].role = "accepted"; }, /role/i],
    ["unproven execution", (f) => { f.capability.installs[0].execution = "verified"; }, /execution/i],
    ["missing install date", (f) => delete f.capability.installs[0].observedAt, /date|observedAt/i],
    ["invalid calendar date", (f) => { f.capability.installs[0].observedAt = "2026-02-30"; }, /date|observedAt/i],
    ["future install observation", (f) => { f.capability.installs[0].observedAt = "2027-01-01"; }, /future|observedAt|date/i],
    ["empty observation scope", (f) => { f.capability.installs[0].observationScope = ""; }, /scope/i],
    ["future inventory date", (f) => { f.registry.verifiedAt = "2027-01-01"; }, /future|date|inventory/i],
    ["missing dated inventory", (f) => fs.unlinkSync(path.join(f.root, "agent-assets/inventory-2026-07-24.md")), /inventory/i],
    ["future historical observation", (f) => f.registry.historicalObservations.push({ observedAt: "2027-01-01", scope: "Fixture old record.", record: {} }), /future|date/i],
    ["marketplace-ready assertion", (f) => { f.registry.pluginBundle.marketplaceReady = true; }, /marketplace|local-source/i],
    ["manifest version disagreement", (f) => { const p = "agent-assets/plugins/asset-production/.codex-plugin/plugin.json"; const m = JSON.parse(fs.readFileSync(path.join(f.root, p))); m.version = "9.0.0"; json(f.root, p, m); }, /manifest|version/i],
    ["missing required Codex interface", (f) => { const p = "agent-assets/plugins/asset-production/.codex-plugin/plugin.json"; const m = JSON.parse(fs.readFileSync(path.join(f.root, p))); delete m.interface.defaultPrompt; json(f.root, p, m); }, /interface|defaultPrompt/i],
    ["owned directory outside bundle", (f) => { f.capability.canonicalPath = "agent-assets/skills/outside"; write(f.root, "agent-assets/skills/outside/SKILL.md", skill()); }, /owned|bundle|canonical|path/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      mutate(fixture);
      assertFailure(fixture.validate(), signal);
    }));
  }
});

test("frontmatter metadata versions, quotes, comments, CRLF and block descriptions are parsed deliberately", () => {
  const parsed = parseFrontmatter("---\r\nname: 'fixture-craft' # annotation\r\ndescription: >\r\n  A folded description with : punctuation.\r\n  More prose.\r\nmetadata:\r\n  source_version: \"1.2.3\" # revision\r\n  note: 'contains # literal'\r\n---\r\nbody\r\n");
  assert.equal(parsed.name, "fixture-craft");
  assert.equal(parsed.metadata.source_version, "1.2.3");
  assert.equal(parsed.metadata.note, "contains # literal");
  assert.equal(parseFrontmatter("---\nname: fixture-craft\ndescription: |\n  Literal body.\nversion: '1.2.3'\nmetadata:\n  source_version: 1.2.3\n---\n").version, "1.2.3");
  withFixture((fixture) => assert.equal(readFrontmatter(path.join(fixture.canonical, "SKILL.md")).metadata.source_version, "1.0.0"));
});

test("unsupported or ambiguous frontmatter syntax is refused", async (t) => {
  const cases = [
    ["conflicting version declarations", "version: 1.0.0\nmetadata:\n  source_version: 2.0.0"],
    ["duplicate field", "name: first\nname: second"],
    ["duplicate metadata field", "metadata:\n  source_version: 1.0.0\n  source_version: 1.0.0"],
    ["nested version", "metadata:\n  source_version:\n    nested: 1.0.0"],
    ["inline version list", "version: [1.0.0]"],
    ["block version list", "version:\n  - 1.0.0"],
    ["tag", "version: !!str 1.0.0"],
    ["anchor", "version: &version 1.0.0"],
    ["alias", "version: *version"],
    ["unterminated quote", "version: '1.0.0"],
  ];
  for (const [name, fields] of cases) {
    await t.test(name, () => assert.throws(() => parseFrontmatter(`---\n${fields}\n---\n`), Error));
  }
});

test("the preserved generation routing checks run through the CLI and do not import optional local helpers", async (t) => {
  const cases = [
    ["missing ACTIVE", (f) => fs.unlinkSync(path.join(f.root, "generation/ACTIVE.md")), /ACTIVE\.md.*missing/i],
    ["missing contract pointer", (f) => write(f.root, "generation/ACTIVE.md", "---\nbatch: fixture-batch\n---\nNo contract selected.\n"), /immutable contract/i],
    ["missing selected contract", (f) => fs.unlinkSync(path.join(f.root, "generation/contracts/fixture-batch.md")), /contract.*missing/i],
    ["mismatched batch identity", (f) => write(f.root, "generation/ACTIVE.md", "---\nbatch: another-batch\n---\ncontracts/fixture-batch.md\n"), /identity mismatch/i],
    ["compatibility content drift", (f) => write(f.root, "generation/BATCH.md", "- **Batch id:** `fixture-batch`\n\nDifferent candidate instructions.\n"), /substantive content differs/i],
  ];
  for (const [name, mutate, signal] of cases) {
    await t.test(name, () => withFixture((fixture) => {
      write(fixture.root, "tools/lib/generation-routing.mjs", "throw new Error('unapproved local helper must not execute');\n");
      mutate(fixture);
      assert.match(validateGenerationRoutingLegacy(fixture.root).join("\n"), signal);
      assertFailure(fixture.cli().result, signal);
    }));
  }
});

test("duplicate direct Figma configuration remains a CLI failure", () => {
  withFixture((fixture) => {
    write(fixture.home, ".codex/config.toml", "[mcp_servers.figma]\nurl = 'https://example.invalid/figma'\n");
    assertFailure(fixture.cli().result, /duplicate direct Figma/i);
  });
});
