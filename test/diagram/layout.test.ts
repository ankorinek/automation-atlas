import { describe, expect, it } from "vitest";
import { buildFlowchartGraph } from "../../src/diagram/build-graph.js";
import { layoutFlowchart } from "../../src/diagram/layout.js";
import { normalizeAutomation } from "../../src/ir/normalize.js";

import freezer from "../fixtures/raw/freezer_temperature_warning.json";
import hrv from "../fixtures/raw/hrv_smart_ventilation_gate.json";

describe("layoutFlowchart", () => {
  it("assigns every node a non-negative position and positive size", async () => {
    const ir = normalizeAutomation({ entityId: "automation.freezer", raw: freezer, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const laidOut = await layoutFlowchart(graph);
    expect(laidOut.nodes.length).toBe(graph.nodes.length);
    for (const node of laidOut.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    }
  });

  it("routes every edge with at least a start and end point", async () => {
    const ir = normalizeAutomation({ entityId: "automation.freezer", raw: freezer, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const laidOut = await layoutFlowchart(graph);
    expect(laidOut.edges.length).toBe(graph.edges.length);
    for (const edge of laidOut.edges) {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("lays out a deeply-nested automation (HRV gate, 3-level if/else) without throwing", async () => {
    const ir = normalizeAutomation({ entityId: "automation.hrv", raw: hrv, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const laidOut = await layoutFlowchart(graph);
    expect(laidOut.width).toBeGreaterThan(0);
    expect(laidOut.height).toBeGreaterThan(0);
  });

  it("gives triggers (no incoming edges) a smaller x than nodes deep in the action chain", async () => {
    const ir = normalizeAutomation({ entityId: "automation.freezer", raw: freezer, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const laidOut = await layoutFlowchart(graph);
    const triggerXs = laidOut.nodes.filter((n) => n.kind === "trigger").map((n) => n.x);
    const doneNode = laidOut.nodes.find((n) => n.id === "done");
    expect(doneNode).toBeDefined();
    for (const tx of triggerXs) expect(tx).toBeLessThan(doneNode!.x);
  });
});
