import { describe, expect, it } from "vitest";
import { normalizeAutomation } from "../src/ir/normalize.js";
import { resolveTargetRefs, type Registries } from "../src/ir/resolve-targets.js";
import { composeAutomationProse } from "../src/prose/compose.js";

import hrv from "./fixtures/raw/hrv_smart_ventilation_gate.json";
import furnace from "./fixtures/raw/furnace_fan_controller.json";
import freezer from "./fixtures/raw/freezer_temperature_warning.json";
import waterLeak from "./fixtures/raw/water_leak_detected_alert_both_phones.json";
import backDoor from "./fixtures/raw/back_door_airing_out_pause_and_resume_hvac.json";
import sunset from "./fixtures/raw/someone_arrives_home_after_sunset.json";
import christmasLightsOn from "./fixtures/raw/turn_on_outside_christmas_lights.json";
import legacy from "./fixtures/raw/legacy_service_syntax.json";
import blueprint from "./fixtures/raw/blueprint_instance.json";

const realFixtures: Array<[string, unknown]> = [
  ["hrv_smart_ventilation_gate", hrv],
  ["furnace_fan_controller", furnace],
  ["freezer_temperature_warning", freezer],
  ["water_leak_detected_alert_both_phones", waterLeak],
  ["back_door_airing_out_pause_and_resume_hvac", backDoor],
  ["someone_arrives_home_after_sunset", sunset],
  ["turn_on_outside_christmas_lights", christmasLightsOn],
];

describe("real fixtures pulled live from a real HA instance (anonymized)", () => {
  it.each(realFixtures)("normalizes %s without parse warnings", (_name, raw) => {
    const ir = normalizeAutomation({ entityId: "automation.fixture", raw, enabled: true });
    expect(ir.parseWarnings).toEqual([]);
    expect(ir.configUnavailable).toBeUndefined();
  });

  it.each(realFixtures)("generates prose for %s without throwing, with non-empty output", (_name, raw) => {
    const ir = normalizeAutomation({ entityId: "automation.fixture", raw, enabled: true });
    const prose = composeAutomationProse(ir);
    expect(prose.triggerLines.length).toBe(ir.triggers.length);
    expect(prose.actionLines.length).toBeGreaterThan(0);
  });

  it("HRV gate: extracts the deeply nested if/else without dropping branches", () => {
    const ir = normalizeAutomation({ entityId: "automation.hrv", raw: hrv, enabled: true });
    expect(ir.actions).toHaveLength(1);
    expect(ir.actions[0]?.kind).toBe("if");
    // 3 levels of nested if/else should surface as refs to every sensor checked in the innermost or/and block.
    const refIds = new Set(ir.refs.map((r) => r.entityId));
    expect(refIds.has("sensor.o_1pst_pm2_5")).toBe(true);
    expect(refIds.has("sensor.main_floor_current_humidity")).toBe(true);
  });

  it("furnace controller: large choose block keeps every branch distinct", () => {
    const ir = normalizeAutomation({ entityId: "automation.furnace", raw: furnace, enabled: true });
    const choose = ir.actions.find((a) => a.kind === "choose");
    expect(choose?.kind).toBe("choose");
    if (choose?.kind === "choose") expect(choose.branches).toHaveLength(6);
  });

  it("freezer warning: choose-by-trigger-id conditions round-trip and trace path convention matches", () => {
    const ir = normalizeAutomation({ entityId: "automation.freezer", raw: freezer, enabled: true });
    const choose = ir.actions[0];
    expect(choose?.kind).toBe("choose");
    if (choose?.kind === "choose") {
      expect(choose.branches[0]?.conditions[0]?.kind).toBe("trigger");
      // Confirms IR path convention mirrors the real trace path seen live:
      // action/0/choose/2/conditions/1/... — see src/ha/contracts.md.
      expect(choose.path).toBe("action/0");
    }
    // Templated notify messages reference the freezer sensors even though they're inside `data`, not a trigger/condition.
    const templateRefs = ir.refs.filter((r) => r.role === "template");
    expect(templateRefs.some((r) => r.entityId === "sensor.downstairs_freezer_temperature")).toBe(true);
  });

  it("water leak: mode parallel and symmetric wet/dry branches all parse", () => {
    const ir = normalizeAutomation({ entityId: "automation.leak", raw: waterLeak, enabled: true });
    expect(ir.mode).toBe("parallel");
    const choose = ir.actions[0];
    expect(choose?.kind).toBe("choose");
    if (choose?.kind === "choose") expect(choose.branches).toHaveLength(4);
  });

  it("back door airing-out: cross-automation automation.trigger calls become action-invoke refs", () => {
    const ir = normalizeAutomation({ entityId: "automation.backdoor", raw: backDoor, enabled: true });
    const invokeRefs = ir.refs.filter((r) => r.role === "action-invoke");
    expect(invokeRefs.map((r) => r.entityId).sort()).toEqual([
      "automation.furnace_fan_controller",
      "automation.hrv_smart_ventilation_gate",
    ]);
  });

  it("sunset arrival: device_id target and dict-shorthand delay both parse", () => {
    const ir = normalizeAutomation({ entityId: "automation.sunset", raw: sunset, enabled: true });
    const lightOn = ir.actions[0];
    expect(lightOn?.kind).toBe("service");
    if (lightOn?.kind === "service") expect(lightOn.target?.deviceId).toHaveLength(3);
    const delay = ir.actions[1];
    expect(delay?.kind).toBe("delay");
  });

  it("sunset arrival: prose names the actual lights behind a device_id target, not just a count", () => {
    const ir = normalizeAutomation({ entityId: "automation.sunset", raw: sunset, enabled: true });
    const registries: Registries = {
      deviceToEntities: new Map([
        ["78d0ad9f19d614228cb7385208e07a02", ["light.entryway"]],
        ["f9d9bd0742bae99966f27502adf51169", ["light.hallway"]],
        ["f21e318e15bfdec3f379a97f3024f2ad", ["light.porch"]],
      ]),
      areaToEntities: new Map(),
      labelToEntities: new Map(),
    };
    ir.refs = [...ir.refs, ...resolveTargetRefs(ir, registries)];
    const names = (id: string) =>
      ({ "light.entryway": "Entryway Light", "light.hallway": "Hallway Light", "light.porch": "Porch Light" })[id];
    const prose = composeAutomationProse(ir, names);
    expect(prose.actionLines[0]?.text).toBe("Turn on the Entryway Light, the Hallway Light, and the Porch Light");
    // Without registries (the old behavior), it must still degrade gracefully to a count rather than crash.
    const proseUnresolved = composeAutomationProse(normalizeAutomation({ entityId: "automation.sunset", raw: sunset, enabled: true }));
    expect(proseUnresolved.actionLines[0]?.text).toBe("Turn on 3 device(s)");
  });

  it("christmas lights: parses HA's device-action shorthand ({type, device_id, entity_id, domain}) as a real kind, not unknown", () => {
    const ir = normalizeAutomation({ entityId: "automation.christmas", raw: christmasLightsOn, enabled: true });
    expect(ir.parseWarnings).toEqual([]);
    expect(ir.actions).toHaveLength(3);
    for (const action of ir.actions) expect(action.kind).toBe("device");
  });

  it("christmas lights: on this instance the device is actually gone, so prose says so instead of showing a vague count", () => {
    // No registries passed — matches reality: ha_get_device confirmed this device_id no longer exists.
    const ir = normalizeAutomation({ entityId: "automation.christmas", raw: christmasLightsOn, enabled: true });
    const prose = composeAutomationProse(ir);
    expect(prose.actionLines[0]?.text).toBe(
      "Turn on `switch` on device `5ba0c6abbc722f683700394329576112` — entity reference could not be resolved (the device may no longer exist)",
    );
  });

  it("christmas lights: when the registry id DOES resolve, prose names the actual entity", () => {
    const ir = normalizeAutomation({ entityId: "automation.christmas", raw: christmasLightsOn, enabled: true });
    const registries: Registries = {
      deviceToEntities: new Map(),
      areaToEntities: new Map(),
      labelToEntities: new Map(),
      registryIdToEntity: new Map([
        ["d4f33cef7c800d7711188d44cf9122a8", "switch.christmas_lights_string_1"],
        ["2e2937429f53894ec36f8ba22559fe06", "switch.christmas_lights_string_2"],
        ["4a278aa8b0bec387a5425fbab29ff7e6", "switch.christmas_lights_string_3"],
      ]),
    };
    ir.refs = [...ir.refs, ...resolveTargetRefs(ir, registries)];
    const names = (id: string) =>
      ({
        "switch.christmas_lights_string_1": "Christmas Lights String 1",
        "switch.christmas_lights_string_2": "Christmas Lights String 2",
        "switch.christmas_lights_string_3": "Christmas Lights String 3",
      })[id];
    const prose = composeAutomationProse(ir, names);
    expect(prose.actionLines[0]?.text).toBe("Turn on the Christmas Lights String 1");
    expect(prose.actionLines[1]?.text).toBe("Turn on the Christmas Lights String 2");
    expect(prose.actionLines[2]?.text).toBe("Turn on the Christmas Lights String 3");
  });
});

describe("synthetic fixtures for shapes not present live", () => {
  it("parses legacy trigger/condition/action singular keys with service: syntax", () => {
    const ir = normalizeAutomation({ entityId: "automation.legacy", raw: legacy, enabled: true });
    expect(ir.parseWarnings).toEqual([]);
    expect(ir.actions[0]?.kind).toBe("service");
    if (ir.actions[0]?.kind === "service") expect(ir.actions[0].service).toBe("switch.turn_on");
  });

  it("degrades a blueprint instance to inputs-only without crashing", () => {
    const ir = normalizeAutomation({ entityId: "automation.blueprint", raw: blueprint, enabled: true });
    expect(ir.isBlueprintInstance).toBe(true);
    expect(ir.blueprintInputs?.motion_entity).toBe("binary_sensor.hallway_motion");
    const prose = composeAutomationProse(ir);
    expect(prose.actionLines).toEqual([]);
  });
});
