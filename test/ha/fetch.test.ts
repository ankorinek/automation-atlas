import { describe, expect, it } from "vitest";
import { fetchAtlas } from "../../src/ha/fetch.js";
import type { HassEntity, HomeAssistant } from "../../src/ha/types.js";

function entity(id: string, overrides: Partial<HassEntity["attributes"]> = {}): HassEntity {
  return {
    entity_id: id,
    state: "on",
    attributes: { friendly_name: id, ...overrides },
    last_changed: "2026-01-01T00:00:00Z",
    last_updated: "2026-01-01T00:00:00Z",
  };
}

function makeHass(opts: {
  states: HassEntity[];
  configs?: Record<string, unknown>;
  wsConfigs?: Record<string, unknown>;
}): HomeAssistant {
  const states = Object.fromEntries(opts.states.map((e) => [e.entity_id, e]));
  return {
    states,
    async callApi(_method, path) {
      const match = /config\/automation\/config\/(.+)/.exec(path);
      const id = match?.[1];
      if (id && opts.configs?.[id]) return opts.configs[id] as never;
      throw new Error("404");
    },
    async callWS(msg) {
      if (msg.type === "config/entity_registry/list") return [] as never;
      if (msg.type === "config/device_registry/list") return [] as never;
      if (msg.type === "config/area_registry/list") return [] as never;
      if (msg.type === "config/label_registry/list") return [] as never;
      if (msg.type === "automation/config") {
        const cfg = opts.wsConfigs?.[msg.entity_id as string];
        if (cfg) return { config: cfg } as never;
        throw new Error("not found");
      }
      throw new Error(`unexpected ws command ${String(msg.type)}`);
    },
    connection: {
      async subscribeEvents() {
        return () => {};
      },
    },
  };
}

describe("fetchAtlas", () => {
  it("fetches config via REST using the storage id from entity attributes", async () => {
    const hass = makeHass({
      states: [entity("automation.a", { id: "123" })],
      configs: { "123": { alias: "A", triggers: [], conditions: [], actions: [] } },
    });
    const { atlas } = await fetchAtlas(hass);
    expect(atlas.automations).toHaveLength(1);
    expect(atlas.automations[0]?.alias).toBe("A");
    expect(atlas.automations[0]?.configUnavailable).toBeUndefined();
  });

  it("falls back to the websocket automation/config command when REST 404s", async () => {
    const hass = makeHass({
      states: [entity("automation.b", { id: "999" })],
      configs: {},
      wsConfigs: { "automation.b": { alias: "B (yaml-mode)", triggers: [], conditions: [], actions: [] } },
    });
    const { atlas } = await fetchAtlas(hass);
    expect(atlas.automations[0]?.alias).toBe("B (yaml-mode)");
  });

  it("degrades to a configUnavailable IR when neither REST nor websocket can read the config", async () => {
    const hass = makeHass({ states: [entity("automation.c", { id: "no-such-id" })] });
    const { atlas } = await fetchAtlas(hass);
    expect(atlas.automations[0]?.configUnavailable).toBe(true);
  });

  it("only enumerates automation.* entities, ignoring everything else", async () => {
    const hass = makeHass({
      states: [entity("automation.a", { id: "1" }), entity("light.kitchen")],
      configs: { "1": { alias: "A", triggers: [], conditions: [], actions: [] } },
    });
    const { atlas } = await fetchAtlas(hass);
    expect(atlas.automations).toHaveLength(1);
    expect(atlas.automations[0]?.entityId).toBe("automation.a");
  });

  it("builds an entity index keyed by entity_id from the automations' refs", async () => {
    const hass = makeHass({
      states: [entity("automation.a", { id: "1" })],
      configs: {
        "1": {
          alias: "A",
          triggers: [{ trigger: "state", entity_id: "binary_sensor.door", to: "on" }],
          actions: [],
        },
      },
    });
    const { atlas } = await fetchAtlas(hass);
    expect(atlas.index.byEntity.get("binary_sensor.door")).toEqual([
      { automationId: "automation.a", role: "trigger", path: "trigger/0" },
    ]);
  });
});
