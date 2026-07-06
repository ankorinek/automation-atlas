import { describe, expect, it } from "vitest";
import { normalizeAutomation } from "../../src/ir/normalize.js";
import { resolveTargetRefs, type Registries } from "../../src/ir/resolve-targets.js";

function normalize(raw: unknown) {
  return normalizeAutomation({ entityId: "automation.test", raw, enabled: true });
}

describe("extractRefs", () => {
  it("tags trigger, condition-read, and action-write refs correctly", () => {
    const ir = normalize({
      alias: "roles",
      triggers: [{ trigger: "state", entity_id: "binary_sensor.door", to: "on" }],
      conditions: [{ condition: "state", entity_id: "input_boolean.override", state: "off" }],
      actions: [{ action: "switch.turn_on", target: { entity_id: "switch.hrv" } }],
    });
    const byRole = Object.fromEntries(ir.refs.map((r) => [r.entityId, r.role]));
    expect(byRole["binary_sensor.door"]).toBe("trigger");
    expect(byRole["input_boolean.override"]).toBe("condition-read");
    expect(byRole["switch.hrv"]).toBe("action-write");
  });

  it("classifies automation.trigger as action-invoke, not action-write", () => {
    const ir = normalize({
      alias: "invoke",
      actions: [{ action: "automation.trigger", target: { entity_id: "automation.other" } }],
    });
    expect(ir.refs.find((r) => r.entityId === "automation.other")?.role).toBe("action-invoke");
  });

  it("extracts heuristic template refs from action data (not just triggers/conditions)", () => {
    const ir = normalize({
      alias: "template-in-data",
      actions: [
        {
          action: "notify.mobile_app_x",
          data: { message: "{{ states('sensor.downstairs_freezer_temperature') }}°C" },
        },
      ],
    });
    const templateRef = ir.refs.find((r) => r.entityId === "sensor.downstairs_freezer_temperature");
    expect(templateRef?.role).toBe("template");
    expect(templateRef?.heuristic).toBe(true);
  });

  it("collects condition-read refs nested inside choose branches", () => {
    const ir = normalize({
      alias: "nested-choose",
      actions: [
        {
          choose: [
            {
              conditions: [{ condition: "state", entity_id: "sensor.nested", state: "on" }],
              sequence: [{ action: "a.b", target: { entity_id: "a.b" } }],
            },
          ],
        },
      ],
    });
    expect(ir.refs.find((r) => r.entityId === "sensor.nested")?.role).toBe("condition-read");
  });

  it("dedupes identical (entityId, role, path) triples", () => {
    const ir = normalize({
      alias: "dupe",
      triggers: [{ trigger: "state", entity_id: ["sensor.a", "sensor.a"], to: "on" }],
    });
    expect(ir.refs.filter((r) => r.entityId === "sensor.a")).toHaveLength(1);
  });
});

describe("resolveTargetRefs", () => {
  it("resolves device_id targets to entities via the device registry map", () => {
    const ir = normalize({
      alias: "device-resolve",
      actions: [{ action: "light.turn_on", target: { device_id: ["dev1"] } }],
    });
    const registries: Registries = {
      deviceToEntities: new Map([["dev1", ["light.a", "light.b"]]]),
      areaToEntities: new Map(),
      labelToEntities: new Map(),
    };
    const resolved = resolveTargetRefs(ir, registries);
    expect(resolved.map((r) => r.entityId).sort()).toEqual(["light.a", "light.b"]);
    expect(resolved[0]?.resolvedVia?.kind).toBe("device");
  });

  it("resolves area_id targets to entities via the area registry map", () => {
    const ir = normalize({
      alias: "area-resolve",
      actions: [{ action: "light.turn_off", target: { area_id: ["basement"] } }],
    });
    const registries: Registries = {
      deviceToEntities: new Map(),
      areaToEntities: new Map([["basement", ["light.basement_1"]]]),
      labelToEntities: new Map(),
    };
    const resolved = resolveTargetRefs(ir, registries);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.entityId).toBe("light.basement_1");
    expect(resolved[0]?.role).toBe("action-write");
  });
});
