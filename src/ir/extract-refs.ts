import type { ActionNode, AutomationIR, ConditionNode, EntityRef, EntityRefRole } from "./schema.js";
import { extractTemplateEntityIds } from "./template-refs.js";

// Services that invoke another automation rather than reading/writing a device —
// worth a distinct role so the dependency graph can show "invokes" edges.
const INVOKE_SERVICES = new Set(["automation.trigger"]);

function pushTemplateRefs(template: string, path: string, refs: EntityRef[]): void {
  if (!template.includes("{{") && !template.includes("{%")) return;
  for (const entityId of extractTemplateEntityIds(template)) {
    refs.push({ entityId, role: "template", path, heuristic: true });
  }
}

function scanValueForTemplates(value: unknown, path: string, refs: EntityRef[]): void {
  if (typeof value === "string") {
    pushTemplateRefs(value, path, refs);
  } else if (Array.isArray(value)) {
    for (const v of value) scanValueForTemplates(v, path, refs);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) scanValueForTemplates(v, path, refs);
  }
}

function collectConditionRefs(cond: ConditionNode, path: string, role: EntityRefRole, refs: EntityRef[]): void {
  switch (cond.kind) {
    case "state":
    case "numeric_state":
    case "zone":
      for (const entityId of cond.entityId) refs.push({ entityId, role, path });
      if (cond.kind === "numeric_state" && cond.valueTemplate) pushTemplateRefs(cond.valueTemplate, path, refs);
      break;
    case "template":
      for (const entityId of cond.entityIds) refs.push({ entityId, role: "template", path, heuristic: true });
      break;
    case "and":
    case "or":
    case "not":
      for (const child of cond.children) collectConditionRefs(child, path, role, refs);
      break;
    case "time":
    case "sun":
    case "trigger":
    case "device":
    case "unknown":
      break;
  }
}

function collectActionRefs(action: ActionNode, refs: EntityRef[]): void {
  switch (action.kind) {
    case "service": {
      const role: EntityRefRole = INVOKE_SERVICES.has(action.service) ? "action-invoke" : "action-write";
      for (const entityId of action.target?.entityId ?? []) refs.push({ entityId, role, path: action.path });
      if (action.data) scanValueForTemplates(action.data, action.path, refs);
      break;
    }
    case "choose":
      for (const branch of action.branches) {
        for (const cond of branch.conditions) collectConditionRefs(cond, action.path, "condition-read", refs);
        for (const a of branch.sequence) collectActionRefs(a, refs);
      }
      for (const a of action.default ?? []) collectActionRefs(a, refs);
      break;
    case "if":
      for (const cond of action.conditions) collectConditionRefs(cond, action.path, "condition-read", refs);
      for (const a of action.then) collectActionRefs(a, refs);
      for (const a of action.else ?? []) collectActionRefs(a, refs);
      break;
    case "parallel":
      for (const branch of action.branches) for (const a of branch) collectActionRefs(a, refs);
      break;
    case "repeat":
      for (const cond of action.whileConditions ?? []) collectConditionRefs(cond, action.path, "condition-read", refs);
      for (const cond of action.untilConditions ?? []) collectConditionRefs(cond, action.path, "condition-read", refs);
      for (const a of action.sequence) collectActionRefs(a, refs);
      break;
    case "wait_template":
      pushTemplateRefs(action.template, action.path, refs);
      break;
    case "wait_for_trigger":
      for (const trigger of action.triggers) {
        if ("entityId" in trigger) {
          for (const entityId of trigger.entityId) refs.push({ entityId, role: "trigger", path: action.path });
        }
      }
      break;
    case "delay":
      if (typeof action.duration === "string") scanValueForTemplates(action.duration, action.path, refs);
      break;
    case "condition":
      collectConditionRefs(action.condition, action.path, "condition-read", refs);
      break;
    case "variables":
      scanValueForTemplates(action.variables, action.path, refs);
      break;
    case "event":
    case "scene":
    case "stop":
    case "device": // resolved via resolveTargetRefs, which has registry access this pure pass doesn't
    case "unknown":
      break;
  }
}

export function extractRefs(ir: AutomationIR): EntityRef[] {
  const refs: EntityRef[] = [];

  for (const trigger of ir.triggers) {
    if ("entityId" in trigger) {
      for (const entityId of trigger.entityId) refs.push({ entityId, role: "trigger", path: trigger.path });
    }
    if (trigger.kind === "template") {
      for (const entityId of trigger.entityIds) refs.push({ entityId, role: "template", path: trigger.path, heuristic: true });
    }
    if (trigger.kind === "numeric_state" && trigger.valueTemplate) {
      pushTemplateRefs(trigger.valueTemplate, trigger.path, refs);
    }
  }

  ir.conditions.forEach((cond, i) => collectConditionRefs(cond, `condition/${i}`, "condition-read", refs));

  for (const action of ir.actions) collectActionRefs(action, refs);

  // Dedup identical (entityId, role, path) triples.
  const seen = new Set<string>();
  return refs.filter((r) => {
    const key = `${r.entityId}|${r.role}|${r.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
