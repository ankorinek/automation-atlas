// Pure graph builder for the global entity<->automation dependency view. Deliberately an "ego
// view" (see docs/adr/0001-elkjs-vs-dagre.md) — one center node (an automation or an entity) plus
// its direct neighbors, not a full graph of every automation/entity at once. A real HA instance
// can have hundreds of entities; a global hairball wouldn't render usefully with ELK's layered
// layout, and clicking a neighbor to recenter is how the user walks further out.

import type { Atlas, EntityRefRole } from "../ir/schema.js";
import { type NameResolver, noNames } from "../prose/humanize.js";

export type EgoNodeKind = "automation" | "entity";

export interface EgoNode {
  id: string;
  kind: EgoNodeKind;
  lines: string[];
  isCenter: boolean;
}

export interface EgoEdge {
  id: string;
  source: string;
  target: string;
  label?: string[];
  roles: EntityRefRole[];
  heuristic: boolean;
}

export interface EgoGraph {
  nodes: EgoNode[];
  edges: EgoEdge[];
}

// Direction is intrinsic to the role, not to which side is "centered": these roles mean the
// neighbor feeds INTO the automation (entity/automation -> automation); the rest mean the
// automation acts OUT onto the neighbor (automation -> entity/automation).
const INCOMING_ROLES = new Set<EntityRefRole>(["trigger", "condition-read", "action-read", "template"]);

const ROLE_LABELS: Record<EntityRefRole, string> = {
  trigger: "triggers",
  "condition-read": "reads (condition)",
  "action-read": "reads",
  "action-write": "sets",
  "action-invoke": "triggers run of",
  template: "reads (template)",
};

function nodeKind(id: string): EgoNodeKind {
  return id.startsWith("automation.") ? "automation" : "entity";
}

interface Accum {
  source: string;
  target: string;
  roles: Set<EntityRefRole>;
  heuristic: boolean;
}

function accumulate(
  acc: Map<string, Accum>,
  automationId: string,
  neighborId: string,
  role: EntityRefRole,
  heuristic: boolean,
): void {
  const incoming = INCOMING_ROLES.has(role);
  const source = incoming ? neighborId : automationId;
  const target = incoming ? automationId : neighborId;
  const key = `${source}->${target}`;
  const existing = acc.get(key);
  if (existing) {
    existing.roles.add(role);
    existing.heuristic = existing.heuristic || heuristic;
  } else {
    acc.set(key, { source, target, roles: new Set([role]), heuristic });
  }
}

export function buildEgoGraph(centerId: string, atlas: Atlas, names: NameResolver = noNames): EgoGraph {
  const centerAutomation = atlas.automations.find((a) => a.entityId === centerId);
  const acc = new Map<string, Accum>();

  if (centerAutomation) {
    for (const ref of centerAutomation.refs) {
      accumulate(acc, centerId, ref.entityId, ref.role, ref.heuristic ?? false);
    }
    // Other automations may reference THIS automation's entity_id (e.g. action-invoke calling
    // automation.trigger on it) — invisible from centerAutomation.refs alone, since that only
    // covers what the center automation itself references, not who references it back.
    const inbound = atlas.index.byEntity.get(centerId) ?? [];
    for (const entry of inbound) {
      if (entry.automationId === centerId) continue;
      accumulate(acc, entry.automationId, centerId, entry.role, false);
    }
  } else {
    const inbound = atlas.index.byEntity.get(centerId) ?? [];
    for (const entry of inbound) {
      accumulate(acc, entry.automationId, centerId, entry.role, false);
    }
  }

  const neighborIds = new Set<string>();
  for (const { source, target } of acc.values()) {
    if (source !== centerId) neighborIds.add(source);
    if (target !== centerId) neighborIds.add(target);
  }

  const nodes: EgoNode[] = [
    { id: centerId, kind: nodeKind(centerId), lines: [names(centerId) ?? centerId], isCenter: true },
    ...[...neighborIds].map(
      (id): EgoNode => ({ id, kind: nodeKind(id), lines: [names(id) ?? id], isCenter: false }),
    ),
  ];

  const edges: EgoEdge[] = [...acc.entries()].map(([key, { source, target, roles, heuristic }]) => {
    const roleList = [...roles];
    return {
      id: key,
      source,
      target,
      label: [roleList.map((r) => ROLE_LABELS[r]).join(", ")],
      roles: roleList,
      heuristic,
    };
  });

  return { nodes, edges };
}
