import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";

export const ROBLOX_UPLOAD_SCHEMA_VERSION = 1;

const SHA256_RE = /^[0-9a-f]{64}$/;
const ASSET_ID_RE = /^[1-9][0-9]*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UPLOAD_STATUSES = new Set(["active", "reviewing", "superseded", "retired"]);

export class RobloxUploadRegistryError extends Error {
  constructor(message) {
    super(message);
    this.name = "RobloxUploadRegistryError";
  }
}

function fail(sourceName, lineNumber, message) {
  const at = lineNumber ? `${sourceName}:${lineNumber}` : sourceName;
  throw new RobloxUploadRegistryError(`${at}: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isValidIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function assertSafeRelativePath(value, label, sourceName, lineNumber) {
  if (!nonEmptyString(value)) fail(sourceName, lineNumber, `${label} must be a non-empty string`);
  if (value.includes("\\")) fail(sourceName, lineNumber, `${label} must use forward slashes`);
  if (value.includes("\0")) fail(sourceName, lineNumber, `${label} must not contain NUL bytes`);
  if (isAbsolute(value)) fail(sourceName, lineNumber, `${label} must be relative`);
  const parts = value.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    fail(sourceName, lineNumber, `${label} must not contain empty, '.' or '..' segments`);
  }
}

function assertStoreUrl(value, assetId, sourceName, lineNumber, prefix) {
  if (value === null) return;
  if (!nonEmptyString(value)) {
    fail(sourceName, lineNumber, `${prefix}.creator_store_url must be a string or null`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(sourceName, lineNumber, `${prefix}.creator_store_url is malformed`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || !hostname) {
    fail(sourceName, lineNumber, `${prefix}.creator_store_url must be an absolute HTTPS URL`);
  }
  if (hostname !== "roblox.com" && !hostname.endsWith(".roblox.com")) {
    fail(sourceName, lineNumber, `${prefix}.creator_store_url must use a roblox.com host`);
  }
  if (!value.includes(assetId)) {
    fail(sourceName, lineNumber, `${prefix}.creator_store_url must contain asset ID ${assetId}`);
  }
}

function validateRecord(record, sourceName, lineNumber, seenAssetIds) {
  if (record.schema_version !== ROBLOX_UPLOAD_SCHEMA_VERSION) {
    fail(
      sourceName,
      lineNumber,
      `schema_version must be ${ROBLOX_UPLOAD_SCHEMA_VERSION}`,
    );
  }
  if (!isValidIsoDate(record.recorded_at)) {
    fail(sourceName, lineNumber, "recorded_at must be a valid ISO date (YYYY-MM-DD)");
  }
  assertSafeRelativePath(record.local_path, "local_path", sourceName, lineNumber);
  const expectedLocalUri = `rbxasset://trembus/${record.local_path}`;
  if (record.local_uri !== expectedLocalUri) {
    fail(sourceName, lineNumber, `local_uri must equal ${JSON.stringify(expectedLocalUri)}`);
  }
  if (typeof record.sha256 !== "string" || !SHA256_RE.test(record.sha256)) {
    fail(sourceName, lineNumber, "sha256 must be 64 lowercase hexadecimal characters");
  }
  if (typeof record.active_asset_id !== "string" || !ASSET_ID_RE.test(record.active_asset_id)) {
    fail(sourceName, lineNumber, "active_asset_id must be a positive numeric string");
  }
  if (!Array.isArray(record.uploads) || record.uploads.length === 0) {
    fail(sourceName, lineNumber, "uploads must be a non-empty array");
  }

  const rowAssetIds = new Set();
  let activeCount = 0;
  let activeUpload = null;
  for (const [index, upload] of record.uploads.entries()) {
    const prefix = `uploads[${index}]`;
    if (!isObject(upload)) fail(sourceName, lineNumber, `${prefix} must be an object`);
    if (typeof upload.asset_id !== "string" || !ASSET_ID_RE.test(upload.asset_id)) {
      fail(sourceName, lineNumber, `${prefix}.asset_id must be a positive numeric string`);
    }
    if (rowAssetIds.has(upload.asset_id)) {
      fail(sourceName, lineNumber, `${prefix}.asset_id duplicates ${upload.asset_id} in this record`);
    }
    if (seenAssetIds.has(upload.asset_id)) {
      const first = seenAssetIds.get(upload.asset_id);
      fail(
        sourceName,
        lineNumber,
        `${prefix}.asset_id duplicates ${upload.asset_id} from line ${first}`,
      );
    }
    rowAssetIds.add(upload.asset_id);
    seenAssetIds.set(upload.asset_id, lineNumber);

    const expectedAssetUri = `rbxassetid://${upload.asset_id}`;
    if (upload.asset_uri !== expectedAssetUri) {
      fail(sourceName, lineNumber, `${prefix}.asset_uri must equal ${JSON.stringify(expectedAssetUri)}`);
    }
    if (!nonEmptyString(upload.asset_type)) {
      fail(sourceName, lineNumber, `${prefix}.asset_type must be a non-empty string`);
    }
    if (!UPLOAD_STATUSES.has(upload.status)) {
      fail(
        sourceName,
        lineNumber,
        `${prefix}.status must be one of ${[...UPLOAD_STATUSES].sort().join(", ")}`,
      );
    }
    if (upload.status === "active") activeCount += 1;
    if (upload.asset_id === record.active_asset_id) activeUpload = upload;

    if (!isObject(upload.creator)) {
      fail(sourceName, lineNumber, `${prefix}.creator must be an object`);
    }
    for (const key of ["id", "name", "type"]) {
      if (!nonEmptyString(upload.creator[key])) {
        fail(sourceName, lineNumber, `${prefix}.creator.${key} must be a non-empty string`);
      }
    }
    assertSafeRelativePath(
      upload.inventory_path,
      `${prefix}.inventory_path`,
      sourceName,
      lineNumber,
    );
    assertStoreUrl(
      upload.creator_store_url,
      upload.asset_id,
      sourceName,
      lineNumber,
      prefix,
    );
    if (!isValidIsoDate(upload.verified_at)) {
      fail(sourceName, lineNumber, `${prefix}.verified_at must be a valid ISO date`);
    }
    if (!nonEmptyString(upload.verification_method)) {
      fail(sourceName, lineNumber, `${prefix}.verification_method must be a non-empty string`);
    }
  }

  if (!activeUpload) {
    fail(sourceName, lineNumber, "active_asset_id must identify one entry in uploads");
  }
  if (activeUpload.status !== "active") {
    fail(sourceName, lineNumber, "the upload selected by active_asset_id must have status='active'");
  }
  if (activeCount !== 1) {
    fail(sourceName, lineNumber, "uploads must contain exactly one status='active' entry");
  }
}

export function parseRobloxUploadRegistryJsonl(text, { sourceName = "<roblox-upload-registry>" } = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Roblox upload registry input must be a string");
  }
  const records = [];
  const seenPaths = new Map();
  const seenAssetIds = new Map();
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      fail(sourceName, lineNumber, `invalid JSON (${error.message})`);
    }
    if (!isObject(record)) fail(sourceName, lineNumber, "each JSONL row must be an object");
    if (typeof record.local_path === "string" && seenPaths.has(record.local_path)) {
      fail(
        sourceName,
        lineNumber,
        `duplicate local_path ${JSON.stringify(record.local_path)} (first seen on line ${seenPaths.get(record.local_path)})`,
      );
    }
    validateRecord(record, sourceName, lineNumber, seenAssetIds);
    seenPaths.set(record.local_path, lineNumber);
    records.push(record);
  }
  if (records.length === 0) fail(sourceName, null, "registry contains no records");
  return records;
}

export function loadRobloxUploadRegistry(registryPath) {
  let text;
  try {
    text = readFileSync(registryPath, "utf8");
  } catch (error) {
    throw new RobloxUploadRegistryError(
      `${registryPath}: could not read registry (${error.message})`,
    );
  }
  return parseRobloxUploadRegistryJsonl(text, { sourceName: registryPath });
}

function fileSha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function resolvedAssetPath(assetsRoot, localPath) {
  const root = resolve(assetsRoot);
  const candidate = resolve(root, ...localPath.split("/"));
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    throw new RobloxUploadRegistryError(
      `local_path ${JSON.stringify(localPath)} resolves outside the asset root`,
    );
  }
  return candidate;
}

function toRobloxRef(row, checksum, legacyIdConflict) {
  const active = row.uploads.find((upload) => upload.asset_id === row.active_asset_id);
  return {
    schemaVersion: row.schema_version,
    recordedAt: row.recorded_at,
    localUri: row.local_uri,
    sourceSha256: row.sha256,
    checksum,
    uploadCount: row.uploads.length,
    active: {
      assetId: active.asset_id,
      assetUri: active.asset_uri,
      assetType: active.asset_type,
      creator: { ...active.creator },
      inventoryPath: active.inventory_path,
      creatorStoreUrl: active.creator_store_url,
      status: "active",
      verifiedAt: active.verified_at,
      verificationMethod: active.verification_method,
    },
    ...(legacyIdConflict ? { legacyIdConflict } : {}),
  };
}

export function joinRobloxUploadRegistry(records, registryRows, { assetsRoot }) {
  const byPath = new Map(records.map((record) => [record.p, record]));
  const issues = [];
  let joined = 0;
  let orphaned = 0;
  let checksumMismatch = 0;
  let legacyIdConflicts = 0;

  for (const row of registryRows) {
    const record = byPath.get(row.local_path);
    if (!record) {
      orphaned += 1;
      issues.push({
        kind: "orphan",
        localPath: row.local_path,
        message: "Upload metadata has no exact-path asset record.",
      });
      continue;
    }

    let actualSha256;
    try {
      actualSha256 = fileSha256(resolvedAssetPath(assetsRoot, row.local_path));
    } catch (error) {
      throw new RobloxUploadRegistryError(
        `${row.local_path}: could not hash joined asset (${error.message})`,
      );
    }
    const checksum = actualSha256 === row.sha256 ? "match" : "mismatch";
    const legacyId = typeof record.reg?.id === "string" ? record.reg.id : null;
    const legacyIdConflict = legacyId && legacyId !== row.active_asset_id ? legacyId : null;
    record.roblox = toRobloxRef(row, checksum, legacyIdConflict);
    joined += 1;

    if (checksum === "mismatch") {
      checksumMismatch += 1;
      issues.push({
        kind: "checksum-mismatch",
        localPath: row.local_path,
        message: `Upload metadata is bound to ${row.sha256}; current bytes hash to ${actualSha256}.`,
      });
    }
    if (legacyIdConflict) {
      legacyIdConflicts += 1;
      issues.push({
        kind: "legacy-id-conflict",
        localPath: row.local_path,
        message: `Exact-path Roblox ID ${row.active_asset_id} differs from name-matched catalog ID ${legacyIdConflict}.`,
      });
    }
  }

  const byState = { uploaded: 0, needsReview: 0, unregistered: 0 };
  for (const record of records) {
    if (record.medium === null) continue;
    if (!record.roblox) byState.unregistered += 1;
    else if (record.roblox.checksum === "mismatch") byState.needsReview += 1;
    else byState.uploaded += 1;
  }

  return {
    schemaVersion: ROBLOX_UPLOAD_SCHEMA_VERSION,
    total: registryRows.length,
    joined,
    orphaned,
    checksumMismatch,
    legacyIdConflicts,
    byState,
    issues,
  };
}
