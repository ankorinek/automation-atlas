// Dev-only harness: mounts the real panel against a mock `hass` object built
// from fixtures pulled live from a real HA instance (anonymized), so the UI
// can be eyeballed in a browser without a real HA backend. Not part of the
// shipped bundle (vite.config.ts build.lib ignores this — only used by `vite` dev server).
import "../src/panel.js";
import type { HassEntity, HomeAssistant } from "../src/ha/types.js";

import hrv from "../test/fixtures/raw/hrv_smart_ventilation_gate.json";
import furnace from "../test/fixtures/raw/furnace_fan_controller.json";
import freezer from "../test/fixtures/raw/freezer_temperature_warning.json";
import waterLeak from "../test/fixtures/raw/water_leak_detected_alert_both_phones.json";
import backDoor from "../test/fixtures/raw/back_door_airing_out_pause_and_resume_hvac.json";
import sunset from "../test/fixtures/raw/someone_arrives_home_after_sunset.json";
import christmasLightsOn from "../test/fixtures/raw/turn_on_outside_christmas_lights.json";
import blueprint from "../test/fixtures/raw/blueprint_instance.json";
import freezerTraceReal from "../test/fixtures/raw/freezer_temperature_warning.trace.json";
import freezerTraceCritical from "../test/fixtures/raw/freezer_temperature_warning.trace-critical-synthetic.json";

// ?trace=critical picks the synthetic "branch actually executed" trace instead of the real
// "nothing matched" one, for exercising the executed-path highlighting visually.
const activeTrace = new URLSearchParams(location.search).get("trace") === "critical" ? freezerTraceCritical : freezerTraceReal;

const configs: Record<string, unknown> = {
  hrv_1: hrv,
  furnace_1: furnace,
  freezer_1: freezer,
  leak_1: waterLeak,
  backdoor_1: backDoor,
  sunset_1: sunset,
  blueprint_1: blueprint,
  christmas_1: christmasLightsOn,
};

const friendlyNames: Record<string, string> = {
  "climate.main_floor": "Main Floor thermostat",
  "binary_sensor.myggbett_door_window_sensor_door_2": "Dining Room Back Door sensor",
  "sensor.alpstuga_air_quality_monitor_carbon_dioxide": "Living Room CO2",
  "switch.hrv": "HRV switch",
  "input_boolean.ventilation_manual_override": "Ventilation Manual Override",
  "sensor.downstairs_freezer_temperature": "Downstairs Freezer Temperature",
  "sensor.upstairs_freezer_temperature": "Upstairs Freezer Temperature",
  "input_boolean.freezer_alert_active": "Freezer Alert Active",
  "binary_sensor.klippbok_water_leak_sensor_water_leak": "Dishwasher Water Leak Sensor",
  "binary_sensor.klippbok_water_leak_sensor_water_leak_2": "Furnace Room Water Leak Sensor",
  "person.resident_one": "Resident One",
  "person.resident_two": "Resident Two",
  "sun.sun": "the sun",
  "automation.hrv_smart_ventilation_gate": "HRV Smart Ventilation Gate",
  "automation.furnace_fan_controller": "Furnace Fan Controller",
};

function makeEntity(entityId: string, id: string, opts: Partial<HassEntity> = {}): HassEntity {
  return {
    entity_id: entityId,
    state: "on",
    attributes: { friendly_name: entityId, id, last_triggered: opts.attributes?.last_triggered as string | undefined },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    ...opts,
  };
}

const now = Date.now();
const states: Record<string, HassEntity> = {
  "automation.hrv_smart_ventilation_gate": makeEntity("automation.hrv_smart_ventilation_gate", "hrv_1", {
    attributes: { id: "hrv_1", last_triggered: new Date(now - 3 * 60_000).toISOString() },
  }),
  "automation.furnace_fan_controller": makeEntity("automation.furnace_fan_controller", "furnace_1", {
    attributes: { id: "furnace_1", last_triggered: new Date(now - 2 * 3600_000).toISOString() },
  }),
  "automation.freezer_temperature_warning": makeEntity("automation.freezer_temperature_warning", "freezer_1", {
    attributes: { id: "freezer_1", last_triggered: new Date(now - 40 * 3600_000).toISOString() },
  }),
  "automation.water_leak_detected": makeEntity("automation.water_leak_detected", "leak_1", {
    attributes: { id: "leak_1" },
  }),
  "automation.back_door_airing_out": makeEntity("automation.back_door_airing_out", "backdoor_1", {
    attributes: { id: "backdoor_1", last_triggered: new Date(now - 20 * 86400_000).toISOString() },
  }),
  "automation.someone_arrives_home_after_sunset": makeEntity(
    "automation.someone_arrives_home_after_sunset",
    "sunset_1",
    { state: "off", attributes: { id: "sunset_1" } },
  ),
  "automation.motion_light_blueprint": makeEntity("automation.motion_light_blueprint", "blueprint_1", {
    attributes: { id: "blueprint_1" },
  }),
  "automation.yaml_mode_no_id": makeEntity("automation.yaml_mode_no_id", "", { attributes: {} }),
  "automation.turn_on_outside_christmas_lights": makeEntity(
    "automation.turn_on_outside_christmas_lights",
    "christmas_1",
    { state: "unavailable", attributes: { id: "christmas_1" } },
  ),
};

const hass: HomeAssistant = {
  states,
  async callApi(_method, path) {
    const match = /config\/automation\/config\/(.+)/.exec(path);
    const id = match?.[1];
    if (id && configs[id]) return configs[id] as never;
    throw new Error("404 Not Found");
  },
  async callWS(msg) {
    if (msg.type === "config/entity_registry/list") {
      return [
        {
          entity_id: "light.entryway",
          name: "Entryway Light",
          device_id: "78d0ad9f19d614228cb7385208e07a02",
          area_id: null,
          labels: [],
        },
        {
          entity_id: "light.hallway",
          name: "Hallway Light",
          device_id: "f9d9bd0742bae99966f27502adf51169",
          area_id: null,
          labels: [],
        },
        {
          entity_id: "light.porch",
          name: "Porch Light",
          device_id: "f21e318e15bfdec3f379a97f3024f2ad",
          area_id: null,
          labels: [],
        },
      ] as never;
    }
    if (msg.type === "config/device_registry/list") {
      return [
        { id: "78d0ad9f19d614228cb7385208e07a02", name: "Entryway Light Switch", area_id: null, labels: [] },
        { id: "f9d9bd0742bae99966f27502adf51169", name: "Hallway Light Switch", area_id: null, labels: [] },
        { id: "f21e318e15bfdec3f379a97f3024f2ad", name: "Porch Light Switch", area_id: null, labels: [] },
      ] as never;
    }
    if (msg.type === "config/area_registry/list") return [] as never;
    if (msg.type === "config/label_registry/list") return [] as never;
    // ir.id comes from the fetched config's own "id" field (the real automation id), not our
    // mock entity attribute id — freezer_temperature_warning.json's id is 1783109819956.
    if (msg.type === "trace/list" && msg.item_id === "1783109819956") {
      return [{ run_id: activeTrace.run_id, timestamp: { start: "2026-07-05T18:39:01.179340+00:00" }, state: "stopped" }] as never;
    }
    if (msg.type === "trace/get" && msg.item_id === "1783109819956") {
      return activeTrace as never;
    }
    if (msg.type === "trace/list" || msg.type === "trace/get") return [] as never;
    throw new Error(`unhandled ws command ${String(msg.type)}`);
  },
  connection: {
    async subscribeEvents() {
      return () => {};
    },
  },
};

// Names come from the entity registry in production; the harness bypasses that
// and patches friendly_name directly onto each mock state instead, then wraps
// buildNameLookup's fallback (hass.states[id].attributes.friendly_name).
for (const [id, name] of Object.entries(friendlyNames)) {
  if (!states[id]) states[id] = makeEntity(id, "");
  states[id]!.attributes.friendly_name = name;
}

const panel = document.createElement("automation-atlas-panel");
panel.hass = hass;
panel.narrow = false;
document.body.appendChild(panel);
