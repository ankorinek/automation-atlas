// Minimal slice of the HA frontend's `hass` object we actually touch.
// Deliberately narrow — widen only when a new field is verified against
// home-assistant/frontend source (see contracts.md), never guessed.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & { friendly_name?: string; id?: string; last_triggered?: string };
  last_changed: string;
  last_updated: string;
}

export interface UnsubscribeFn {
  (): void;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callApi<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string): Promise<T>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeEvents<T = unknown>(callback: (event: T) => void, eventType: string): Promise<UnsubscribeFn>;
  };
}

// --- Registry wire shapes (config/*_registry/list) -------------------------

export interface EntityRegistryEntry {
  /** Stable UUID identity, distinct from entity_id — this is what device-action `entity_id` fields actually reference. */
  id: string;
  entity_id: string;
  name: string | null;
  original_name?: string | null;
  device_id: string | null;
  area_id: string | null;
  labels: string[];
  disabled_by: string | null;
  hidden_by: string | null;
  platform: string;
}

export interface DeviceRegistryEntry {
  id: string;
  name: string | null;
  name_by_user?: string | null;
  area_id: string | null;
  labels: string[];
}

export interface AreaRegistryEntry {
  area_id: string;
  name: string;
}

export interface LabelRegistryEntry {
  label_id: string;
  name: string;
}

// --- Traces (trace/list, trace/get) -----------------------------------------

export interface AutomationTraceSummary {
  run_id: string;
  timestamp: { start: string; finish?: string };
  trigger?: string;
  state: string;
}

export interface AutomationTraceStep {
  path: string;
  timestamp: string;
  result?: { result: boolean; [key: string]: unknown };
}

export interface AutomationTraceDetail {
  run_id: string;
  trigger?: {
    platform?: string;
    description?: string;
    to_state?: string;
    from_state?: string;
    entity_id?: string;
  };
  action_trace: AutomationTraceStep[];
  config_summary?: { alias: string; mode: string };
}
