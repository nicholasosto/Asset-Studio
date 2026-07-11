// Workflows the Command Center can replay as Swimlanes — derived entirely from the contract.
//
// Every workflow is data: a `workflow`-kind entity (image-generation · audio-production ·
// 3d-asset) or any other entity that declares a `## Workflow` block (e.g. a pipeline's flow —
// a convention inherited from the upstream Project-System framework; NOT this repo's ADR 0004).
// render-hub.mjs extracts each into graph.json's `workflows` map; this module just adapts that
// map into the picker's option shape. Nothing is hardcoded here.
import type { RunRecord } from '@trembus/ui';
import {
  entities,
  relatedEdges,
  runs as contractRuns,
  swimlaneKinds,
  workflows as contractWorkflows,
} from './contract';
import type { WorkflowContract } from './contract';

export interface WorkflowOption {
  id: string;
  label: string;
  /** Which kind of entity declared it — a standalone `workflow`, or another kind's inline block. */
  source: 'workflow' | 'inline';
  contract: WorkflowContract;
  /** The latest (windowed) runs to replay over this workflow; empty when none captured. */
  runs: RunRecord[];
  /** Total runs in the source, for an honest "latest N of M" when windowed. */
  runsTotal: number;
}

// Ids of entities of a swimlane-carrier kind (config `carriesSwimlanes`) — they lead the picker;
// an inline `## Workflow` on some other kind follows. Derived from the contract, not hardcoded.
const carrierKinds = new Set(swimlaneKinds);
const WORKFLOW_KIND_IDS = new Set(entities.filter((e) => carrierKinds.has(e.kind)).map((e) => e.id));

// ── Run history join ─────────────────────────────────────────────────────────────────────
// render-hub keys runs by the entity that AUTHORED the `## Runs` block. The upstream framework's
// happy path is one entity carrying BOTH `## Workflow` and `## Runs` (same id — a trivial join).
// This project deliberately splits template from instance: a `workflow` holds the swimlane, and each
// `pipeline` that `references` it holds the run log (swimlaneEnforcement: error). So a workflow's
// runs live on its pipelines, one edge away, and must be gathered by walking those edges.
// (`.project-system/` is vendored and never edited, so this template→instance bridge lives here.)
const startedMs = (r: RunRecord): number => {
  const t = typeof r.startedAt === 'number' ? r.startedAt : Date.parse(String(r.startedAt ?? ''));
  return Number.isNaN(t) ? 0 : t;
};

// The runs to replay over one workflow: its own inline runs (if any) plus every referencing
// pipeline's, deduped by authoring entity, namespaced so ids stay unique, and merged newest-first.
function runsForWorkflow(wfId: string): { runs: RunRecord[]; runsTotal: number } {
  const seen = new Set<string>();
  const sources: { id: string; title: string }[] = [];
  const add = (id: string, title: string) => {
    if (contractRuns[id] && !seen.has(id)) {
      seen.add(id);
      sources.push({ id, title });
    }
  };
  add(wfId, contractWorkflows[wfId]?.title ?? wfId); // (1) inline runs on the workflow itself
  for (const e of relatedEdges(wfId)) {
    // (2) pipelines that reference this workflow — the instances that actually ran it
    if (e.dir === 'in' && e.rel === 'references' && e.other.kind === 'pipeline') {
      add(e.other.id, e.other.title);
    }
  }

  // Attribute labels with the source title only when >1 instance feeds this workflow, so the common
  // 1:1 case reads cleanly; ids are always namespaced because pipelines collide on `run-1`.
  const attribute = sources.length > 1;
  const merged: RunRecord[] = [];
  let runsTotal = 0;
  for (const src of sources) {
    const er = contractRuns[src.id];
    runsTotal += er.total ?? 0;
    for (const r of er.runs ?? []) {
      merged.push({
        ...r,
        id: `${src.id}/${r.id ?? ''}`,
        label: attribute ? `${src.title} · ${r.label ?? r.id ?? ''}` : r.label,
      });
    }
  }
  merged.sort((a, b) => startedMs(b) - startedMs(a)); // newest-first across instances; ties keep order
  return { runs: merged, runsTotal };
}

// Everything the Workflows tab can show: every entity that declared a `## Workflow` block,
// standalone `workflow` entities first. Each workflow's runs are joined from the pipelines that
// follow it (see runsForWorkflow) — the picker still reads them off `.runs`/`.runsTotal` unchanged.
export const WORKFLOWS: WorkflowOption[] = Object.entries(contractWorkflows)
  .map(([id, contract]) => {
    const { runs, runsTotal } = runsForWorkflow(id);
    return {
      id,
      label: contract.title ?? id,
      source: WORKFLOW_KIND_IDS.has(id) ? ('workflow' as const) : ('inline' as const),
      contract,
      runs,
      runsTotal,
    };
  })
  .sort((a, b) => (a.source === b.source ? 0 : a.source === 'workflow' ? -1 : 1));
