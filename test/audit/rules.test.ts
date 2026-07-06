import { describe, expect, it } from "vitest";
import { runAudit } from "../../src/audit/rules.js";
import { buildEntityIndex, type Atlas } from "../../src/ir/schema.js";
import { normalizeAutomation } from "../../src/ir/normalize.js";
import type { EntityRegistryEntry, HassEntity, HomeAssistant } from "../../src/ha/types.js";

function entity(id: string, overrides: Partial<HassEntity["attributes"]> = {}): HassEntity {
  return {
    entity_id: id,
    state: "on",
    attributes: { friendly_name: id, ...overrides },
    last_changed: "2026-01-01T00:00:00Z",
    last_updated: "2026-01-01T00:00:00Z",
  };
}

function makeHass(states: HassEntity[]): HomeAssistant {
  return {
    states: Object.fromEntries(states.map((e) => [e.entity_id, e])),
    async callApi() {
      throw new Error("not used in this test");
    },
    async callWS() {
      throw new Error("not used in this test");
    },
    connection: {
      async subscribeEvents() {
        return () => {};
      },
    },
  };
}

function registryEntry(entityId: string, overrides: Partial<EntityRegistryEntry> = {}): EntityRegistryEntry {
  return {
    id: entityId,
    entity_id: entityId,
    name: null,
    device_id: null,
    area_id: null,
    labels: [],
    disabled_by: null,
    hidden_by: null,
    platform: "test",
    ...overrides,
  };
}

function makeAtlas(automations: ReturnType<typeof normalizeAutomation>[]): Atlas {
  return { automations, index: buildEntityIndex(automations) };
}

describe("runAudit — configUnavailable", () => {
  it("flags an automation whose config could not be fetched as an error", () => {
    const ir = normalizeAutomation({ entityId: "automation.a", raw: null, enabled: true });
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a")]));
    expect(findings.some((f) => f.severity === "error" && f.automationEntityId === "automation.a")).toBe(true);
  });
});

describe("runAudit — parseWarnings", () => {
  it("surfaces each parse warning as its own warning-level finding", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: { alias: "A", triggers: [{ trigger: "unknown_platform" }], actions: [] },
      enabled: true,
    });
    expect(ir.parseWarnings.length).toBeGreaterThan(0);
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a")]));
    const warningFindings = findings.filter((f) => f.id.startsWith("parse-warning:"));
    expect(warningFindings).toHaveLength(ir.parseWarnings.length);
    expect(warningFindings.every((f) => f.severity === "warning")).toBe(true);
  });
});

describe("runAudit — zero triggers", () => {
  it("warns when an automation has no triggers", () => {
    const ir = normalizeAutomation({ entityId: "automation.a", raw: { alias: "A", triggers: [], actions: [] }, enabled: true });
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a")]));
    expect(findings.some((f) => f.id === "no-triggers:automation.a" && f.severity === "warning")).toBe(true);
  });

  it("does not flag a blueprint instance for zero triggers (opaque internals)", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: { alias: "A", use_blueprint: { path: "x.yaml", input: {} } },
      enabled: true,
    });
    expect(ir.isBlueprintInstance).toBe(true);
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a")]));
    expect(findings.some((f) => f.id === "no-triggers:automation.a")).toBe(false);
  });
});

describe("runAudit — orphaned entity refs", () => {
  it("errors when a referenced entity has no known state and no registry entry", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "sensor.gone", to: "on" }],
        actions: [],
      },
      enabled: true,
    });
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a")]));
    const finding = findings.find((f) => f.entityId === "sensor.gone");
    expect(finding?.severity).toBe("error");
  });

  it("does not flag an entity that exists only in the registry (not currently stateful)", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "sensor.offline", to: "on" }],
        actions: [],
      },
      enabled: true,
    });
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [registryEntry("sensor.offline")], makeHass([entity("automation.a")]));
    expect(findings.some((f) => f.entityId === "sensor.offline")).toBe(false);
  });

  it("demotes a heuristic (template-derived) orphaned ref to info severity", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [],
        actions: [{ action: "notify.mobile_app", data: { message: "{{ states('sensor.gone_templated') }}" } }],
      },
      enabled: true,
    });
    expect(ir.refs.some((r) => r.entityId === "sensor.gone_templated" && r.heuristic)).toBe(true);
    const atlas = makeAtlas([ir]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a")]));
    const finding = findings.find((f) => f.entityId === "sensor.gone_templated");
    expect(finding?.severity).toBe("info");
  });
});

describe("runAudit — disabled entity refs", () => {
  it("warns when an enabled automation references a disabled entity", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "sensor.disabled_thing", to: "on" }],
        actions: [],
      },
      enabled: true,
    });
    const atlas = makeAtlas([ir]);
    const registry = [registryEntry("sensor.disabled_thing", { disabled_by: "user" })];
    const findings = runAudit(atlas, registry, makeHass([entity("automation.a"), entity("sensor.disabled_thing")]));
    const finding = findings.find((f) => f.entityId === "sensor.disabled_thing");
    expect(finding?.severity).toBe("warning");
  });

  it("does not warn when the referencing automation is itself disabled", () => {
    const ir = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [{ trigger: "state", entity_id: "sensor.disabled_thing", to: "on" }],
        actions: [],
      },
      enabled: false,
    });
    const atlas = makeAtlas([ir]);
    const registry = [registryEntry("sensor.disabled_thing", { disabled_by: "user" })];
    const findings = runAudit(atlas, registry, makeHass([entity("automation.a"), entity("sensor.disabled_thing")]));
    expect(findings.some((f) => f.entityId === "sensor.disabled_thing")).toBe(false);
  });
});

describe("runAudit — disabled automation invoked", () => {
  it("warns when an enabled automation triggers a disabled one", () => {
    const a = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [],
        actions: [{ action: "automation.trigger", target: { entity_id: "automation.b" } }],
      },
      enabled: true,
    });
    const b = normalizeAutomation({ entityId: "automation.b", raw: { alias: "B", triggers: [], actions: [] }, enabled: false });
    const atlas = makeAtlas([a, b]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a"), entity("automation.b", { friendly_name: "B" })]));
    expect(findings.some((f) => f.id.startsWith("disabled-automation-invoked:") && f.severity === "warning")).toBe(true);
  });

  it("does not warn when the invoked automation is enabled", () => {
    const a = normalizeAutomation({
      entityId: "automation.a",
      raw: {
        alias: "A",
        triggers: [],
        actions: [{ action: "automation.trigger", target: { entity_id: "automation.b" } }],
      },
      enabled: true,
    });
    const b = normalizeAutomation({ entityId: "automation.b", raw: { alias: "B", triggers: [], actions: [] }, enabled: true });
    const atlas = makeAtlas([a, b]);
    const findings = runAudit(atlas, [], makeHass([entity("automation.a"), entity("automation.b")]));
    expect(findings.some((f) => f.id.startsWith("disabled-automation-invoked:"))).toBe(false);
  });
});
