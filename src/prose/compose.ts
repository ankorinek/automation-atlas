import type { AutomationIR, EntityRef } from "../ir/schema.js";
import { actionToLines, type ProseLine, type RefsByPath } from "./actions.js";
import { conditionsJoined } from "./conditions.js";
import { noNames, type NameResolver } from "./humanize.js";
import { triggerToText } from "./triggers.js";

function groupRefsByPath(refs: EntityRef[]): RefsByPath {
  const map: RefsByPath = new Map();
  for (const ref of refs) {
    const list = map.get(ref.path) ?? [];
    list.push(ref);
    map.set(ref.path, list);
  }
  return map;
}

export interface AutomationProse {
  triggerLines: string[];
  conditionLine?: string;
  actionLines: ProseLine[];
  modeNote?: string;
}

const MODE_NOTES: Record<AutomationIR["mode"], string | undefined> = {
  single: undefined,
  restart: "re-runs restart any in-progress run",
  queued: "re-runs queue up and run one after another",
  parallel: "multiple runs can execute at the same time",
};

export function composeAutomationProse(ir: AutomationIR, names: NameResolver = noNames): AutomationProse {
  const refsByPath = groupRefsByPath(ir.refs);
  return {
    triggerLines: ir.triggers.map((t) => triggerToText(t, names)),
    conditionLine: ir.conditions.length ? `But only if: ${conditionsJoined(ir.conditions, names)}` : undefined,
    actionLines: ir.actions.flatMap((a) => actionToLines(a, names, 0, refsByPath)),
    modeNote: MODE_NOTES[ir.mode],
  };
}
