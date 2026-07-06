import { describe, expect, it } from "vitest";
import { normalizeAutomation } from "../../src/ir/normalize.js";

function normalize(raw: unknown) {
  return normalizeAutomation({ entityId: "automation.test", raw, enabled: true });
}

describe("normalizeAutomation — shorthand handling", () => {
  it("accepts modern plural triggers/conditions/actions keys", () => {
    const ir = normalize({
      alias: "modern",
      triggers: [{ trigger: "state", entity_id: "sensor.x", to: "on" }],
      conditions: [{ condition: "state", entity_id: "input_boolean.y", state: "off" }],
      actions: [{ action: "switch.turn_on", target: { entity_id: "switch.z" } }],
    });
    expect(ir.triggers).toHaveLength(1);
    expect(ir.conditions).toHaveLength(1);
    expect(ir.actions).toHaveLength(1);
    expect(ir.parseWarnings).toEqual([]);
  });

  it("accepts legacy singular trigger/condition/action keys and platform: discriminator", () => {
    const ir = normalize({
      alias: "legacy",
      trigger: { platform: "state", entity_id: "sensor.x", to: "on" },
      condition: { condition: "state", entity_id: "input_boolean.y", state: "off" },
      action: { service: "switch.turn_on", entity_id: "switch.z" },
    });
    expect(ir.triggers).toHaveLength(1);
    expect(ir.triggers[0]?.kind).toBe("state");
    expect(ir.actions[0]?.kind).toBe("service");
    if (ir.actions[0]?.kind === "service") {
      expect(ir.actions[0].service).toBe("switch.turn_on");
      expect(ir.actions[0].target?.entityId).toEqual(["switch.z"]);
    }
  });

  it("normalizes entity_id given as a bare string to an array", () => {
    const ir = normalize({
      alias: "single-entity",
      triggers: [{ trigger: "state", entity_id: "sensor.solo", to: "on" }],
    });
    const t = ir.triggers[0];
    expect(t?.kind).toBe("state");
    if (t?.kind === "state") expect(t.entityId).toEqual(["sensor.solo"]);
  });

  it("treats a bare string condition as a template condition (shorthand)", () => {
    const ir = normalize({
      alias: "bare-template",
      conditions: ["{{ states('sensor.x') == 'on' }}"],
      actions: [],
    });
    expect(ir.conditions[0]?.kind).toBe("template");
    if (ir.conditions[0]?.kind === "template") {
      expect(ir.conditions[0].entityIds).toEqual(["sensor.x"]);
    }
  });

  it("resolves and/or/not compound conditions recursively", () => {
    const ir = normalize({
      alias: "compound",
      conditions: [
        {
          condition: "and",
          conditions: [
            { condition: "state", entity_id: "a.x", state: "on" },
            { condition: "or", conditions: [{ condition: "state", entity_id: "b.y", state: "off" }] },
          ],
        },
      ],
    });
    expect(ir.conditions[0]?.kind).toBe("and");
    if (ir.conditions[0]?.kind === "and") {
      expect(ir.conditions[0].children).toHaveLength(2);
      expect(ir.conditions[0].children[1]?.kind).toBe("or");
    }
  });

  it("normalizes choose/if/parallel/repeat action structures", () => {
    const ir = normalize({
      alias: "control-flow",
      actions: [
        {
          choose: [
            { conditions: [{ condition: "state", entity_id: "a.x", state: "on" }], sequence: [{ action: "a.b", target: {} }] },
          ],
          default: [{ action: "a.c", target: {} }],
        },
        {
          if: [{ condition: "state", entity_id: "a.x", state: "on" }],
          then: [{ action: "a.d", target: {} }],
          else: [{ action: "a.e", target: {} }],
        },
        { parallel: [{ sequence: [{ action: "a.f", target: {} }] }, { action: "a.g", target: {} }] },
        { repeat: { count: 3, sequence: [{ action: "a.h", target: {} }] } },
      ],
    });
    expect(ir.actions[0]?.kind).toBe("choose");
    expect(ir.actions[1]?.kind).toBe("if");
    expect(ir.actions[2]?.kind).toBe("parallel");
    if (ir.actions[2]?.kind === "parallel") expect(ir.actions[2].branches).toHaveLength(2);
    expect(ir.actions[3]?.kind).toBe("repeat");
    if (ir.actions[3]?.kind === "repeat") {
      expect(ir.actions[3].mode).toBe("count");
      expect(ir.actions[3].count).toBe(3);
    }
  });

  it("normalizes repeat for_each and wait_for_trigger", () => {
    const ir = normalize({
      alias: "repeat-foreach",
      actions: [
        { repeat: { for_each: ["a", "b"], sequence: [{ action: "a.b", target: {} }] } },
        { wait_for_trigger: [{ trigger: "state", entity_id: "sensor.x", to: "on" }], timeout: { seconds: 30 } },
      ],
    });
    expect(ir.actions[0]?.kind).toBe("repeat");
    if (ir.actions[0]?.kind === "repeat") expect(ir.actions[0].mode).toBe("for_each");
    expect(ir.actions[1]?.kind).toBe("wait_for_trigger");
  });

  it("treats use_blueprint as a distinct blueprint-instance shape", () => {
    const ir = normalize({
      alias: "bp",
      use_blueprint: { path: "motion_light.yaml", input: { motion_entity: "binary_sensor.x" } },
    });
    expect(ir.isBlueprintInstance).toBe(true);
    expect(ir.blueprintPath).toBe("motion_light.yaml");
    expect(ir.blueprintInputs).toEqual({ motion_entity: "binary_sensor.x" });
    expect(ir.parseWarnings.length).toBeGreaterThan(0);
  });

  it("never crashes on an unrecognized trigger/condition/action kind — always has an unknown escape hatch", () => {
    const ir = normalize({
      alias: "exotic",
      triggers: [{ trigger: "some_future_trigger_type", foo: "bar" }],
      conditions: [{ condition: "some_future_condition", foo: "bar" }],
      actions: [{ some_future_action_shape: true }],
    });
    expect(ir.triggers[0]?.kind).toBe("unknown");
    expect(ir.conditions[0]?.kind).toBe("unknown");
    expect(ir.actions[0]?.kind).toBe("unknown");
    expect(ir.parseWarnings.length).toBe(3);
  });

  it("resolves device_id targets on service actions without crashing (registry resolution happens later)", () => {
    const ir = normalize({
      alias: "device-target",
      actions: [{ action: "light.turn_on", target: { device_id: ["dev1", "dev2"] } }],
    });
    expect(ir.actions[0]?.kind).toBe("service");
    if (ir.actions[0]?.kind === "service") {
      expect(ir.actions[0].target?.deviceId).toEqual(["dev1", "dev2"]);
    }
  });
});
