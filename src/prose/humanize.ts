import type { Duration } from "../ir/schema.js";

export type NameResolver = (entityId: string) => string | undefined;

export const noNames: NameResolver = () => undefined;

// Domains whose friendly names are proper nouns or already read naturally —
// "the Jordan" and "the the sun" both sound wrong, so skip the article.
const NO_ARTICLE_DOMAINS = new Set(["person", "sun"]);

/** "the {friendly name}", falling back to the entity_id in backticks (renderer treats this as inline code). */
export function entityPhrase(entityId: string, names: NameResolver = noNames): string {
  const name = names(entityId);
  if (!name) return `\`${entityId}\``;
  const domain = entityId.split(".")[0] ?? "";
  if (NO_ARTICLE_DOMAINS.has(domain) || name.toLowerCase().startsWith("the ")) return name;
  return `the ${name}`;
}

export function entityListPhrase(entityIds: string[], names: NameResolver = noNames, joiner: "and" | "or" = "or"): string {
  const phrases = entityIds.map((id) => entityPhrase(id, names));
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0]!;
  if (phrases.length === 2) return `${phrases[0]} ${joiner} ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, ${joiner} ${phrases[phrases.length - 1]}`;
}

const UNIT_ORDER: Array<[keyof Exclude<Duration, string>, string]> = [
  ["hours", "hour"],
  ["minutes", "minute"],
  ["seconds", "second"],
  ["milliseconds", "millisecond"],
];

function pluralize(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/** "00:05:00" | {minutes: 5} | {hours: 1, minutes: 30} -> "5 minutes" / "1 hour 30 minutes" */
export function humanizeDuration(duration: Duration | undefined): string {
  if (duration === undefined) return "";
  if (typeof duration === "string") {
    const match = /^(\d+):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(duration.trim());
    if (!match) return duration;
    const [, h, m, s] = match.map(Number) as unknown as [number, number, number, number];
    return humanizeDuration({ hours: h, minutes: m, seconds: s });
  }
  const parts: string[] = [];
  for (const [key, label] of UNIT_ORDER) {
    const value = duration[key];
    if (value) parts.push(pluralize(value, label));
  }
  return parts.length ? parts.join(" ") : "0 seconds";
}

/** "06:30:00" -> "06:30"; leaves anything non-matching untouched. */
export function humanizeClockTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})(:\d{2})?$/.exec(time.trim());
  if (!match) return time;
  return `${match[1]}:${match[2]}`;
}

export function titleCaseFromSlug(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

export function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

export function truncate(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}
