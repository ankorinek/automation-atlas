// Pure graph builder: AutomationIR -> a flat node/edge graph ready for ELK layout.
// Deliberately flat (not ELK hierarchical containers) — branch points (choose/if/parallel)
// become decision/fork nodes with labeled edges to each branch, which is both a standard
// flowchart idiom and far simpler to lay out than nested containers with cross-boundary edges.
//
// Node ids ARE the IR path (trigger/N, condition/N, action/N/...) wherever a real IR node
// exists, so trace-overlay lookup (src/diagram/trace-overlay.ts) is a direct set-membership
// check — no separate id-mapping layer.

import type { ActionNode, AutomationIR, ConditionNode, TriggerNode } from "../ir/schema.js";
import { actionToLines } from "../prose/actions.js";
import { conditionToText, conditionsJoined } from "../prose/conditions.js";
import { noNames, type NameResolver } from "../prose/humanize.js";
import { triggerToText } from "../prose/triggers.js";

export type FlowNodeKind = "trigger" | "condition" | "decision" | "fork" | "action" | "terminal" | "join";

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  lines: string[];
  /** The underlying IR node, so a click can show prose for exactly this step. */
  source?: TriggerNode | ConditionNode | ActionNode;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string[];
}

export interface FlowchartGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const WRAP_WIDTH = 26;
const EDGE_LABEL_WRAP_WIDTH = 20;

function wrap(text: string, maxLen = WRAP_WIDTH): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > maxLen && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [text];
}

type AddEdge = (source: string, target: string, label?: string) => void;

function processAction(
  action: ActionNode,
  prevIds: string[],
  edgeLabel: string | undefined,
  nodes: FlowNode[],
  names: NameResolver,
  addEdge: AddEdge,
): string[] {
  switch (action.kind) {
    case "choose": {
      const decisionId = action.path;
      nodes.push({ id: decisionId, kind: "decision", lines: ["Depending on the situation…"], source: action });
      for (const p of prevIds) addEdge(p, decisionId, edgeLabel);
      const joinId = `${action.path}/join`;
      nodes.push({ id: joinId, kind: "join", lines: [] });
      action.branches.forEach((branch, i) => {
        const label = `${i === 0 ? "If" : "Otherwise, if"} ${conditionsJoined(branch.conditions, names)}`;
        if (branch.sequence.length === 0) {
          addEdge(decisionId, joinId, label);
        } else {
          const exits = processSequence(branch.sequence, [decisionId], label, nodes, names, addEdge);
          for (const e of exits) addEdge(e, joinId);
        }
      });
      if (action.default?.length) {
        const exits = processSequence(action.default, [decisionId], "Otherwise", nodes, names, addEdge);
        for (const e of exits) addEdge(e, joinId);
      } else {
        addEdge(decisionId, joinId, "Otherwise: (nothing)");
      }
      return [joinId];
    }

    case "if": {
      const decisionId = action.path;
      nodes.push({
        id: decisionId,
        kind: "decision",
        lines: wrap(conditionsJoined(action.conditions, names), 40),
        source: action,
      });
      for (const p of prevIds) addEdge(p, decisionId, edgeLabel);
      const joinId = `${action.path}/join`;
      nodes.push({ id: joinId, kind: "join", lines: [] });
      if (action.then.length === 0) addEdge(decisionId, joinId, "yes");
      else {
        const exits = processSequence(action.then, [decisionId], "yes", nodes, names, addEdge);
        for (const e of exits) addEdge(e, joinId);
      }
      if (action.else?.length) {
        const exits = processSequence(action.else, [decisionId], "no", nodes, names, addEdge);
        for (const e of exits) addEdge(e, joinId);
      } else {
        addEdge(decisionId, joinId, "no");
      }
      return [joinId];
    }

    case "parallel": {
      const forkId = action.path;
      nodes.push({ id: forkId, kind: "fork", lines: ["All at the same time"], source: action });
      for (const p of prevIds) addEdge(p, forkId, edgeLabel);
      const joinId = `${action.path}/join`;
      nodes.push({ id: joinId, kind: "join", lines: [] });
      action.branches.forEach((branch) => {
        if (branch.length === 0) return;
        const exits = processSequence(branch, [forkId], undefined, nodes, names, addEdge);
        for (const e of exits) addEdge(e, joinId);
      });
      return [joinId];
    }

    case "repeat": {
      const repeatId = action.path;
      let label: string;
      switch (action.mode) {
        case "count":
          label = `Repeat ${action.count}×`;
          break;
        case "while":
          label = `Repeat while ${conditionsJoined(action.whileConditions ?? [], names)}`;
          break;
        case "until":
          label = `Repeat until ${conditionsJoined(action.untilConditions ?? [], names)}`;
          break;
        case "for_each":
          label = "Repeat for each item";
          break;
      }
      nodes.push({ id: repeatId, kind: "decision", lines: wrap(label, 40), source: action });
      for (const p of prevIds) addEdge(p, repeatId, edgeLabel);
      if (action.sequence.length) {
        const exits = processSequence(action.sequence, [repeatId], "loop body", nodes, names, addEdge);
        for (const e of exits) addEdge(e, repeatId, "repeat");
      }
      return [repeatId];
    }

    case "condition": {
      const id = action.path;
      nodes.push({
        id,
        kind: "decision",
        lines: wrap(`Continue only if ${conditionToText(action.condition, names)}`, 40),
        source: action,
      });
      for (const p of prevIds) addEdge(p, id, edgeLabel);
      const stopId = `${action.path}/stop`;
      nodes.push({ id: stopId, kind: "terminal", lines: ["Stops here"] });
      addEdge(id, stopId, "otherwise");
      return [id];
    }

    case "stop": {
      const id = action.path;
      nodes.push({
        id,
        kind: "terminal",
        lines: wrap(`Stop${action.reason ? `: ${action.reason}` : ""}`),
        source: action,
      });
      for (const p of prevIds) addEdge(p, id, edgeLabel);
      return [];
    }

    default: {
      const id = action.path;
      const [line] = actionToLines(action, names, 0);
      nodes.push({ id, kind: "action", lines: wrap(line?.text ?? action.kind), source: action });
      for (const p of prevIds) addEdge(p, id, edgeLabel);
      return [id];
    }
  }
}

function processSequence(
  actions: ActionNode[],
  prevIds: string[],
  edgeLabel: string | undefined,
  nodes: FlowNode[],
  names: NameResolver,
  addEdge: AddEdge,
): string[] {
  let cur = prevIds;
  let label = edgeLabel;
  for (const action of actions) {
    cur = processAction(action, cur, label, nodes, names, addEdge);
    label = undefined;
    if (cur.length === 0) break;
  }
  return cur;
}

export function buildFlowchartGraph(ir: AutomationIR, names: NameResolver = noNames): FlowchartGraph {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let edgeCounter = 0;
  const addEdge: AddEdge = (source, target, label) => {
    edges.push({ id: `e${edgeCounter++}`, source, target, label: label ? wrap(label, EDGE_LABEL_WRAP_WIDTH) : undefined });
  };

  let triggerIds = ir.triggers.map((t) => {
    nodes.push({ id: t.path, kind: "trigger", lines: wrap(triggerToText(t, names)), source: t });
    return t.path;
  });
  if (triggerIds.length === 0) {
    nodes.push({ id: "start", kind: "trigger", lines: ["(no triggers)"] });
    triggerIds = ["start"];
  }

  let entryIds = triggerIds;
  if (ir.conditions.length) {
    const condId = "condition-gate";
    nodes.push({
      id: condId,
      kind: "condition",
      lines: wrap(`Only if: ${conditionsJoined(ir.conditions, names)}`, 34),
    });
    for (const t of triggerIds) addEdge(t, condId);
    const stopId = "condition-gate/stop";
    nodes.push({ id: stopId, kind: "terminal", lines: ["Doesn't run"] });
    addEdge(condId, stopId, "otherwise");
    entryIds = [condId];
  }

  const exitIds = processSequence(ir.actions, entryIds, undefined, nodes, names, addEdge);

  if (exitIds.length) {
    nodes.push({ id: "done", kind: "terminal", lines: ["Done"] });
    for (const e of exitIds) addEdge(e, "done");
  }

  return { nodes, edges };
}
