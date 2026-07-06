# Verified HA API contracts (Phase 0)

Verified 2026-07-05 against `home-assistant/core` (dev branch) and `home-assistant/frontend` (dev branch) source, plus live automation configs pulled from my own instance. Re-verify against the target HA release if it's much older than "current dev" — these are wire contracts, not guaranteed stable across major versions.

## panel_custom config (developer docs)

```yaml
panel_custom:
  - name: automation-atlas-panel   # must equal the custom element tag name
    url_path: automation-atlas
    sidebar_title: Automation Atlas
    sidebar_icon: mdi:sitemap
    module_url: /hacsfiles/automation-atlas/automation-atlas.js
    config: {}                     # optional, arrives as this.panel.config
```

Custom element receives these properties (set directly, not via attributes):
- `hass` — full Home Assistant object; reassigned on every state change, so Lit's `updated()` fires on new state.
- `narrow` — boolean, responsive breakpoint.
- `panel` — panel metadata; user's `config:` block lives at `panel.config`.
- `route` — current route info.

`embed_iframe` is **not confirmed** in the docs fetch — treat as legacy/unverified, don't rely on it.

## Automation config fetch — two paths exist

1. **REST (file-storage automations):**
   ```ts
   hass.callApi<AutomationConfig>("GET", `config/automation/config/${id}`)
   ```
   Confirmed in `frontend/src/data/automation.ts` as `fetchAutomationFileConfig`. This is what the plan assumed. 404s for YAML-included automations without a UI-storage id.

2. **WebSocket (state-based, entity_id keyed):**
   ```ts
   hass.callWS<{ config: AutomationConfig }>({ type: "automation/config", entity_id })
   ```
   Confirmed as `getAutomationStateConfig` in the same file. Keyed by `entity_id`, not by storage id — **worth trying as a fallback for YAML-mode automations** before giving up and rendering the degraded card. Untested whether it actually succeeds for id-less YAML automations; verify empirically in Phase 1 against a real YAML-mode automation if one exists (my 22 automations all appear to be UI/storage-managed with numeric ids, so this path is currently unexercised).

`AutomationConfig = ManualAutomationConfig | BlueprintAutomationConfig` — confirms blueprint instances are a distinct shape; check for a `use_blueprint` key at the top of the config before assuming `triggers/conditions/actions` are present.

## Registries (websocket)

All confirmed present in `home-assistant/core/homeassistant/components/config/`:

| Domain | list | get | update | remove |
|---|---|---|---|---|
| entity | `config/entity_registry/list`, `list_for_display` | `config/entity_registry/get` (entity_id), `get_entries` (entity_ids) | `config/entity_registry/update` | `config/entity_registry/remove` |
| device | `config/device_registry/list` | — | `config/device_registry/update` | `remove_config_entry` only |
| area | `config/area_registry/list` | — | `update`, `create`, `delete`, `reorder` | |
| label | `config/label_registry/list` | — | `update`, `create` | `delete` |

`entity_registry/update` accepts: `aliases`, `area_id`, `categories`, `device_class`, `icon`, `labels`, `name`, `new_entity_id`, `disabled_by`, `hidden_by`, `options_domain`, `options`. **We never call `update` — read-only tool, this list is here only so nobody mistakes read fields for write fields.**

## Traces (websocket)

Confirmed in `home-assistant/core/homeassistant/components/trace/websocket_api.py`:

- `trace/list` — required: `type`, `domain` (optional `item_id` to scope to one automation/script).
- `trace/get` — required: `type`, `domain`, `item_id`, `run_id`.
- `trace/contexts` — required: `type` only.
- Debug/breakpoint commands (`trace/debug/*`) exist but are irrelevant to a read-only viewer — do not use them.

**Trace path format confirmed empirically** (live trace of `automation.freezer_temperature_warning`): paths look like `action/0/choose/2/conditions/1/entity_id/0`. This exactly mirrors nesting depth into the raw config (`action[0].choose[2].conditions[1]`), which is what the IR path convention in the plan (section 4.1) needs to match for trace-overlay to be a dictionary lookup. Build IR node `path` strings using zero-indexed array segments joined by `/`, matching the raw config's own array nesting — not a separately-invented scheme.

**`trace/list` / `trace/get`'s `item_id` (Phase 2):** frontend's `ha-automation-trace.ts` calls `loadTraces(hass, "automation", this.automationId)` where `automationId` is set by the parent editor route — the same identifier used for `config/automation/config/{id}` (i.e. the automation config's storage `id`, **not** the entity_id). Not independently re-verified by calling the live websocket command this session (only traced through frontend source) — if traces come back empty for an automation you know has run recently, this is the first thing to re-check. Use `ir.id`, matching what `fetchAutomationConfig` already uses for the REST path.

**`choose` trace semantics confirmed empirically** (same freezer trace, full detail this time): `action/0/choose/N` logs the branch's overall AND result (true/false) at the CHOOSE node's own path scope, not a distinct node — our graph only has one decision node per `choose` (at the choose action's own path), so branch-taken detection doesn't need to interpret this field at all. The robust signal is simpler: **a branch was taken iff any of its `sequence`/`then`/`else`/`default` action paths appear in `action_trace`** — those only get logged when actually executed. This sidesteps ambiguity entirely; see `src/diagram/trace-overlay.ts`.

## Events

- `automation_reloaded` (constant `EVENT_AUTOMATION_RELOADED`, value `"automation_reloaded"`) — fired by `automation.reload` service. Confirmed in `homeassistant/components/automation/__init__.py`. Subscribe via `hass.connection.subscribeEvents(cb, "automation_reloaded")` and refetch on receipt.
- `entity_registry_updated` — **not independently re-verified this session**; it's a long-standing HA event name, treat as high-confidence but not re-checked against current source. If registry-driven UI (friendly names, area assignment) seems stale after a rename, verify this event name first.

## Real config shapes seen live (feed these into Phase 1 fixtures)

Pulled directly from my own instance via the HA MCP connector (not fixtures pasted in — pulled live, see automations below). All 22 of my automations are storage-managed (numeric `id`), so the YAML-mode-without-id case remains theoretical for this instance specifically.

Confirmed real-world syntax variety already present in his configs — all of these MUST have fixtures:
- **Modern plural-free singular keys** (`triggers`/`conditions`/`actions` as the top-level dict keys, `trigger:`/`condition:` as the per-item discriminator key, not `platform:`/`service:`). E.g. `{"trigger": "numeric_state", ...}`, `{"trigger": "time_pattern", "minutes": "/5", "id": "periodic"}`.
- **Modern `action:` key** inside action steps, not legacy `service:` — e.g. `{"action": "switch.turn_off", "target": {...}}`. None of his automations use legacy `service:` — still write a fixture for it since the parser must accept both.
- **`if`/`then`/`else` nesting**, including deeply nested (`hrv_smart_ventilation_gate` is a 3-level nested if/else — great stress-test fixture).
- **`choose` with `condition: trigger` branches keyed by trigger `id`** (string or list of strings) — very common pattern in his setup (freezer, water leak, back-door-airing). This is distinct from state/numeric_state conditions inside choose branches.
- **`condition: and` / `or` / `not`** compound conditions, including a condition that itself has an `attribute:` key (state condition scoped to `hvac_action` attribute, not entity state).
- **`target: {device_id: [...]}` instead of `entity_id`** (`someone_arrives_home_after_sunset`) — must resolve via device registry to entity list for the dependency graph.
- **Templates embedded in `data:` fields** (not just triggers/conditions) — e.g. notify `message` built from a Jinja ternary referencing `trigger.id` and `states(...)`. The plan's template-ref-extraction regex needs to also scan action `data` values, not just trigger/condition template kind nodes.
- **`automation.trigger` as a service call target** — an automation re-triggering other automations by entity_id. Must classify as a write (or a distinct "invokes" role) against the target automation entity, since it's a cross-automation dependency edge the graph should show.
- **`mode: restart` and `mode: parallel`** both in active use — mode-note prose must handle both.
- **`for:` durations as `{"minutes": 5}` dict shorthand**, not always `"00:05:00"` string form — humanizer must handle both duration shapes.

Fixtures to pull into `test/fixtures/` in Phase 1: `hrv_smart_ventilation_gate` (nested if/else + numeric/state/or/and mix), `furnace_fan_controller` (large choose with duplicate-looking branches — good test for "don't collapse visually distinct branches"), `freezer_temperature_warning` (choose-by-trigger-id + trace overlay source, since a real trace already exists for it), `water_leak_detected_alert_both_phones` (mode: parallel, symmetric wet/dry branches), `back_door_airing_out_pause_and_resume_hvac` (cross-automation `automation.trigger` calls, input_select templating), `someone_arrives_home_after_sunset` (device_id target, delay action, sun condition).
