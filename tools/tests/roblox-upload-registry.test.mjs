import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  RobloxUploadRegistryError,
  joinRobloxUploadRegistry,
  parseRobloxUploadRegistryJsonl,
} from "../lib/roblox-upload-registry.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function makeRecord({
  localPath = "textures/surfaces/example_BLK.png",
  bytes = "asset bytes",
  sourceSha256 = sha256(bytes),
  assetId = "123456789",
  activeAssetId = assetId,
  status = "active",
  creatorStoreUrl = null,
  uploads,
} = {}) {
  const history = uploads ?? [
    {
      asset_id: assetId,
      asset_uri: `rbxassetid://${assetId}`,
      asset_type: "Image",
      creator: { id: "3394700055", name: "TrembusTech", type: "User" },
      inventory_path: "textures/part-texture",
      creator_store_url: creatorStoreUrl,
      status,
      verified_at: "2026-07-14",
      verification_method: "studio-mcp.search_asset + asset-manager.visual-confirmation",
    },
  ];
  return {
    schema_version: 1,
    recorded_at: "2026-07-14",
    local_path: localPath,
    local_uri: `rbxasset://trembus/${localPath}`,
    sha256: sourceSha256,
    active_asset_id: activeAssetId,
    uploads: history,
  };
}

function jsonl(...records) {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

function withAssets(run) {
  const root = mkdtempSync(join(tmpdir(), "asset-studio-roblox-registry-"));
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeAsset(root, localPath, bytes) {
  const path = join(root, ...localPath.split("/"));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

test("exact local_path join emits the read-only Roblox reference and deterministic states", () => {
  withAssets((root) => {
    const bytes = "exact bytes";
    const row = makeRecord({ bytes });
    writeAsset(root, row.local_path, bytes);
    const records = [
      { p: row.local_path, medium: "image" },
      { p: "textures/surfaces/unregistered_BLK.png", medium: "image" },
      { p: "README.md", medium: null },
    ];
    const parsed = parseRobloxUploadRegistryJsonl(jsonl(row));
    const summary = joinRobloxUploadRegistry(records, parsed, { assetsRoot: root });

    assert.deepEqual(summary.byState, { uploaded: 1, needsReview: 0, unregistered: 1 });
    assert.equal(summary.total, 1);
    assert.equal(summary.joined, 1);
    assert.equal(summary.issues.length, 0);
    assert.deepEqual(records[0].roblox, {
      schemaVersion: 1,
      recordedAt: "2026-07-14",
      localUri: `rbxasset://trembus/${row.local_path}`,
      sourceSha256: sha256(bytes),
      checksum: "match",
      uploadCount: 1,
      active: {
        assetId: "123456789",
        assetUri: "rbxassetid://123456789",
        assetType: "Image",
        creator: { id: "3394700055", name: "TrembusTech", type: "User" },
        inventoryPath: "textures/part-texture",
        creatorStoreUrl: null,
        status: "active",
        verifiedAt: "2026-07-14",
        verificationMethod: "studio-mcp.search_asset + asset-manager.visual-confirmation",
      },
    });
  });
});

test("near-miss path is not normalized or case-folded", () => {
  withAssets((root) => {
    const row = makeRecord({ localPath: "Textures/surfaces/example_BLK.png" });
    writeAsset(root, row.local_path, "asset bytes");
    const records = [{ p: "textures/surfaces/example_BLK.png", medium: "image" }];
    const summary = joinRobloxUploadRegistry(
      records,
      parseRobloxUploadRegistryJsonl(jsonl(row)),
      { assetsRoot: root },
    );
    assert.equal(summary.joined, 0);
    assert.equal(summary.orphaned, 1);
    assert.deepEqual(summary.byState, { uploaded: 0, needsReview: 0, unregistered: 1 });
    assert.equal(records[0].roblox, undefined);
    assert.equal(summary.issues[0].kind, "orphan");
  });
});

test("checksum drift is diagnostic and withholds uploaded state", () => {
  withAssets((root) => {
    const row = makeRecord({ bytes: "registered bytes" });
    writeAsset(root, row.local_path, "changed bytes");
    const records = [{ p: row.local_path, medium: "image" }];
    const summary = joinRobloxUploadRegistry(
      records,
      parseRobloxUploadRegistryJsonl(jsonl(row)),
      { assetsRoot: root },
    );
    assert.equal(records[0].roblox.checksum, "mismatch");
    assert.deepEqual(summary.byState, { uploaded: 0, needsReview: 1, unregistered: 0 });
    assert.equal(summary.checksumMismatch, 1);
    assert.equal(summary.issues[0].kind, "checksum-mismatch");
  });
});

test("legacy fuzzy-name ID conflict remains visible without overriding the exact mapping", () => {
  withAssets((root) => {
    const row = makeRecord({ bytes: "asset bytes" });
    writeAsset(root, row.local_path, "asset bytes");
    const records = [{ p: row.local_path, medium: "image", reg: { id: "987654321" } }];
    const summary = joinRobloxUploadRegistry(
      records,
      parseRobloxUploadRegistryJsonl(jsonl(row)),
      { assetsRoot: root },
    );
    assert.equal(records[0].roblox.active.assetId, "123456789");
    assert.equal(records[0].roblox.legacyIdConflict, "987654321");
    assert.equal(summary.legacyIdConflicts, 1);
    assert.equal(summary.issues[0].kind, "legacy-id-conflict");
    assert.deepEqual(summary.byState, { uploaded: 1, needsReview: 0, unregistered: 0 });
  });
});

test("malformed, unsupported, duplicate, and unsafe rows are fatal", async (t) => {
  await t.test("malformed JSON", () => {
    assert.throws(
      () => parseRobloxUploadRegistryJsonl("{oops}\n", { sourceName: "fixture.jsonl" }),
      /fixture\.jsonl:1: invalid JSON/,
    );
  });
  await t.test("unsupported schema", () => {
    const row = makeRecord();
    row.schema_version = 2;
    assert.throws(() => parseRobloxUploadRegistryJsonl(jsonl(row)), /schema_version must be 1/);
  });
  await t.test("duplicate local path", () => {
    const first = makeRecord({ assetId: "111" });
    const second = makeRecord({ assetId: "222" });
    assert.throws(() => parseRobloxUploadRegistryJsonl(jsonl(first, second)), /duplicate local_path/);
  });
  await t.test("duplicate global asset ID", () => {
    const first = makeRecord({ localPath: "textures/a.png", assetId: "111" });
    const second = makeRecord({ localPath: "textures/b.png", assetId: "111" });
    assert.throws(() => parseRobloxUploadRegistryJsonl(jsonl(first, second)), /duplicates 111 from line 1/);
  });
  await t.test("unsafe path", () => {
    const row = makeRecord({ localPath: "textures/../outside.png" });
    assert.throws(() => parseRobloxUploadRegistryJsonl(jsonl(row)), /must not contain/);
  });
  await t.test("active ID mismatch", () => {
    const row = makeRecord({ activeAssetId: "999" });
    assert.throws(() => parseRobloxUploadRegistryJsonl(jsonl(row)), /must identify one entry/);
  });
});

test("null and verified Roblox HTTPS Creator Store URLs are accepted", () => {
  assert.doesNotThrow(() => parseRobloxUploadRegistryJsonl(jsonl(makeRecord())));
  assert.doesNotThrow(() =>
    parseRobloxUploadRegistryJsonl(
      jsonl(
        makeRecord({
          creatorStoreUrl: "https://create.roblox.com/store/asset/123456789/example",
        }),
      ),
    ),
  );
});

test("invalid Creator Store URL is fatal", async (t) => {
  await t.test("non-Roblox host", () => {
    assert.throws(
      () =>
        parseRobloxUploadRegistryJsonl(
          jsonl(makeRecord({ creatorStoreUrl: "https://example.com/123456789" })),
        ),
      /must use a roblox\.com host/,
    );
  });
  await t.test("URL does not contain the asset ID", () => {
    assert.throws(
      () =>
        parseRobloxUploadRegistryJsonl(
          jsonl(makeRecord({ creatorStoreUrl: "https://create.roblox.com/store/asset/999" })),
        ),
      /must contain asset ID 123456789/,
    );
  });
});

test("orphan, drift, and conflict diagnostics have stable counts and order", () => {
  withAssets((root) => {
    const drift = makeRecord({ localPath: "textures/drift.png", bytes: "before", assetId: "111" });
    const orphan = makeRecord({ localPath: "textures/orphan.png", bytes: "orphan", assetId: "222" });
    writeAsset(root, drift.local_path, "after");
    writeAsset(root, orphan.local_path, "orphan");
    const records = [
      { p: drift.local_path, medium: "image", reg: { id: "333" } },
      { p: "textures/unregistered.png", medium: "image" },
    ];
    const summary = joinRobloxUploadRegistry(
      records,
      parseRobloxUploadRegistryJsonl(jsonl(drift, orphan)),
      { assetsRoot: root },
    );
    assert.deepEqual(
      {
        total: summary.total,
        joined: summary.joined,
        orphaned: summary.orphaned,
        checksumMismatch: summary.checksumMismatch,
        legacyIdConflicts: summary.legacyIdConflicts,
        byState: summary.byState,
        issueKinds: summary.issues.map((issue) => issue.kind),
      },
      {
        total: 2,
        joined: 1,
        orphaned: 1,
        checksumMismatch: 1,
        legacyIdConflicts: 1,
        byState: { uploaded: 0, needsReview: 1, unregistered: 1 },
        issueKinds: ["checksum-mismatch", "legacy-id-conflict", "orphan"],
      },
    );
  });
});

test("the public error type is stable for callers", () => {
  assert.throws(
    () => parseRobloxUploadRegistryJsonl("\n"),
    (error) => error instanceof RobloxUploadRegistryError && /contains no records/.test(error.message),
  );
});
