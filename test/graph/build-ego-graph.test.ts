import { describe, expect, it } from "vitest";
import { buildEgoGraph } from "../../src/graph/build-ego-graph.js";
import { buildEntityIndex, type Atlas } from "../../src/ir/schema.js";
import { normalizeAutomation } from "../../src/ir/normalize.js";

function makeAtlas(configs: { entityId: string; raw: unknown }[]): Atlas {
  const automations = configs.map((c) => normalizeAutomation({ entityId: c.entityId, raw: c.raw, enabled: true }));
  return { automations, index: buildEntityIndex(automations) };
}

describe("buildEgoGraph — automation-centered", () => {
  const atlas = makeAtlas([
    {
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "binary_sensor.door", to: "on" }],
        actions: [{ action: "light.turn_on", target: { entity_id: "light.kitchen" } }],
      },
    },
  ]);

  it("includes the center automation and both referenced entities as neighbors", () => {
    const graph = buildEgoGraph("automation.a", atlas);
    expect(graph.nodes.find((n) => n.id === "automation.a")?.isCenter).toBe(true);
    expect(graph.nodes.some((n) => n.id === "binary_sensor.door")).toBe(true);
    expect(graph.nodes.some((n) => n.id === "light.kitchen")).toBe(true);
  });

  it("directs the trigger edge from the entity into the automation", () => {
    const graph = buildEgoGraph("automation.a", atlas);
    const edge = graph.edges.find((e) => e.source === "binary_sensor.door" && e.target === "automation.a");
    expect(edge).toBeDefined();
    expect(edge?.roles).toEqual(["trigger"]);
  });

  it("directs the action-write edge from the automation to the entity", () => {
    const graph = buildEgoGraph("automation.a", atlas);
    const edge = graph.edges.find((e) => e.source === "automation.a" && e.target === "light.kitchen");
    expect(edge).toBeDefined();
    expect(edge?.roles).toEqual(["action-write"]);
  });

  it("tags entity-kind vs automation-kind nodes correctly", () => {
    const graph = buildEgoGraph("automation.a", atlas);
    expect(graph.nodes.find((n) => n.id === "automation.a")?.kind).toBe("automation");
    expect(graph.nodes.find((n) => n.id === "light.kitchen")?.kind).toBe("entity");
  });
});

describe("buildEgoGraph — entity-centered", () => {
  const atlas = makeAtlas([
    {
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "binary_sensor.door", to: "on" }],
        actions: [],
      },
    },
    {
      entityId: "automation.b",
      raw: {
        alias: "B",
        triggers: [],
        actions: [{ action: "light.turn_on", target: { entity_id: "binary_sensor.door" } }],
      },
    },
  ]);

  it("finds all automations touching the entity via the reverse index", () => {
    const graph = buildEgoGraph("binary_sensor.door", atlas);
    expect(graph.nodes.find((n) => n.id === "binary_sensor.door")?.isCenter).toBe(true);
    expect(graph.nodes.some((n) => n.id === "automation.a")).toBe(true);
    expect(graph.nodes.some((n) => n.id === "automation.b")).toBe(true);
  });

  it("directs edges correctly regardless of which side is centered", () => {
    const graph = buildEgoGraph("binary_sensor.door", atlas);
    expect(graph.edges.find((e) => e.source === "binary_sensor.door" && e.target === "automation.a")).toBeDefined();
    expect(graph.edges.find((e) => e.source === "automation.b" && e.target === "binary_sensor.door")).toBeDefined();
  });
});

describe("buildEgoGraph — action-invoke between automations", () => {
  const atlas = makeAtlas([
    {
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "binary_sensor.door", to: "on" }],
        actions: [{ action: "automation.trigger", target: { entity_id: "automation.b" } }],
      },
    },
    {
      entityId: "automation.b",
      raw: { alias: "B", triggers: [], actions: [] },
    },
  ]);

  it("shows the invoke edge from A's own perspective (outgoing)", () => {
    const graph = buildEgoGraph("automation.a", atlas);
    const edge = graph.edges.find((e) => e.source === "automation.a" && e.target === "automation.b");
    expect(edge?.roles).toEqual(["action-invoke"]);
  });

  it("shows the inbound invoke edge when centered on B, via the reverse-index union (not just B's own refs)", () => {
    const graph = buildEgoGraph("automation.b", atlas);
    expect(graph.nodes.some((n) => n.id === "automation.a" && n.kind === "automation")).toBe(true);
    const edge = graph.edges.find((e) => e.source === "automation.a" && e.target === "automation.b");
    expect(edge).toBeDefined();
    expect(edge?.roles).toEqual(["action-invoke"]);
  });
});

describe("buildEgoGraph — edge merging and degenerate cases", () => {
  it("merges same-direction roles onto one edge rather than producing duplicates", () => {
    const atlas = makeAtlas([
      {
        entityId: "automation.a",
        raw: {
          alias: "A",
          triggers: [{ trigger: "state", entity_id: "sensor.temp", to: "on" }],
          conditions: [{ condition: "state", entity_id: "sensor.temp", state: "on" }],
          actions: [],
        },
      },
    ]);
    const graph = buildEgoGraph("automation.a", atlas);
    const inboundEdges = graph.edges.filter((e) => e.source === "sensor.temp" && e.target === "automation.a");
    expect(inboundEdges).toHaveLength(1);
    expect(inboundEdges[0]?.roles.sort()).toEqual(["condition-read", "trigger"]);
  });

  it("returns a single isolated node with no edges for an unreferenced entity", () => {
    const atlas = makeAtlas([{ entityId: "automation.a", raw: { alias: "A", triggers: [], actions: [] } }]);
    const graph = buildEgoGraph("sensor.nothing_references_this", atlas);
    expect(graph.nodes).toEqual([
      { id: "sensor.nothing_references_this", kind: "entity", lines: ["sensor.nothing_references_this"], isCenter: true },
    ]);
    expect(graph.edges).toEqual([]);
  });
});
