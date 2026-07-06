// Heuristic entity-id extraction from Jinja templates. Never evaluates the
// template — regex over common accessor patterns only. False negatives are
// expected and fine; this feeds the dependency graph and prose, not the audit
// rules (which must never fail solely on heuristic evidence).

const ENTITY_ID_RE = /[a-z_]+\.[a-z0-9_]+/;

const QUOTED_CALL_RE = new RegExp(
  `(?:states|is_state|state_attr|has_value|expand)\\(\\s*['"](${ENTITY_ID_RE.source})['"]`,
  "g",
);

const DOT_ACCESS_RE = new RegExp(`states\\.(${ENTITY_ID_RE.source})`, "g");

export function extractTemplateEntityIds(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(QUOTED_CALL_RE)) {
    if (match[1]) found.add(match[1]);
  }
  for (const match of template.matchAll(DOT_ACCESS_RE)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}
