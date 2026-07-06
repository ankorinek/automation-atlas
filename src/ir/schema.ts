// Pure IR schema — zero DOM dependencies. Everything else renders this.

export type Duration =
  | string
  | { hours?: number; minutes?: number; seconds?: number; milliseconds?: number };

export type EntityRefRole =
  | "trigger"
  | "condition-read"
  | "action-read"
  | "action-write"
  | "action-invoke" // e.g. automation.trigger targeting another automation
  | "template";

export interface EntityRef {
  entityId: string;
  role: EntityRefRole;
  path: string; // mirrors HA trace path convention for action refs; trigger/N, condition/N otherwise
  /** Set when this ref came from resolving a device_id/area_id/label_id target, or a device-action's registry id, rather than a literal entity_id. */
  resolvedVia?: { kind: "device" | "area" | "label" | "registry-id"; id: string; name?: string };
  /** Set when this ref was extracted heuristically from a Jinja template rather than a literal field. */
  heuristic?: boolean;
}

export type TriggerNode =
  | {
      kind: "state";
      path: string;
      id?: string;
      entityId: string[];
      from?: string | string[] | null;
      to?: string | string[] | null;
      for?: Duration;
      attribute?: string;
    }
  | {
      kind: "numeric_state";
      path: string;
      id?: string;
      entityId: string[];
      above?: number;
      below?: number;
      for?: Duration;
      attribute?: string;
      valueTemplate?: string;
    }
  | { kind: "time"; path: string; id?: string; at: string[] }
  | {
      kind: "time_pattern";
      path: string;
      id?: string;
      hours?: string;
      minutes?: string;
      seconds?: string;
    }
  | { kind: "sun"; path: string; id?: string; event: "sunrise" | "sunset"; offset?: string }
  | { kind: "template"; path: string; id?: string; template: string; entityIds: string[] }
  | { kind: "event"; path: string; id?: string; eventType: string | string[]; eventData?: object }
  | { kind: "zone"; path: string; id?: string; entityId: string[]; zone: string[]; event?: "enter" | "leave" }
  | { kind: "device"; path: string; id?: string; deviceId: string; domain?: string; type?: string }
  | { kind: "mqtt"; path: string; id?: string; topic: string }
  | { kind: "webhook"; path: string; id?: string; webhookId: string }
  | { kind: "calendar"; path: string; id?: string; entityId: string[]; event?: "start" | "end" }
  | { kind: "homeassistant"; path: string; id?: string; event: "start" | "shutdown" }
  | { kind: "unknown"; path: string; id?: string; raw: unknown };

export type ConditionNode =
  | { kind: "state"; entityId: string[]; state: string | string[]; attribute?: string; forDuration?: Duration }
  | { kind: "numeric_state"; entityId: string[]; above?: number; below?: number; attribute?: string; valueTemplate?: string }
  | { kind: "time"; after?: string; before?: string; weekday?: string[] }
  | { kind: "sun"; before?: "sunrise" | "sunset"; after?: "sunrise" | "sunset"; beforeOffset?: string; afterOffset?: string }
  | { kind: "zone"; entityId: string[]; zone: string[] }
  | { kind: "template"; template: string; entityIds: string[] }
  | { kind: "trigger"; triggerIds: string[] }
  | { kind: "device"; deviceId: string; domain?: string; type?: string }
  | { kind: "and"; children: ConditionNode[] }
  | { kind: "or"; children: ConditionNode[] }
  | { kind: "not"; children: ConditionNode[] }
  | { kind: "unknown"; raw: unknown };

export interface Target {
  entityId?: string[];
  deviceId?: string[];
  areaId?: string[];
  labelId?: string[];
}

export type ActionNode =
  | { kind: "service"; path: string; service: string; target?: Target; data?: Record<string, unknown> }
  | {
      kind: "choose";
      path: string;
      branches: { conditions: ConditionNode[]; sequence: ActionNode[] }[];
      default?: ActionNode[];
    }
  | { kind: "if"; path: string; conditions: ConditionNode[]; then: ActionNode[]; else?: ActionNode[] }
  | { kind: "parallel"; path: string; branches: ActionNode[][] }
  | {
      kind: "repeat";
      path: string;
      mode: "count" | "while" | "until" | "for_each";
      count?: number;
      whileConditions?: ConditionNode[];
      untilConditions?: ConditionNode[];
      forEachItems?: unknown[] | string;
      sequence: ActionNode[];
    }
  | { kind: "wait_template"; path: string; template: string; timeout?: Duration; continueOnTimeout?: boolean }
  | { kind: "wait_for_trigger"; path: string; triggers: TriggerNode[]; timeout?: Duration; continueOnTimeout?: boolean }
  | { kind: "delay"; path: string; duration: Duration | string }
  | { kind: "condition"; path: string; condition: ConditionNode }
  | { kind: "event"; path: string; eventType: string; eventData?: object }
  | { kind: "scene"; path: string; sceneId: string }
  | { kind: "stop"; path: string; reason?: string; error?: boolean }
  | { kind: "variables"; path: string; variables: Record<string, unknown> }
  | {
      // HA's "device action" shorthand from the UI action picker, e.g.
      // {"type": "turn_on", "device_id": "...", "entity_id": "<registry id>", "domain": "switch"}.
      // NB: its `entity_id` is the entity registry's stable `id` (a UUID), not a domain.slug entity_id —
      // must be resolved via the registry's id->entity_id map, not treated as a literal entity ref.
      kind: "device";
      path: string;
      deviceId: string;
      domain: string;
      type: string;
      entityRegistryId?: string;
    }
  | { kind: "unknown"; path: string; raw: unknown };

export interface AutomationIR {
  id: string;
  entityId: string;
  alias: string;
  description?: string;
  mode: "single" | "restart" | "queued" | "parallel";
  enabled: boolean;
  lastTriggered?: string;
  triggers: TriggerNode[];
  conditions: ConditionNode[];
  actions: ActionNode[];
  refs: EntityRef[];
  raw: unknown;
  parseWarnings: string[];
  /** True when config could not be fetched at all (YAML-mode automation without a readable id). */
  configUnavailable?: boolean;
  /** True when the raw config uses `use_blueprint` — actions/triggers/conditions are the blueprint's, not directly editable inputs. */
  isBlueprintInstance?: boolean;
  blueprintPath?: string;
  blueprintInputs?: Record<string, unknown>;
}

export interface EntityIndex {
  /** entityId -> automation entityIds that reference it, tagged by role */
  byEntity: Map<string, { automationId: string; role: EntityRefRole; path: string }[]>;
}

export interface Atlas {
  automations: AutomationIR[];
  index: EntityIndex;
}

export function buildEntityIndex(automations: AutomationIR[]): EntityIndex {
  const byEntity = new Map<string, { automationId: string; role: EntityRefRole; path: string }[]>();
  for (const automation of automations) {
    for (const ref of automation.refs) {
      const list = byEntity.get(ref.entityId) ?? [];
      list.push({ automationId: automation.entityId, role: ref.role, path: ref.path });
      byEntity.set(ref.entityId, list);
    }
  }
  return { byEntity };
}
