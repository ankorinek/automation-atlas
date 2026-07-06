import type { Duration, TriggerNode } from "../ir/schema.js";
import { entityListPhrase, entityPhrase, humanizeClockTime, humanizeDuration, type NameResolver } from "./humanize.js";

function forSuffix(forDuration: Duration | undefined): string {
  return forDuration ? ` for ${humanizeDuration(forDuration)}` : "";
}

export function triggerToText(trigger: TriggerNode, names: NameResolver): string {
  switch (trigger.kind) {
    case "state": {
      const who = entityListPhrase(trigger.entityId, names, "or");
      const attr = trigger.attribute ? ` attribute \`${trigger.attribute}\`` : "";
      if (trigger.to !== undefined && trigger.to !== null) {
        const to = Array.isArray(trigger.to) ? trigger.to.join('" or "') : trigger.to;
        return `When ${who}${attr} changes to "${to}"${forSuffix(trigger.for)}`;
      }
      if (trigger.from !== undefined && trigger.from !== null) {
        const from = Array.isArray(trigger.from) ? trigger.from.join('" or "') : trigger.from;
        return `When ${who}${attr} changes from "${from}"${forSuffix(trigger.for)}`;
      }
      return `When ${who}${attr} changes state${forSuffix(trigger.for)}`;
    }
    case "numeric_state": {
      const who = entityListPhrase(trigger.entityId, names, "or");
      const attr = trigger.attribute ? ` attribute \`${trigger.attribute}\`` : "";
      const bounds: string[] = [];
      if (trigger.above !== undefined) bounds.push(`rises above ${trigger.above}`);
      if (trigger.below !== undefined) bounds.push(`drops below ${trigger.below}`);
      return `When ${who}${attr} ${bounds.join(" or ")}${forSuffix(trigger.for)}`;
    }
    case "time":
      return `At ${trigger.at.map(humanizeClockTime).join(" or ")}`;
    case "time_pattern": {
      const parts: string[] = [];
      if (trigger.minutes) parts.push(`every ${trigger.minutes.replace("/", "")} minutes`);
      if (trigger.hours) parts.push(`every ${trigger.hours.replace("/", "")} hours`);
      if (trigger.seconds) parts.push(`every ${trigger.seconds.replace("/", "")} seconds`);
      return `On a schedule, ${parts.join(" and ") || "periodically"}`;
    }
    case "sun":
      return `At ${trigger.event}${trigger.offset ? ` (offset ${trigger.offset})` : ""}`;
    case "template":
      return `When a template becomes true${trigger.entityIds.length ? ` (involves ${entityListPhrase(trigger.entityIds, names, "and")})` : ""}`;
    case "event":
      return `When event "${Array.isArray(trigger.eventType) ? trigger.eventType.join('" or "') : trigger.eventType}" fires`;
    case "zone":
      return `When ${entityListPhrase(trigger.entityId, names, "or")} ${trigger.event === "leave" ? "leaves" : "enters"} ${trigger.zone.map((z) => entityPhrase(z, names)).join(" or ")}`;
    case "device":
      return `On a device event (\`${trigger.deviceId}\`)`;
    case "mqtt":
      return `When an MQTT message arrives on \`${trigger.topic}\``;
    case "webhook":
      return `When webhook \`${trigger.webhookId}\` is called`;
    case "calendar":
      return `When ${entityListPhrase(trigger.entityId, names, "or")} calendar event ${trigger.event === "end" ? "ends" : "starts"}`;
    case "homeassistant":
      return `When Home Assistant ${trigger.event === "shutdown" ? "shuts down" : "starts up"}`;
    case "unknown":
      return "An unrecognized trigger (show raw)";
  }
}
