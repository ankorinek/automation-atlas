import { describe, expect, it } from "vitest";
import { buildFlowchartGraph } from "../../src/diagram/build-graph.js";
import { buildTraceOverlay, isEdgeTaken, isNodeExecuted } from "../../src/diagram/trace-overlay.js";
import { normalizeAutomation } from "../../src/ir/normalize.js";
import type { AutomationTraceDetail } from "../../src/ha/types.js";

import freezer from "../fixtures/raw/freezer_temperature_warning.json";
import realTrace from "../fixtures/raw/freezer_temperature_warning.trace.json";
import criticalTrace from "../fixtures/raw/freezer_temperature_warning.trace-critical-synthetic.json";

describe("trace overlay — real freezer trace (no branch taken)", () => {
  const ir = normalizeAutomation({ entityId: "automation.freezer_temperature_warning", raw: freezer, enabled: true });
  const graph = buildFlowchartGraph(ir);
  const overlay = buildTraceOverlay(ir, realTrace as AutomationTraceDetail);

  it("marks the fired trigger (upstairs freezer sensor) as executed", () => {
    expect(overlay.firedTriggerId).toBeDefined();
    const firedNode = graph.nodes.find((n) => n.id === overlay.firedTriggerId);
    expect(firedNode?.kind).toBe("trigger");
    expect(isNodeExecuted(firedNode!, overlay)).toBe(true);
  });

  it("marks the choose decision node itself as reached (its own path was logged)", () => {
    const decision = graph.nodes.find((n) => n.id === "action/0");
    expect(isNodeExecuted(decision!, overlay)).toBe(true);
  });

  it("does NOT mark any branch's action steps as executed — none of the 3 branches matched", () => {
    const actionNodes = graph.nodes.filter((n) => n.kind === "action");
    for (const node of actionNodes) {
      expect(isNodeExecuted(node, overlay)).toBe(false);
    }
  });

  it("does not falsely mark the 'Otherwise: (nothing)' edge or any branch edge as taken (conservative: no direct trace evidence)", () => {
    const branchEdges = graph.edges.filter((e) => e.source === "action/0");
    for (const edge of branchEdges) {
      expect(isEdgeTaken(edge, overlay)).toBe(false);
    }
  });

  it("marks only the fired trigger's edge as taken, not all 6 (they all converge on the same first action node)", () => {
    const triggerEdges = graph.edges.filter((e) => e.source.startsWith("trigger/"));
    expect(triggerEdges.length).toBe(6);
    const taken = triggerEdges.filter((e) => isEdgeTaken(e, overlay));
    expect(taken).toHaveLength(1);
    expect(taken[0]?.source).toBe(overlay.firedTriggerId);
  });

  it("does not mark other automations' or unrelated triggers as executed", () => {
    const otherTriggers = graph.nodes.filter((n) => n.kind === "trigger" && n.id !== overlay.firedTriggerId);
    expect(otherTriggers.length).toBeGreaterThan(0);
    for (const node of otherTriggers) expect(isNodeExecuted(node, overlay)).toBe(false);
  });
});

describe("trace overlay — synthetic critical trace (branch 0 taken)", () => {
  const ir = normalizeAutomation({ entityId: "automation.freezer_temperature_warning", raw: freezer, enabled: true });
  const graph = buildFlowchartGraph(ir);
  const overlay = buildTraceOverlay(ir, criticalTrace as AutomationTraceDetail);

  it("marks branch 0's action steps as executed", () => {
    const branch0Actions = graph.nodes.filter((n) => n.id.startsWith("action/0/choose/0/sequence/"));
    expect(branch0Actions.length).toBeGreaterThan(0);
    for (const node of branch0Actions) expect(isNodeExecuted(node, overlay)).toBe(true);
  });

  it("marks the edge from the decision into branch 0 as taken", () => {
    const takenEdge = graph.edges.find((e) => e.source === "action/0" && e.target === "action/0/choose/0/sequence/0");
    expect(takenEdge).toBeDefined();
    expect(isEdgeTaken(takenEdge!, overlay)).toBe(true);
  });

  it("does not mark branch 1 or branch 2's actions as executed", () => {
    const otherBranchNodes = graph.nodes.filter(
      (n) => n.id.startsWith("action/0/choose/1/") || n.id.startsWith("action/0/choose/2/"),
    );
    for (const node of otherBranchNodes) expect(isNodeExecuted(node, overlay)).toBe(false);
  });
});
