// Decision ADR bodies → a Brief the Decision drawer renders. Path 1 of "read the decision in-app":
// the vendored render-hub.mjs can't be edited and _project/ is off the HTTP surface, so a
// project-owned emitter (tools/build-decision-briefs.mjs) captures each decision's markdown body
// into previews/dashboards/decision-briefs.json — imported (inlined at build) here like the graph +
// hub contracts in ./contract. `fromMarkdown` parses each body into Brief sections CLIENT-SIDE, so
// the emitter stays zero-dep. Keyed by decision id == the contract node id (join verified 1:1).
import { fromMarkdown } from '@trembus/ui';
import type { BriefContract } from '@trembus/ui';
import doc from '../../../previews/dashboards/decision-briefs.json';

const bodies: Record<string, string> = (doc as { bodies?: Record<string, string> }).bodies ?? {};

export interface DecisionBrief {
  /** A sections-only contract — the drawer supplies its own title/status header (the Brief header
   *  is hidden in CSS), so this carries just the ADR's ## sections. */
  data: BriefContract;
  /** Every section but the first (Context) starts collapsed, so the drawer opens compact and the
   *  reader expands what they want — the same progressive-disclosure the asset inspector uses. */
  defaultCollapsed: string[];
}

// A decision id → its ADR rendered as collapsible Brief sections, or null when the emitter captured
// no body (an older JSON, or a non-decision id). Section ids are assigned here (fromMarkdown leaves
// them unset) so "collapse all but the first" is deterministic.
export function decisionBrief(id: string): DecisionBrief | null {
  const body = bodies[id];
  if (!body) return null;
  const sections = fromMarkdown(body).sections.map((s, i) => ({ ...s, id: s.id ?? `sec${i}` }));
  if (!sections.length) return null;
  return {
    data: { view: 'brief', sections },
    defaultCollapsed: sections.slice(1).map((s) => s.id as string),
  };
}
