import { normalizeAutomation } from "../ir/normalize.js";
import { resolveTargetRefs, type Registries } from "../ir/resolve-targets.js";
import { buildEntityIndex, type Atlas, type AutomationIR } from "../ir/schema.js";
import type {
  AreaRegistryEntry,
  AutomationTraceDetail,
  AutomationTraceSummary,
  DeviceRegistryEntry,
  EntityRegistryEntry,
  HassEntity,
  HomeAssistant,
  LabelRegistryEntry,
} from "./types.js";

export function listAutomationEntities(hass: HomeAssistant): HassEntity[] {
  return Object.values(hass.states).filter((e) => e.entity_id.startsWith("automation."));
}

/**
 * Two read paths exist (see contracts.md): REST by storage id (works for
 * UI-managed automations), falling back to the websocket command keyed by
 * entity_id (worth trying for YAML-mode automations without a storage id —
 * unverified whether it actually succeeds for those, hence the fallback
 * chain rather than picking one).
 */
async function fetchAutomationConfig(hass: HomeAssistant, entity: HassEntity): Promise<unknown | undefined> {
  const storageId = entity.attributes.id;
  if (storageId) {
    try {
      return await hass.callApi<unknown>("GET", `config/automation/config/${storageId}`);
    } catch {
      // fall through to the websocket path
    }
  }
  try {
    const result = await hass.callWS<{ config: unknown }>({
      type: "automation/config",
      entity_id: entity.entity_id,
    });
    return result.config;
  } catch {
    return undefined;
  }
}

export interface RegistrySnapshot {
  entities: EntityRegistryEntry[];
  registries: Registries;
}

export async function fetchRegistries(hass: HomeAssistant): Promise<RegistrySnapshot> {
  const [entities, devices, areas, labels] = await Promise.all([
    hass.callWS<EntityRegistryEntry[]>({ type: "config/entity_registry/list" }),
    hass.callWS<DeviceRegistryEntry[]>({ type: "config/device_registry/list" }),
    hass.callWS<AreaRegistryEntry[]>({ type: "config/area_registry/list" }),
    hass.callWS<LabelRegistryEntry[]>({ type: "config/label_registry/list" }),
  ]);

  const deviceAreaById = new Map(devices.map((d) => [d.id, d.area_id]));
  const deviceNames = new Map(devices.map((d) => [d.id, d.name_by_user || d.name || d.id]));
  const areaNames = new Map(areas.map((a) => [a.area_id, a.name]));
  const labelNames = new Map(labels.map((l) => [l.label_id, l.name]));
  const registryIdToEntity = new Map(entities.map((e) => [e.id, e.entity_id]));

  const deviceToEntities = new Map<string, string[]>();
  const areaToEntities = new Map<string, string[]>();
  const labelToEntities = new Map<string, string[]>();

  for (const entity of entities) {
    if (entity.device_id) {
      const list = deviceToEntities.get(entity.device_id) ?? [];
      list.push(entity.entity_id);
      deviceToEntities.set(entity.device_id, list);
    }
    // An entity without its own area assignment inherits its device's area.
    const areaId = entity.area_id ?? (entity.device_id ? (deviceAreaById.get(entity.device_id) ?? null) : null);
    if (areaId) {
      const list = areaToEntities.get(areaId) ?? [];
      list.push(entity.entity_id);
      areaToEntities.set(areaId, list);
    }
    for (const labelId of entity.labels) {
      const list = labelToEntities.get(labelId) ?? [];
      list.push(entity.entity_id);
      labelToEntities.set(labelId, list);
    }
  }

  return {
    entities,
    registries: { deviceToEntities, areaToEntities, labelToEntities, deviceNames, areaNames, labelNames, registryIdToEntity },
  };
}

export function buildNameLookup(
  hass: HomeAssistant,
  entityRegistry: EntityRegistryEntry[],
): (entityId: string) => string | undefined {
  const registryNames = new Map(
    entityRegistry.map((e) => [e.entity_id, e.name || e.original_name || undefined] as const),
  );
  return (entityId: string) => registryNames.get(entityId) ?? hass.states[entityId]?.attributes.friendly_name;
}

export interface FetchAtlasResult {
  atlas: Atlas;
  entityRegistry: EntityRegistryEntry[];
}

/** Fetch-all: enumerate automations, fetch each config, resolve device/area/label targets, build the dependency index. */
export async function fetchAtlas(hass: HomeAssistant): Promise<FetchAtlasResult> {
  const automationEntities = listAutomationEntities(hass);
  const { entities: entityRegistry, registries } = await fetchRegistries(hass);

  const automations: AutomationIR[] = await Promise.all(
    automationEntities.map(async (entity) => {
      const raw = await fetchAutomationConfig(hass, entity);
      const ir = normalizeAutomation({
        entityId: entity.entity_id,
        raw: raw ?? null,
        enabled: entity.state !== "off",
        lastTriggered: entity.attributes.last_triggered,
      });
      if (raw !== undefined) ir.refs = [...ir.refs, ...resolveTargetRefs(ir, registries)];
      return ir;
    }),
  );

  return { atlas: { automations, index: buildEntityIndex(automations) }, entityRegistry };
}

/** Refetch on `automation_reloaded`; caller owns the store/re-render. No polling. */
export function subscribeAutomationReloaded(hass: HomeAssistant, onReload: () => void): Promise<() => void> {
  return hass.connection.subscribeEvents(() => onReload(), "automation_reloaded");
}

/**
 * `storageId` is the automation config's `id` (ir.id), not its entity_id — see contracts.md's
 * trace/list note. Returns [] rather than throwing when an automation has no traces yet.
 */
export async function fetchAutomationTraceSummaries(
  hass: HomeAssistant,
  storageId: string,
): Promise<AutomationTraceSummary[]> {
  try {
    return await hass.callWS<AutomationTraceSummary[]>({ type: "trace/list", domain: "automation", item_id: storageId });
  } catch {
    return [];
  }
}

export function fetchAutomationTraceDetail(
  hass: HomeAssistant,
  storageId: string,
  runId: string,
): Promise<AutomationTraceDetail> {
  return hass.callWS<AutomationTraceDetail>({ type: "trace/get", domain: "automation", item_id: storageId, run_id: runId });
}

/** The most recent trace's full detail, or undefined if the automation has never run. */
export async function fetchLatestAutomationTrace(
  hass: HomeAssistant,
  storageId: string,
): Promise<AutomationTraceDetail | undefined> {
  const summaries = await fetchAutomationTraceSummaries(hass, storageId);
  if (!summaries.length) return undefined;
  const latest = [...summaries].sort((a, b) => (b.timestamp?.start ?? "").localeCompare(a.timestamp?.start ?? ""))[0];
  if (!latest) return undefined;
  return fetchAutomationTraceDetail(hass, storageId, latest.run_id);
}
