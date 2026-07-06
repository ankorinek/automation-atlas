import { describe, expect, it } from "vitest";
import { humanizeDuration, humanizeClockTime, entityPhrase } from "../../src/prose/humanize.js";
import { triggerToText } from "../../src/prose/triggers.js";
import { conditionToText } from "../../src/prose/conditions.js";
import { actionToLines } from "../../src/prose/actions.js";
import type { NameResolver } from "../../src/prose/humanize.js";

const names: NameResolver = (id) =>
  ({
    "binary_sensor.back_door": "Dining Room Back Door sensor",
    "sensor.co2": "Living Room CO2",
  })[id];

describe("humanize", () => {
  it("humanizes HH:MM:SS duration strings", () => {
    expect(humanizeDuration("00:05:00")).toBe("5 minutes");
    expect(humanizeDuration("01:30:00")).toBe("1 hour 30 minutes");
  });

  it("humanizes dict-shorthand durations", () => {
    expect(humanizeDuration({ minutes: 5 })).toBe("5 minutes");
    expect(humanizeDuration({ hours: 1, minutes: 30 })).toBe("1 hour 30 minutes");
  });

  it("humanizes clock times by dropping seconds", () => {
    expect(humanizeClockTime("06:30:00")).toBe("06:30");
  });

  it("falls back to backtick entity_id when no friendly name is known", () => {
    expect(entityPhrase("sensor.unknown", names)).toBe("`sensor.unknown`");
    expect(entityPhrase("sensor.co2", names)).toBe("the Living Room CO2");
  });
});

describe("triggerToText", () => {
  it("renders a state trigger with a for-duration", () => {
    const text = triggerToText(
      { kind: "state", path: "trigger/0", entityId: ["binary_sensor.back_door"], to: "on", for: { minutes: 5 } },
      names,
    );
    expect(text).toBe('When the Dining Room Back Door sensor changes to "on" for 5 minutes');
  });

  it("renders a numeric_state trigger crossing above a threshold", () => {
    const text = triggerToText(
      { kind: "numeric_state", path: "trigger/0", entityId: ["sensor.co2"], above: 1000 },
      names,
    );
    expect(text).toBe("When the Living Room CO2 rises above 1000");
  });

  it("renders a time_pattern trigger", () => {
    const text = triggerToText({ kind: "time_pattern", path: "trigger/0", minutes: "/5" }, names);
    expect(text).toBe("On a schedule, every 5 minutes");
  });

  it("never throws on an unknown trigger kind", () => {
    expect(triggerToText({ kind: "unknown", path: "trigger/0", raw: {} }, names)).toContain("show raw");
  });
});

describe("conditionToText", () => {
  it("renders a state condition", () => {
    expect(conditionToText({ kind: "state", entityId: ["binary_sensor.back_door"], state: "off" }, names)).toBe(
      'the Dining Room Back Door sensor is "off"',
    );
  });

  it("renders and/or/not compound conditions", () => {
    const cond = {
      kind: "and" as const,
      children: [
        { kind: "state" as const, entityId: ["binary_sensor.back_door"], state: "off" },
        { kind: "not" as const, children: [{ kind: "state" as const, entityId: ["sensor.co2"], state: "high" }] },
      ],
    };
    const text = conditionToText(cond, names);
    expect(text).toContain("AND");
    expect(text).toContain("NOT");
  });
});

describe("actionToLines", () => {
  it("renders a service call with a known verb", () => {
    const lines = actionToLines(
      { kind: "service", path: "action/0", service: "switch.turn_on", target: { entityId: ["switch.hrv"] } },
      names,
      0,
    );
    expect(lines).toEqual([{ indent: 0, text: "Turn on `switch.hrv`" }]);
  });

  it("renders choose with If/Otherwise-if/Otherwise branches", () => {
    const lines = actionToLines(
      {
        kind: "choose",
        path: "action/0",
        branches: [
          {
            conditions: [{ kind: "state", entityId: ["binary_sensor.back_door"], state: "on" }],
            sequence: [{ kind: "service", path: "action/0/choose/0/sequence/0", service: "switch.turn_off", target: { entityId: ["switch.hrv"] } }],
          },
        ],
        default: [{ kind: "service", path: "action/0/choose/default/0", service: "switch.turn_on", target: { entityId: ["switch.hrv"] } }],
      },
      names,
      0,
    );
    expect(lines[0]?.text).toBe("Then, depending on the situation:");
    expect(lines[1]?.text).toContain("If the Dining Room Back Door sensor is \"on\":");
    expect(lines.some((l) => l.text === "Otherwise:")).toBe(true);
  });

  it("renders an unknown action as an escape hatch, never throwing", () => {
    const lines = actionToLines({ kind: "unknown", path: "action/0", raw: {} }, names, 0);
    expect(lines[0]?.text).toContain("show raw");
  });

  it("renders a delay action in plain language", () => {
    const lines = actionToLines({ kind: "delay", path: "action/0", duration: { minutes: 5 } }, names, 0);
    expect(lines[0]?.text).toBe("Wait 5 minutes");
  });

  it("renders notify service calls with target device name and truncated message", () => {
    const lines = actionToLines(
      {
        kind: "service",
        path: "action/0",
        service: "notify.mobile_app_jordans_iphone",
        data: { title: "Alert", message: "x".repeat(100) },
      },
      names,
      0,
    );
    expect(lines[0]?.text).toContain("Jordans Iphone");
    expect(lines[0]?.text.length).toBeLessThan(150);
  });
});
