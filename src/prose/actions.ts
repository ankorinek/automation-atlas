import type { ActionNode, EntityRef } from "../ir/schema.js";
import { conditionToText, conditionsJoined } from "./conditions.js";
import { capitalize, entityListPhrase, humanizeDuration, type NameResolver } from "./humanize.js";
import { serviceVerbPhrase } from "./service-verbs.js";

export interface ProseLine {
  indent: number;
  text: string;
}

export type RefsByPath = Map<string, EntityRef[]>;

const NO_REFS: RefsByPath = new Map();

/** Entities a device_id/area_id/label_id target (or a device-action's registry id) resolved to — empty if never resolved (e.g. no registries available, or the device/entity no longer exists). */
function resolvedTargetEntities(path: string, refsByPath: RefsByPath): string[] {
  return (refsByPath.get(path) ?? []).filter((r) => r.resolvedVia).map((r) => r.entityId);
}

// HA's device-action `type` values don't always match the service name (cover/valve differ);
// this maps the common cases and falls back to the type itself, underscore-stripped.
const DEVICE_ACTION_VERBS: Record<string, string> = {
  "cover.open": "open",
  "cover.close": "close",
  "cover.stop": "stop",
  "valve.open": "open",
  "valve.close": "close",
};

function deviceActionVerb(domain: string, type: string): string {
  return DEVICE_ACTION_VERBS[`${domain}.${type}`] ?? type.replace(/_/g, " ");
}

export function actionToLines(
  action: ActionNode,
  names: NameResolver,
  indent: number,
  refsByPath: RefsByPath = NO_REFS,
): ProseLine[] {
  switch (action.kind) {
    case "service": {
      const resolved = resolvedTargetEntities(action.path, refsByPath);
      return [
        {
          indent,
          text: capitalize(serviceVerbPhrase(action.service, action.target, action.data, names, resolved)),
        },
      ];
    }

    case "choose": {
      const lines: ProseLine[] = [{ indent, text: "Then, depending on the situation:" }];
      action.branches.forEach((branch, i) => {
        const prefix = i === 0 ? "If" : "Otherwise, if";
        lines.push({ indent: indent + 1, text: `${prefix} ${conditionsJoined(branch.conditions, names)}:` });
        for (const a of branch.sequence) lines.push(...actionToLines(a, names, indent + 2, refsByPath));
      });
      if (action.default?.length) {
        lines.push({ indent: indent + 1, text: "Otherwise:" });
        for (const a of action.default) lines.push(...actionToLines(a, names, indent + 2, refsByPath));
      }
      return lines;
    }

    case "if": {
      const lines: ProseLine[] = [{ indent, text: `If ${conditionsJoined(action.conditions, names)}:` }];
      for (const a of action.then) lines.push(...actionToLines(a, names, indent + 1, refsByPath));
      if (action.else?.length) {
        lines.push({ indent, text: "Otherwise:" });
        for (const a of action.else) lines.push(...actionToLines(a, names, indent + 1, refsByPath));
      }
      return lines;
    }

    case "parallel": {
      const lines: ProseLine[] = [{ indent, text: "Then, all at the same time:" }];
      action.branches.forEach((branch) => {
        for (const a of branch) lines.push(...actionToLines(a, names, indent + 1, refsByPath));
      });
      return lines;
    }

    case "repeat": {
      let header: string;
      switch (action.mode) {
        case "count":
          header = `Repeat ${action.count} time${action.count === 1 ? "" : "s"}:`;
          break;
        case "while":
          header = `Repeat while ${conditionsJoined(action.whileConditions ?? [], names)}:`;
          break;
        case "until":
          header = `Repeat until ${conditionsJoined(action.untilConditions ?? [], names)}:`;
          break;
        case "for_each":
          header = "Repeat for each item in the list:";
          break;
      }
      const lines: ProseLine[] = [{ indent, text: header }];
      for (const a of action.sequence) lines.push(...actionToLines(a, names, indent + 1, refsByPath));
      return lines;
    }

    case "wait_template":
      return [
        {
          indent,
          text: `Wait until a template condition becomes true${action.timeout ? ` (up to ${humanizeDuration(action.timeout)})` : ""}`,
        },
      ];

    case "wait_for_trigger":
      return [
        {
          indent,
          text: `Wait for a trigger${action.timeout ? ` (up to ${humanizeDuration(action.timeout)})` : ""}`,
        },
      ];

    case "delay":
      return [
        {
          indent,
          text: `Wait ${typeof action.duration === "string" ? action.duration : humanizeDuration(action.duration)}`,
        },
      ];

    case "condition":
      return [{ indent, text: `But only continue if ${conditionToText(action.condition, names)}` }];

    case "event":
      return [{ indent, text: `Fire the event "${action.eventType}"` }];

    case "scene":
      return [{ indent, text: `Activate the scene \`${action.sceneId}\`` }];

    case "stop":
      return [{ indent, text: `Stop here${action.reason ? `: ${action.reason}` : ""}${action.error ? " (as an error)" : ""}` }];

    case "variables":
      return [{ indent, text: `Set variable(s): ${Object.keys(action.variables).join(", ")}` }];

    case "device": {
      const resolved = resolvedTargetEntities(action.path, refsByPath);
      const verb = deviceActionVerb(action.domain, action.type);
      if (resolved.length) {
        return [{ indent, text: capitalize(`${verb} ${entityListPhrase(resolved, names, "and")}`) }];
      }
      return [
        {
          indent,
          text: capitalize(
            `${verb} \`${action.domain}\` on device \`${action.deviceId}\` — entity reference could not be resolved (the device may no longer exist)`,
          ),
        },
      ];
    }

    case "unknown":
      return [{ indent, text: "1 step Atlas can't describe yet (show raw)" }];
  }
}
