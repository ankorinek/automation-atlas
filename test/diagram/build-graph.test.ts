import { describe, expect, it } from "vitest";
import { buildFlowchartGraph } from "../../src/diagram/build-graph.js";
import { normalizeAutomation } from "../../src/ir/normalize.js";

import hrv from "../fixtures/raw/hrv_smart_ventilation_gate.json";
import furnace from "../fixtures/raw/furnace_fan_controller.json";
import freezer from "../fixtures/raw/freezer_temperature_warning.json";
import waterLeak from "../fixtures/raw/water_leak_detected_alert_both_phones.json";
import backDoor from "../fixtures/raw/back_door_airing_out_pause_and_resume_hvac.json";
import sunset from "../fixtures/raw/someone_arrives_home_after_sunset.json";
import christmasLightsOn from "../fixtures/raw/turn_on_outside_christmas_lights.json";

const realFixtures: Array<[string, unknown]> = [
  ["hrv_smart_ventilation_gate", hrv],
  ["furnace_fan_controller", furnace],
  ["freezer_temperature_warning", freezer],
  ["water_leak_detected_alert_both_phones", waterLeak],
  ["back_door_airing_out_pause_and_resume_hvac", backDoor],
  ["someone_arrives_home_after_sunset", sunset],
  ["turn_on_outside_christmas_lights", christmasLightsOn],
];

describe("buildFlowchartGraph — real fixtures", () => {
  it.each(realFixtures)("builds a connected graph for %s without throwing", (_name, raw) => {
    const ir = normalizeAutomation({ entityId: "automation.x", raw, enabled: true });
    const graph = buildFlowchartGraph(ir);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    // Every edge must reference node ids that actually exist — no dangling edges.
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it.each(realFixtures)("node ids for real IR nodes exactly equal their IR path (%s)", (_name, raw) => {
    const ir = normalizeAutomation({ entityId: "automation.x", raw, enabled: true });
    const graph = buildFlowchartGraph(ir);
    for (const trigger of ir.triggers) {
      expect(graph.nodes.some((n) => n.id === trigger.path)).toBe(true);
    }
  });

  it("freezer: choose with no `default` key gets an explicit 'Otherwise: (nothing)' edge, not a silent gap", () => {
    const ir = normalizeAutomation({ entityId: "automation.freezer", raw: freezer, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const decision = graph.nodes.find((n) => n.id === "action/0");
    expect(decision?.kind).toBe("decision");
    const joinId = "action/0/join";
    expect(graph.nodes.some((n) => n.id === joinId)).toBe(true);
    expect(
      graph.edges.some((e) => e.source === "action/0" && e.target === joinId && e.label?.join(" ") === "Otherwise: (nothing)"),
    ).toBe(true);
  });

  it("furnace: 6-branch choose with a real default produces 6 branch entries plus a default entry, all converging on one join", () => {
    const ir = normalizeAutomation({ entityId: "automation.furnace", raw: furnace, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const chooseNode = ir.actions.find((a) => a.kind === "choose");
    expect(chooseNode?.kind).toBe("choose");
    if (chooseNode?.kind !== "choose") return;
    const joinId = `${chooseNode.path}/join`;
    const incomingToJoin = graph.edges.filter((e) => e.target === joinId);
    // 6 branches + 1 default = 7 convergence points (each branch's own action chain reaches the join once).
    expect(incomingToJoin.length).toBe(7);
  });

  it("back-door airing-out: nested if/then inside a choose branch still produces a valid, fully-connected graph", () => {
    const ir = normalizeAutomation({ entityId: "automation.backdoor", raw: backDoor, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
    // The nested if (turn off HVAC only if actively heating/cooling) must appear as its own decision node.
    const nestedIf = ir.actions
      .flatMap((a) => (a.kind === "choose" ? a.branches.flatMap((b) => b.sequence) : []))
      .find((a) => a.kind === "if");
    expect(nestedIf?.kind).toBe("if");
    if (nestedIf) expect(graph.nodes.some((n) => n.id === nestedIf.path)).toBe(true);
  });

  it("keeps a click-to-inspect reference to the original IR node on trigger/decision/action nodes", () => {
    const ir = normalizeAutomation({ entityId: "automation.freezer", raw: freezer, enabled: true });
    const graph = buildFlowchartGraph(ir);
    const trigger = graph.nodes.find((n) => n.kind === "trigger");
    expect(trigger?.source).toBeDefined();
  });
});

describe("buildFlowchartGraph — edge cases", () => {
  it("automation with no triggers still produces a valid start node rather than crashing", () => {
    const ir = normalizeAutomation({ entityId: "automation.x", raw: { alias: "no triggers", actions: [] }, enabled: true });
    const graph = buildFlowchartGraph(ir);
    expect(graph.nodes.some((n) => n.id === "start")).toBe(true);
  });

  it("a `stop` action correctly terminates the chain — nothing downstream connects from it", () => {
    const ir = normalizeAutomation({
      entityId: "automation.x",
      raw: {
        alias: "stop test",
        triggers: [{ trigger: "state", entity_id: "sensor.x", to: "on" }],
        actions: [{ stop: "done early" }, { action: "light.turn_on", target: { entity_id: "light.y" } }],
      },
      enabled: true,
    });
    const graph = buildFlowchartGraph(ir);
    const stopNode = graph.nodes.find((n) => n.id === "action/0");
    expect(stopNode?.kind).toBe("terminal");
    // action/1 (the light.turn_on after the stop) is unreachable dead code — we still parse it, but
    // the graph builder must not draw an edge FROM the stop node TO it.
    expect(graph.edges.some((e) => e.source === "action/0")).toBe(false);
  });
});
