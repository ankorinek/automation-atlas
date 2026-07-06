import type { ConditionNode } from "../ir/schema.js";
import { entityListPhrase, entityPhrase, humanizeClockTime, titleCaseFromSlug, type NameResolver } from "./humanize.js";

function attrSuffix(attribute?: string): string {
  return attribute ? ` (attribute \`${attribute}\`)` : "";
}

/** Wraps `and`/`or` children in parentheses when nested under the opposite operator, so flattening never silently changes precedence. */
function joinChildren(children: ConditionNode[], names: NameResolver, ownKind: "and" | "or", sep: string): string {
  return children
    .map((c) => {
      const text = conditionToText(c, names);
      return (c.kind === "and" || c.kind === "or") && c.kind !== ownKind ? `(${text})` : text;
    })
    .join(sep);
}

export function conditionToText(cond: ConditionNode, names: NameResolver): string {
  switch (cond.kind) {
    case "state": {
      const states = Array.isArray(cond.state) ? cond.state.join(", ") : cond.state;
      const verb = Array.isArray(cond.state) ? "is one of" : "is";
      return `${entityListPhrase(cond.entityId, names, "and")}${attrSuffix(cond.attribute)} ${verb} "${states}"`;
    }
    case "numeric_state": {
      if (cond.valueTemplate) {
        return `a template value is ${cond.above !== undefined ? `above ${cond.above}` : ""}${cond.below !== undefined ? `below ${cond.below}` : ""}`;
      }
      const bounds: string[] = [];
      if (cond.above !== undefined) bounds.push(`above ${cond.above}`);
      if (cond.below !== undefined) bounds.push(`below ${cond.below}`);
      return `${entityListPhrase(cond.entityId, names, "and")}${attrSuffix(cond.attribute)} is ${bounds.join(" and ")}`;
    }
    case "time": {
      const parts: string[] = [];
      if (cond.after) parts.push(`after ${humanizeClockTime(cond.after)}`);
      if (cond.before) parts.push(`before ${humanizeClockTime(cond.before)}`);
      if (cond.weekday?.length) parts.push(`on ${cond.weekday.join(", ")}`);
      return `it is ${parts.join(" and ")}`;
    }
    case "sun": {
      if (cond.before) return `it is before ${cond.before}${cond.beforeOffset ? ` (offset ${cond.beforeOffset})` : ""}`;
      if (cond.after) return `it is after ${cond.after}${cond.afterOffset ? ` (offset ${cond.afterOffset})` : ""}`;
      return "a sun condition holds";
    }
    case "zone":
      return `${entityListPhrase(cond.entityId, names, "and")} is in ${cond.zone.map((z) => entityPhrase(z, names)).join(" or ")}`;
    case "template":
      return `a template condition holds${cond.entityIds.length ? ` (involves ${entityListPhrase(cond.entityIds, names, "and")})` : ""}`;
    case "trigger":
      return `this run was triggered by "${cond.triggerIds.map(titleCaseFromSlug).join('" or "')}"`;
    case "device":
      return `a device condition on \`${cond.deviceId}\` holds`;
    case "and":
      return joinChildren(cond.children, names, "and", ", AND ");
    case "or":
      return joinChildren(cond.children, names, "or", ", OR ");
    case "not":
      return `NOT (${cond.children.map((c) => conditionToText(c, names)).join(", ")})`;
    case "unknown":
      return "a condition Atlas can't describe yet (show raw)";
  }
}

export function conditionsJoined(conds: ConditionNode[], names: NameResolver): string {
  if (conds.length === 0) return "true";
  if (conds.length === 1) return conditionToText(conds[0]!, names);
  return conds.map((c) => conditionToText(c, names)).join(", AND ");
}
