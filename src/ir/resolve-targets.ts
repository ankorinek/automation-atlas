import type { ActionNode, AutomationIR, EntityRef, EntityRefRole } from "./schema.js";

export interface Registries {
  deviceToEntities: Map<string, string[]>;
  areaToEntities: Map<string, string[]>;
  labelToEntities: Map<string, string[]>;
  deviceNames?: Map<string, string>;
  areaNames?: Map<string, string>;
  labelNames?: Map<string, string>;
  /** Entity registry's stable `id` (UUID) -> entity_id — needed to resolve device-action `entity_id` fields, which hold this id, not a literal entity_id. */
  registryIdToEntity?: Map<string, string>;
}

const INVOKE_SERVICES = new Set(["automation.trigger"]);

function walk(action: ActionNode, registries: Registries, refs: EntityRef[]): void {
  switch (action.kind) {
    case "service": {
      const role: EntityRefRole = INVOKE_SERVICES.has(action.service) ? "action-invoke" : "action-write";
      for (const deviceId of action.target?.deviceId ?? []) {
        for (const entityId of registries.deviceToEntities.get(deviceId) ?? []) {
          refs.push({
            entityId,
            role,
            path: action.path,
            resolvedVia: { kind: "device", id: deviceId, name: registries.deviceNames?.get(deviceId) },
          });
        }
      }
      for (const areaId of action.target?.areaId ?? []) {
        for (const entityId of registries.areaToEntities.get(areaId) ?? []) {
          refs.push({
            entityId,
            role,
            path: action.path,
            resolvedVia: { kind: "area", id: areaId, name: registries.areaNames?.get(areaId) },
          });
        }
      }
      for (const labelId of action.target?.labelId ?? []) {
        for (const entityId of registries.labelToEntities.get(labelId) ?? []) {
          refs.push({
            entityId,
            role,
            path: action.path,
            resolvedVia: { kind: "label", id: labelId, name: registries.labelNames?.get(labelId) },
          });
        }
      }
      break;
    }
    case "choose":
      for (const branch of action.branches) for (const a of branch.sequence) walk(a, registries, refs);
      for (const a of action.default ?? []) walk(a, registries, refs);
      break;
    case "if":
      for (const a of action.then) walk(a, registries, refs);
      for (const a of action.else ?? []) walk(a, registries, refs);
      break;
    case "parallel":
      for (const branch of action.branches) for (const a of branch) walk(a, registries, refs);
      break;
    case "repeat":
      for (const a of action.sequence) walk(a, registries, refs);
      break;
    case "device": {
      const entityId = action.entityRegistryId && registries.registryIdToEntity?.get(action.entityRegistryId);
      if (entityId) {
        refs.push({
          entityId,
          role: "action-write",
          path: action.path,
          resolvedVia: { kind: "registry-id", id: action.entityRegistryId! },
        });
      }
      break;
    }
    default:
      break;
  }
}

/** Additional refs produced by resolving device_id/area_id/label_id targets to entities. Merge into ir.refs. */
export function resolveTargetRefs(ir: AutomationIR, registries: Registries): EntityRef[] {
  const refs: EntityRef[] = [];
  for (const action of ir.actions) walk(action, registries, refs);
  return refs;
}
