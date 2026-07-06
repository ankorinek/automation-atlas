// Pure static-analysis pass over the Atlas. No execution, no template evaluation — every rule
// is a structural check over data already on hand (IR, entity registry, current hass states).
import type { HomeAssistant, EntityRegistryEntry } from "../ha/types.js";
import type { Atlas, AutomationIR } from "../ir/schema.js";

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  automationEntityId?: string;
  automationAlias?: string;
  entityId?: string;
  path?: string;
  message: string;
}

function checkConfigUnavailable(automations: AutomationIR[]): AuditFinding[] {
  return automations
    .filter((a) => a.configUnavailable)
    .map((a) => ({
      id: `config-unavailable:${a.entityId}`,
      severity: "error",
      automationEntityId: a.entityId,
      automationAlias: a.alias,
      message: "Automation config could not be loaded (likely a YAML-mode automation without a storage id) — review manually in the editor.",
    }));
}

function checkParseWarnings(automations: AutomationIR[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const a of automations) {
    a.parseWarnings.forEach((warning, i) => {
      findings.push({
        id: `parse-warning:${a.entityId}:${i}`,
        severity: "warning",
        automationEntityId: a.entityId,
        automationAlias: a.alias,
        message: warning,
      });
    });
  }
  return findings;
}

function checkZeroTriggers(automations: AutomationIR[]): AuditFinding[] {
  return automations
    .filter((a) => !a.configUnavailable && !a.isBlueprintInstance && a.triggers.length === 0)
    .map((a) => ({
      id: `no-triggers:${a.entityId}`,
      severity: "warning",
      automationEntityId: a.entityId,
      automationAlias: a.alias,
      message: "No triggers — this automation can only run when triggered manually or by another automation.",
    }));
}

function checkOrphanedRefs(automations: AutomationIR[], knownEntityIds: Set<string>): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const a of automations) {
    for (const ref of a.refs) {
      if (knownEntityIds.has(ref.entityId)) continue;
      findings.push({
        id: `orphaned-ref:${a.entityId}:${ref.path}:${ref.entityId}`,
        severity: ref.heuristic ? "info" : "error",
        automationEntityId: a.entityId,
        automationAlias: a.alias,
        entityId: ref.entityId,
        path: ref.path,
        message: ref.heuristic
          ? `Possibly references \`${ref.entityId}\`, which doesn't currently exist (heuristically extracted from a template, may be inaccurate).`
          : `References \`${ref.entityId}\`, which no longer exists (may have been renamed or removed).`,
      });
    }
  }
  return findings;
}

function checkDisabledRefs(automations: AutomationIR[], disabledBy: Map<string, string>): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const a of automations) {
    if (!a.enabled) continue;
    for (const ref of a.refs) {
      if (!disabledBy.has(ref.entityId)) continue;
      findings.push({
        id: `disabled-ref:${a.entityId}:${ref.path}:${ref.entityId}`,
        severity: ref.heuristic ? "info" : "warning",
        automationEntityId: a.entityId,
        automationAlias: a.alias,
        entityId: ref.entityId,
        path: ref.path,
        message: ref.heuristic
          ? `Possibly references \`${ref.entityId}\`, which is currently disabled (heuristically extracted from a template, may be inaccurate).`
          : `References \`${ref.entityId}\`, which is currently disabled.`,
      });
    }
  }
  return findings;
}

function checkDisabledAutomationInvoked(automations: AutomationIR[]): AuditFinding[] {
  const enabledById = new Map(automations.map((a) => [a.entityId, a.enabled]));
  const aliasById = new Map(automations.map((a) => [a.entityId, a.alias]));
  const findings: AuditFinding[] = [];
  for (const a of automations) {
    if (!a.enabled) continue;
    for (const ref of a.refs) {
      if (ref.role !== "action-invoke") continue;
      if (!enabledById.has(ref.entityId) || enabledById.get(ref.entityId) !== false) continue;
      findings.push({
        id: `disabled-automation-invoked:${a.entityId}:${ref.path}:${ref.entityId}`,
        severity: "warning",
        automationEntityId: a.entityId,
        automationAlias: a.alias,
        entityId: ref.entityId,
        path: ref.path,
        message: `Triggers automation \`${aliasById.get(ref.entityId) ?? ref.entityId}\`, which is currently disabled — this call is a no-op.`,
      });
    }
  }
  return findings;
}

export function runAudit(atlas: Atlas, entityRegistry: EntityRegistryEntry[], hass: HomeAssistant): AuditFinding[] {
  const { automations } = atlas;
  const knownEntityIds = new Set<string>([...Object.keys(hass.states), ...entityRegistry.map((e) => e.entity_id)]);
  const disabledBy = new Map<string, string>(
    entityRegistry.filter((e) => e.disabled_by !== null).map((e) => [e.entity_id, e.disabled_by as string]),
  );

  return [
    ...checkConfigUnavailable(automations),
    ...checkParseWarnings(automations),
    ...checkZeroTriggers(automations),
    ...checkOrphanedRefs(automations, knownEntityIds),
    ...checkDisabledRefs(automations, disabledBy),
    ...checkDisabledAutomationInvoked(automations),
  ];
}
