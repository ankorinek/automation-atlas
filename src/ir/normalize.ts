import type {
  ActionNode,
  AutomationIR,
  ConditionNode,
  Duration,
  Target,
  TriggerNode,
} from "./schema.js";
import { extractTemplateEntityIds } from "./template-refs.js";
import { extractRefs } from "./extract-refs.js";

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// --- Triggers ---------------------------------------------------------

function normalizeTrigger(item: unknown, path: string, warnings: string[]): TriggerNode {
  if (!isRecord(item)) {
    warnings.push(`Unrecognized trigger at ${path}`);
    return { kind: "unknown", path, raw: item };
  }
  const kindStr = (item.trigger ?? item.platform) as string | undefined;
  const id = typeof item.id === "string" ? item.id : undefined;

  switch (kindStr) {
    case "state": {
      const entityId = asArray(item.entity_id as string | string[] | undefined).filter(
        (v): v is string => typeof v === "string",
      );
      return {
        kind: "state",
        path,
        id,
        entityId,
        from: (item.from as string | string[] | null | undefined) ?? undefined,
        to: (item.to as string | string[] | null | undefined) ?? undefined,
        for: item.for as Duration | undefined,
        attribute: item.attribute as string | undefined,
      };
    }
    case "numeric_state": {
      const entityId = asArray(item.entity_id as string | string[] | undefined).filter(
        (v): v is string => typeof v === "string",
      );
      return {
        kind: "numeric_state",
        path,
        id,
        entityId,
        above: item.above as number | undefined,
        below: item.below as number | undefined,
        for: item.for as Duration | undefined,
        attribute: item.attribute as string | undefined,
        valueTemplate: item.value_template as string | undefined,
      };
    }
    case "time":
      return {
        kind: "time",
        path,
        id,
        at: asArray(item.at as string | string[] | undefined).filter(
          (v): v is string => typeof v === "string",
        ),
      };
    case "time_pattern":
      return {
        kind: "time_pattern",
        path,
        id,
        hours: item.hours != null ? String(item.hours) : undefined,
        minutes: item.minutes != null ? String(item.minutes) : undefined,
        seconds: item.seconds != null ? String(item.seconds) : undefined,
      };
    case "sun":
      return {
        kind: "sun",
        path,
        id,
        event: item.event as "sunrise" | "sunset",
        offset: item.offset as string | undefined,
      };
    case "template": {
      const template = (item.value_template as string) ?? "";
      return { kind: "template", path, id, template, entityIds: extractTemplateEntityIds(template) };
    }
    case "event":
      return {
        kind: "event",
        path,
        id,
        eventType: item.event_type as string | string[],
        eventData: item.event_data as object | undefined,
      };
    case "zone":
      return {
        kind: "zone",
        path,
        id,
        entityId: asArray(item.entity_id as string | string[] | undefined).filter(
          (v): v is string => typeof v === "string",
        ),
        zone: asArray(item.zone as string | string[] | undefined).filter(
          (v): v is string => typeof v === "string",
        ),
        event: item.event as "enter" | "leave" | undefined,
      };
    case "device":
      return {
        kind: "device",
        path,
        id,
        deviceId: item.device_id as string,
        domain: item.domain as string | undefined,
        type: item.type as string | undefined,
      };
    case "mqtt":
      return { kind: "mqtt", path, id, topic: item.topic as string };
    case "webhook":
      return { kind: "webhook", path, id, webhookId: item.webhook_id as string };
    case "calendar":
      return {
        kind: "calendar",
        path,
        id,
        entityId: asArray(item.entity_id as string | string[] | undefined).filter(
          (v): v is string => typeof v === "string",
        ),
        event: item.event as "start" | "end" | undefined,
      };
    case "homeassistant":
      return { kind: "homeassistant", path, id, event: item.event as "start" | "shutdown" };
    default:
      warnings.push(`Unrecognized trigger kind "${String(kindStr)}" at ${path}`);
      return { kind: "unknown", path, id, raw: item };
  }
}

// --- Conditions ---------------------------------------------------------

function normalizeCondition(item: unknown, warnings: string[], path = "condition"): ConditionNode {
  if (typeof item === "string") {
    // Bare-string shorthand for a template condition.
    return { kind: "template", template: item, entityIds: extractTemplateEntityIds(item) };
  }
  if (!isRecord(item)) {
    warnings.push(`Unrecognized condition at ${path}`);
    return { kind: "unknown", raw: item };
  }
  const kindStr = item.condition as string | undefined;

  switch (kindStr) {
    case "state": {
      const entityId = asArray(item.entity_id as string | string[] | undefined).filter(
        (v): v is string => typeof v === "string",
      );
      return {
        kind: "state",
        entityId,
        state: item.state as string | string[],
        attribute: item.attribute as string | undefined,
        forDuration: item.for as Duration | undefined,
      };
    }
    case "numeric_state": {
      const entityId = asArray(item.entity_id as string | string[] | undefined).filter(
        (v): v is string => typeof v === "string",
      );
      return {
        kind: "numeric_state",
        entityId,
        above: item.above as number | undefined,
        below: item.below as number | undefined,
        attribute: item.attribute as string | undefined,
        valueTemplate: item.value_template as string | undefined,
      };
    }
    case "time":
      return {
        kind: "time",
        after: item.after as string | undefined,
        before: item.before as string | undefined,
        weekday: item.weekday
          ? asArray(item.weekday as string | string[]).filter((v): v is string => typeof v === "string")
          : undefined,
      };
    case "sun":
      return {
        kind: "sun",
        before: item.before as "sunrise" | "sunset" | undefined,
        after: item.after as "sunrise" | "sunset" | undefined,
        beforeOffset: item.before_offset as string | undefined,
        afterOffset: item.after_offset as string | undefined,
      };
    case "zone":
      return {
        kind: "zone",
        entityId: asArray(item.entity_id as string | string[] | undefined).filter(
          (v): v is string => typeof v === "string",
        ),
        zone: asArray(item.zone as string | string[] | undefined).filter(
          (v): v is string => typeof v === "string",
        ),
      };
    case "template": {
      const template = (item.value_template as string) ?? "";
      return { kind: "template", template, entityIds: extractTemplateEntityIds(template) };
    }
    case "trigger":
      return {
        kind: "trigger",
        triggerIds: asArray(item.id as string | string[]).filter((v): v is string => typeof v === "string"),
      };
    case "device":
      return {
        kind: "device",
        deviceId: item.device_id as string,
        domain: item.domain as string | undefined,
        type: item.type as string | undefined,
      };
    case "and":
      return {
        kind: "and",
        children: asArray(item.conditions as unknown[]).map((c) => normalizeCondition(c, warnings, path)),
      };
    case "or":
      return {
        kind: "or",
        children: asArray(item.conditions as unknown[]).map((c) => normalizeCondition(c, warnings, path)),
      };
    case "not":
      return {
        kind: "not",
        children: asArray(item.conditions as unknown[]).map((c) => normalizeCondition(c, warnings, path)),
      };
    default:
      warnings.push(`Unrecognized condition kind "${String(kindStr)}" at ${path}`);
      return { kind: "unknown", raw: item };
  }
}

// --- Targets --------------------------------------------------------------

function normalizeTarget(item: Record<string, unknown>): Target | undefined {
  const targetRaw = isRecord(item.target) ? item.target : item;
  const entityId = asArray(targetRaw.entity_id as string | string[] | undefined).filter(
    (v): v is string => typeof v === "string",
  );
  const deviceId = asArray(targetRaw.device_id as string | string[] | undefined).filter(
    (v): v is string => typeof v === "string",
  );
  const areaId = asArray(targetRaw.area_id as string | string[] | undefined).filter(
    (v): v is string => typeof v === "string",
  );
  const labelId = asArray(targetRaw.label_id as string | string[] | undefined).filter(
    (v): v is string => typeof v === "string",
  );
  if (!entityId.length && !deviceId.length && !areaId.length && !labelId.length) return undefined;
  return {
    ...(entityId.length ? { entityId } : {}),
    ...(deviceId.length ? { deviceId } : {}),
    ...(areaId.length ? { areaId } : {}),
    ...(labelId.length ? { labelId } : {}),
  };
}

// --- Actions ----------------------------------------------------------

function normalizeAction(item: unknown, path: string, warnings: string[]): ActionNode {
  if (!isRecord(item)) {
    warnings.push(`Unrecognized action at ${path}`);
    return { kind: "unknown", path, raw: item };
  }

  if (Array.isArray(item.choose)) {
    const branches = (item.choose as unknown[]).map((branch, i) => {
      const b = isRecord(branch) ? branch : {};
      return {
        conditions: asArray(b.conditions as unknown[]).map((c) => normalizeCondition(c, warnings, `${path}/choose/${i}`)),
        sequence: asArray(b.sequence as unknown[]).map((a, j) =>
          normalizeAction(a, `${path}/choose/${i}/sequence/${j}`, warnings),
        ),
      };
    });
    const def = item.default
      ? asArray(item.default as unknown[]).map((a, j) => normalizeAction(a, `${path}/choose/default/${j}`, warnings))
      : undefined;
    return { kind: "choose", path, branches, default: def };
  }

  if (Array.isArray(item.if)) {
    const conditions = (item.if as unknown[]).map((c) => normalizeCondition(c, warnings, `${path}/if`));
    const then = asArray(item.then as unknown[]).map((a, j) => normalizeAction(a, `${path}/then/${j}`, warnings));
    const elseBranch = item.else
      ? asArray(item.else as unknown[]).map((a, j) => normalizeAction(a, `${path}/else/${j}`, warnings))
      : undefined;
    return { kind: "if", path, conditions, then, else: elseBranch };
  }

  if (Array.isArray(item.parallel)) {
    const branches = (item.parallel as unknown[]).map((branch, i) => {
      if (isRecord(branch) && Array.isArray(branch.sequence)) {
        return (branch.sequence as unknown[]).map((a, j) =>
          normalizeAction(a, `${path}/parallel/${i}/${j}`, warnings),
        );
      }
      return [normalizeAction(branch, `${path}/parallel/${i}/0`, warnings)];
    });
    return { kind: "parallel", path, branches };
  }

  if (isRecord(item.repeat)) {
    const r = item.repeat;
    const sequence = asArray(r.sequence as unknown[]).map((a, j) =>
      normalizeAction(a, `${path}/repeat/sequence/${j}`, warnings),
    );
    if (r.count !== undefined) {
      return { kind: "repeat", path, mode: "count", count: Number(r.count), sequence };
    }
    if (r.while !== undefined) {
      return {
        kind: "repeat",
        path,
        mode: "while",
        whileConditions: asArray(r.while as unknown[]).map((c) => normalizeCondition(c, warnings, `${path}/repeat`)),
        sequence,
      };
    }
    if (r.until !== undefined) {
      return {
        kind: "repeat",
        path,
        mode: "until",
        untilConditions: asArray(r.until as unknown[]).map((c) => normalizeCondition(c, warnings, `${path}/repeat`)),
        sequence,
      };
    }
    if (r.for_each !== undefined) {
      return {
        kind: "repeat",
        path,
        mode: "for_each",
        forEachItems: r.for_each as unknown[] | string,
        sequence,
      };
    }
    warnings.push(`repeat action at ${path} has no count/while/until/for_each`);
    return { kind: "repeat", path, mode: "count", count: 0, sequence };
  }

  if (typeof item.wait_template === "string") {
    return {
      kind: "wait_template",
      path,
      template: item.wait_template,
      timeout: item.timeout as Duration | undefined,
      continueOnTimeout: item.continue_on_timeout as boolean | undefined,
    };
  }

  if (Array.isArray(item.wait_for_trigger)) {
    return {
      kind: "wait_for_trigger",
      path,
      triggers: (item.wait_for_trigger as unknown[]).map((t, j) =>
        normalizeTrigger(t, `${path}/wait_for_trigger/${j}`, warnings),
      ),
      timeout: item.timeout as Duration | undefined,
      continueOnTimeout: item.continue_on_timeout as boolean | undefined,
    };
  }

  if (item.delay !== undefined) {
    return { kind: "delay", path, duration: item.delay as Duration | string };
  }

  if (typeof item.condition === "string" || isRecord(item.condition)) {
    // Bare condition-as-action (stops the sequence if false), not a `condition:` key
    // nested inside a compound condition — distinguished by being a top-level action step.
    return { kind: "condition", path, condition: normalizeCondition(item, warnings, path) };
  }

  if (item.event !== undefined) {
    return {
      kind: "event",
      path,
      eventType: item.event as string,
      eventData: item.event_data as object | undefined,
    };
  }

  if (typeof item.scene === "string") {
    return { kind: "scene", path, sceneId: item.scene };
  }

  if (item.stop !== undefined) {
    return {
      kind: "stop",
      path,
      reason: typeof item.stop === "string" ? item.stop : undefined,
      error: item.error as boolean | undefined,
    };
  }

  if (isRecord(item.variables)) {
    return { kind: "variables", path, variables: item.variables };
  }

  if (typeof item.device_id === "string" && typeof item.domain === "string" && typeof item.type === "string") {
    return {
      kind: "device",
      path,
      deviceId: item.device_id,
      domain: item.domain,
      type: item.type,
      entityRegistryId: typeof item.entity_id === "string" ? item.entity_id : undefined,
    };
  }

  const service = (item.action ?? item.service) as string | undefined;
  if (typeof service === "string") {
    return {
      kind: "service",
      path,
      service,
      target: normalizeTarget(item),
      data: isRecord(item.data) ? item.data : isRecord(item.service_data) ? item.service_data : undefined,
    };
  }

  warnings.push(`Unrecognized action shape at ${path}`);
  return { kind: "unknown", path, raw: item };
}

// --- Entry point --------------------------------------------------------

export interface NormalizeInput {
  entityId: string;
  raw: unknown;
  enabled: boolean;
  lastTriggered?: string;
}

export function normalizeAutomation(input: NormalizeInput): AutomationIR {
  const warnings: string[] = [];
  const raw = input.raw;

  if (!isRecord(raw)) {
    return {
      id: input.entityId,
      entityId: input.entityId,
      alias: input.entityId,
      mode: "single",
      enabled: input.enabled,
      lastTriggered: input.lastTriggered,
      triggers: [],
      conditions: [],
      actions: [],
      refs: [],
      raw,
      parseWarnings: ["Config is not a readable object"],
      configUnavailable: true,
    };
  }

  if (typeof raw.use_blueprint === "object" && raw.use_blueprint !== null) {
    const bp = raw.use_blueprint as Record<string, unknown>;
    return {
      id: (raw.id as string) ?? input.entityId,
      entityId: input.entityId,
      alias: (raw.alias as string) ?? input.entityId,
      description: raw.description as string | undefined,
      mode: (raw.mode as AutomationIR["mode"]) ?? "single",
      enabled: input.enabled,
      lastTriggered: input.lastTriggered,
      triggers: [],
      conditions: [],
      actions: [],
      refs: [],
      raw,
      parseWarnings: ["Blueprint instance — rendered config not expanded; showing inputs only"],
      isBlueprintInstance: true,
      blueprintPath: bp.path as string | undefined,
      blueprintInputs: isRecord(bp.input) ? bp.input : undefined,
    };
  }

  const triggersRaw = asArray((raw.triggers ?? raw.trigger) as unknown | unknown[]);
  const conditionsRaw = asArray((raw.conditions ?? raw.condition) as unknown | unknown[]);
  const actionsRaw = asArray((raw.actions ?? raw.action) as unknown | unknown[]);

  const triggers = triggersRaw.map((t, i) => normalizeTrigger(t, `trigger/${i}`, warnings));
  const conditions = conditionsRaw.map((c) => normalizeCondition(c, warnings, "condition"));
  const actions = actionsRaw.map((a, i) => normalizeAction(a, `action/${i}`, warnings));

  const ir: AutomationIR = {
    id: (raw.id as string) ?? input.entityId,
    entityId: input.entityId,
    alias: (raw.alias as string) ?? input.entityId,
    description: raw.description as string | undefined,
    mode: (raw.mode as AutomationIR["mode"]) ?? "single",
    enabled: input.enabled,
    lastTriggered: input.lastTriggered,
    triggers,
    conditions,
    actions,
    refs: [],
    raw,
    parseWarnings: warnings,
  };
  ir.refs = extractRefs(ir);
  return ir;
}
