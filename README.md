# Automation Atlas

A frontend-only Home Assistant custom panel that renders your automations as plain language, per-automation flowcharts, an ego-centered entity↔automation dependency graph, and a static-analysis audit layer.

**Strictly read-only.** This panel never writes automation configs, never calls services (other than the ones you already have), and never mutates anything in your Home Assistant instance.

## Status

Phases 0–3 are complete and deployed to a real HA instance: scaffolding + API contracts, the parser + Plain Language view, flowcharts with real trace overlay (ELK layout, SVG rendering, click-to-inspect, copy-as-SVG/download-PNG), an ego-centered dependency graph (pick any automation or entity, see its direct neighbors, click one to recenter), and an audit tab surfacing structural issues (unreachable/orphaned entity references, disabled entities or automations still being referenced, automations with no triggers, parse warnings) as a cross-automation punch list with edit links. 117 passing tests, clean typecheck. elkjs (~2.3MB) is dynamically imported and code-splits into its own chunk, shared by both the Flowchart and Dependency Graph tabs — the main bundle is ~93KB and never pays for elkjs unless one of those tabs is actually opened.

Phase 4 (polish, mobile pass, HACS packaging) is done: a responsive pass across all four tabs (tab bar and card/audit rows now wrap instead of overflowing on narrow viewports, long entity ids in inline code spans now break instead of forcing horizontal scroll), a LICENSE, and the repo is now installable as a HACS custom repository.

See [`docs/adr/`](docs/adr/) for architecture decisions and [`src/ha/contracts.md`](src/ha/contracts.md) for verified HA API contracts.

**Deploying an update:** `npm run build`, then copy **both** `dist/automation-atlas.js` and the hashed `dist/elk.bundled-*.js` chunk to the same remote directory (`/config/www/automation-atlas-dev/`) — the flowchart tab's dynamic import resolves the chunk relative to the main bundle's own URL, so both files must live side by side. The built `dist/` output is committed to this repo (not gitignored) for exactly the same reason: HACS's plugin category downloads repository/release content directly with no build step of its own, so both files need to already exist together in the repo. **Rebuild and re-commit `dist/` before tagging any new release.**

## Install (HACS)

1. HACS → Frontend → ⋮ → Custom repositories → add this repo, category "Lovelace".
2. Install "Automation Atlas".
3. Add to `configuration.yaml`:

```yaml
panel_custom:
  - name: automation-atlas-panel
    sidebar_title: Automation Atlas
    sidebar_icon: mdi:sitemap
    url_path: automation-atlas
    module_url: /hacsfiles/automation-atlas/automation-atlas.js
```

4. Restart Home Assistant.

Alternatively, add `custom:automation-atlas-card` to a dashboard for the Plain Language view without a sidebar entry.

## Dev workflow

```bash
npm install
npm run dev      # vite build --watch, outputs dist/automation-atlas.js
npm test         # vitest
npm run typecheck
```

Point a temporary `panel_custom` entry at your built file (e.g. via Samba/SSH into `config/www/`), and bump the `?v=` query param on `module_url` on every reload — HA aggressively caches module URLs.

## Limitations

- **YAML-mode automations without an `id`**: automations defined directly in `automations.yaml` (not created via the UI) may not have a retrievable config through the REST endpoint this panel uses. These render as a degraded card and are excluded from the dependency graph and audit rules.
- **Template-derived entity references are heuristic**: extracted via regex over common Jinja patterns (`states(...)`, `is_state(...)`, etc.), not by evaluating the template. Marked as such in the UI; never used to fail audit rules on their own.
- **No editing.** Every "open in editor" link takes you to HA's own automation editor — this panel doesn't write anything.

## Non-goals (v1)

Editing automations, script/scene coverage, LLM-based summarization.
