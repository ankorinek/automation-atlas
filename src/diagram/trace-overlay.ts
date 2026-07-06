// Pure trace-overlay logic. Deliberately conservative: a node/edge only lights up when the
// trace gives DIRECT positive evidence (its own path was logged) — no inferred/derived
// highlighting for synthetic structural nodes (join/terminal/"done"), since that risks
// showing two mutually-exclusive branches as both "taken" (see design note in the module
// history / PR description). A join simply not lighting up is a minor cosmetic gap, not a
// correctness bug; a false "taken" edge would be.

import type { AutomationIR } from "../ir/schema.js";
import type { AutomationTraceDetail } from "../ha/types.js";
import type { FlowEdge, FlowNode } from "./build-graph.js";

export interface TraceOverlay {
  executedPaths: Set<string>;
  /** The IR path of the trigger that fired this run, if we can match it — undefined if ambiguous. */
  firedTriggerId?: string;
}

export function computeExecutedPaths(trace: AutomationTraceDetail): Set<string> {
  return new Set(trace.action_trace.map((step) => step.path));
}

/** True if `value` satisfies a numeric_state trigger's above/below bounds. */
function satisfiesBounds(value: number, above?: number, below?: number): boolean {
  return (above === undefined || value > above) && (below === undefined || value < below);
}

/**
 * Best-effort match of the trace's fired trigger against the automation's own trigger list.
 * HA's trace.trigger carries a description/platform/entity_id, not the trigger's own `id`,
 * so this is a heuristic — ambiguous cases return undefined rather than guessing wrong.
 */
export function matchFiredTrigger(ir: AutomationIR, trace: AutomationTraceDetail): string | undefined {
  const fired = trace.trigger;
  if (!fired?.entity_id) return undefined;
  let candidates = ir.triggers.filter((t) => "entityId" in t && t.entityId.includes(fired.entity_id!));
  if (candidates.length <= 1) return candidates[0]?.path;

  // Multiple triggers share this entity_id (e.g. several above/below thresholds on the same
  // sensor, as in the freezer warning/critical/ok triggers) — narrow by which one's bounds
  // actually match the observed to_state/from_state crossing.
  const toNum = Number(fired.to_state);
  const fromNum = fired.from_state !== undefined ? Number(fired.from_state) : NaN;
  if (!Number.isNaN(toNum)) {
    const crossed = candidates.filter((t) => {
      if (t.kind !== "numeric_state") return false;
      const toOk = satisfiesBounds(toNum, t.above, t.below);
      if (!toOk) return false;
      // If we know the prior value, this trigger should only fire if it DIDN'T already satisfy the bounds.
      if (!Number.isNaN(fromNum) && satisfiesBounds(fromNum, t.above, t.below)) return false;
      return true;
    });
    if (crossed.length === 1) return crossed[0]!.path;
  }

  const platformMatch = candidates.filter((t) => t.kind === fired.platform);
  return platformMatch.length === 1 ? platformMatch[0]!.path : undefined;
}

export function buildTraceOverlay(ir: AutomationIR, trace: AutomationTraceDetail): TraceOverlay {
  return { executedPaths: computeExecutedPaths(trace), firedTriggerId: matchFiredTrigger(ir, trace) };
}

export function isNodeExecuted(node: FlowNode, overlay: TraceOverlay): boolean {
  return overlay.executedPaths.has(node.id) || node.id === overlay.firedTriggerId;
}

/**
 * All triggers converge on the same first action node (any one of them can fire the run), so
 * `executedPaths.has(edge.target)` alone would light up every trigger's edge whenever the run
 * happened at all. Trigger-sourced edges need their own rule: taken only for the trigger that
 * actually fired. Every other edge target gets its own distinct trace path, so the general rule
 * (target present in the trace) is unambiguous there.
 */
export function isEdgeTaken(edge: Pick<FlowEdge, "source" | "target">, overlay: TraceOverlay): boolean {
  if (edge.source.startsWith("trigger/") || edge.source === "start") {
    return edge.source === overlay.firedTriggerId;
  }
  return overlay.executedPaths.has(edge.target);
}
