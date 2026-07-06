import type { Target } from "../ir/schema.js";
import { extractTemplateEntityIds } from "../ir/template-refs.js";
import { entityListPhrase, titleCaseFromSlug, truncate, type NameResolver } from "./humanize.js";

/** Quotes a literal value, or — if it's a Jinja template — describes it by the entities it reads instead of dumping raw Jinja. */
function fieldPhrase(raw: unknown, names: NameResolver, maxLen = 80): string {
  if (typeof raw !== "string" || (!raw.includes("{{") && !raw.includes("{%"))) {
    return `"${truncate(String(raw ?? "?"), maxLen)}"`;
  }
  const entityIds = extractTemplateEntityIds(raw);
  return entityIds.length ? `a dynamic value mentioning ${entityListPhrase(entityIds, names, "and")}` : "a dynamic value";
}

/**
 * `resolvedEntities` are the actual entities a device_id/area_id/label_id target expanded to
 * (via resolveTargetRefs + the HA registries) — when present, name them instead of showing a bare count.
 */
function targetPhrase(target: Target | undefined, names: NameResolver, resolvedEntities: string[] = []): string {
  if (!target) return "(no target)";
  const pieces: string[] = [];
  if (target.entityId?.length) pieces.push(entityListPhrase(target.entityId, names, "and"));
  if (target.deviceId?.length) {
    pieces.push(
      resolvedEntities.length
        ? entityListPhrase(resolvedEntities, names, "and")
        : `${target.deviceId.length} device(s)`,
    );
  }
  if (target.areaId?.length) {
    pieces.push(
      resolvedEntities.length ? entityListPhrase(resolvedEntities, names, "and") : `area(s) ${target.areaId.join(", ")}`,
    );
  }
  if (target.labelId?.length) {
    pieces.push(
      resolvedEntities.length
        ? entityListPhrase(resolvedEntities, names, "and")
        : `label(s) ${target.labelId.join(", ")}`,
    );
  }
  return pieces.join(", ") || "(no target)";
}

type VerbFn = (
  target: Target | undefined,
  data: Record<string, unknown> | undefined,
  names: NameResolver,
  resolvedEntities: string[],
) => string;

const VERBS: Record<string, VerbFn> = {
  "switch.turn_on": (t, _d, n, r) => `turn on ${targetPhrase(t, n, r)}`,
  "switch.turn_off": (t, _d, n, r) => `turn off ${targetPhrase(t, n, r)}`,
  "switch.toggle": (t, _d, n, r) => `toggle ${targetPhrase(t, n, r)}`,
  "light.turn_on": (t, d, n, r) => {
    const extras: string[] = [];
    if (d?.brightness !== undefined) extras.push(`brightness ${d.brightness}`);
    if (d?.color_temp_kelvin !== undefined) extras.push(`${d.color_temp_kelvin}K`);
    if (d?.rgb_color !== undefined) extras.push(`color ${JSON.stringify(d.rgb_color)}`);
    return `turn on ${targetPhrase(t, n, r)}${extras.length ? ` (${extras.join(", ")})` : ""}`;
  },
  "light.turn_off": (t, _d, n, r) => `turn off ${targetPhrase(t, n, r)}`,
  "climate.turn_off": (t, _d, n, r) => `turn off ${targetPhrase(t, n, r)}`,
  "climate.turn_on": (t, _d, n, r) => `turn on ${targetPhrase(t, n, r)}`,
  "climate.set_temperature": (t, d, n, r) => `set ${targetPhrase(t, n, r)} to ${String(d?.temperature ?? "?")}°`,
  "climate.set_hvac_mode": (t, d, n, r) => `set ${targetPhrase(t, n, r)} to ${fieldPhrase(d?.hvac_mode, n)} mode`,
  "climate.set_fan_mode": (t, d, n, r) => `set ${targetPhrase(t, n, r)}'s fan mode to ${fieldPhrase(d?.fan_mode, n)}`,
  "input_boolean.turn_on": (t, _d, n, r) => `turn on ${targetPhrase(t, n, r)}`,
  "input_boolean.turn_off": (t, _d, n, r) => `turn off ${targetPhrase(t, n, r)}`,
  "input_select.select_option": (t, d, n, r) => `set ${targetPhrase(t, n, r)} to ${fieldPhrase(d?.option, n)}`,
  "input_number.set_value": (t, d, n, r) => `set ${targetPhrase(t, n, r)} to ${String(d?.value ?? "?")}`,
  "cover.open_cover": (t, _d, n, r) => `open ${targetPhrase(t, n, r)}`,
  "cover.close_cover": (t, _d, n, r) => `close ${targetPhrase(t, n, r)}`,
  "lock.lock": (t, _d, n, r) => `lock ${targetPhrase(t, n, r)}`,
  "lock.unlock": (t, _d, n, r) => `unlock ${targetPhrase(t, n, r)}`,
  "fan.turn_on": (t, _d, n, r) => `turn on ${targetPhrase(t, n, r)}`,
  "fan.turn_off": (t, _d, n, r) => `turn off ${targetPhrase(t, n, r)}`,
  "media_player.turn_on": (t, _d, n, r) => `turn on ${targetPhrase(t, n, r)}`,
  "media_player.turn_off": (t, _d, n, r) => `turn off ${targetPhrase(t, n, r)}`,
  "media_player.media_play": (t, _d, n, r) => `play media on ${targetPhrase(t, n, r)}`,
  "media_player.media_pause": (t, _d, n, r) => `pause ${targetPhrase(t, n, r)}`,
  "scene.turn_on": (t, _d, n, r) => `activate scene ${targetPhrase(t, n, r)}`,
  "automation.trigger": (t, _d, n, r) => `manually re-run ${targetPhrase(t, n, r)}`,
  "automation.turn_on": (t, _d, n, r) => `enable ${targetPhrase(t, n, r)}`,
  "automation.turn_off": (t, _d, n, r) => `disable ${targetPhrase(t, n, r)}`,
};

function notifyPhrase(service: string, data: Record<string, unknown> | undefined, names: NameResolver): string {
  const target = service.startsWith("notify.mobile_app_")
    ? titleCaseFromSlug(service.replace("notify.mobile_app_", ""))
    : service.startsWith("notify.")
      ? titleCaseFromSlug(service.replace("notify.", ""))
      : "a notify target";
  if (!data?.title && !data?.message) return `send a phone notification to ${target}`;
  const title = typeof data?.title === "string" ? fieldPhrase(data.title, names) : undefined;
  const message = typeof data?.message === "string" ? fieldPhrase(data.message, names) : undefined;
  const parts = [title, message].filter(Boolean);
  return `send a phone notification to ${target}: ${parts.join(" — ")}`;
}

export function serviceVerbPhrase(
  service: string,
  target: Target | undefined,
  data: Record<string, unknown> | undefined,
  names: NameResolver,
  resolvedEntities: string[] = [],
): string {
  if (service.startsWith("notify.")) return notifyPhrase(service, data, names);
  const verb = VERBS[service];
  if (verb) return verb(target, data, names, resolvedEntities);
  return `call \`${service}\` on ${targetPhrase(target, names, resolvedEntities)}`;
}
