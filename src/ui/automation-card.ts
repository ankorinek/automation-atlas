import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { AutomationIR } from "../ir/schema.js";
import { composeAutomationProse } from "../prose/compose.js";
import { noNames, type NameResolver } from "../prose/humanize.js";
import { inlineMarkup } from "./inline-markup.js";
import { relativeTime } from "./relative-time.js";

@customElement("atlas-automation-card")
export class AtlasAutomationCard extends LitElement {
  @property({ attribute: false }) automation!: AutomationIR;
  @property({ attribute: false }) names: NameResolver = noNames;
  @state() private expanded = false;
  @state() private showRaw = false;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 8px;
    }
    .card {
      background: var(--card-background-color, #fff);
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.12));
      color: var(--primary-text-color);
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      cursor: pointer;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot.on {
      background: var(--state-active-color, #4caf50);
    }
    .dot.off {
      background: var(--disabled-text-color, #bdbdbd);
    }
    .alias {
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .last-triggered {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      flex-shrink: 0;
    }
    a.edit-link {
      color: var(--primary-color);
      text-decoration: none;
      flex-shrink: 0;
      font-size: 0.85em;
    }
    @media (max-width: 480px) {
      .header {
        flex-wrap: wrap;
      }
      .alias {
        flex-basis: 100%;
        order: 1;
      }
      .last-triggered {
        order: 2;
      }
      a.edit-link {
        order: 3;
      }
    }
    .body {
      padding: 0 16px 16px;
      border-top: 1px solid var(--divider-color);
      overflow-wrap: anywhere;
    }
    .section-label {
      font-size: 0.75em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin: 12px 0 4px;
    }
    .trigger-line,
    .condition-line {
      margin: 2px 0;
    }
    .action-line {
      margin: 2px 0;
    }
    .mode-note {
      font-style: italic;
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin-top: 8px;
    }
    .warning {
      color: var(--warning-color, #ff9800);
    }
    code {
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.06));
      border-radius: 4px;
      padding: 0 4px;
      font-size: 0.9em;
    }
    button.raw-toggle {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      padding: 8px 0;
      font-size: 0.85em;
    }
    pre {
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.06));
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.8em;
    }
    .blueprint-inputs {
      font-size: 0.9em;
    }
  `;

  private renderBody() {
    const a = this.automation;

    if (a.configUnavailable) {
      return html`<div class="warning">Config not readable via API — likely a YAML-mode automation without a
        storage id. Excluded from the dependency graph and audit.</div>`;
    }

    if (a.isBlueprintInstance) {
      return html`
        <div class="warning">Blueprint instance (${a.blueprintPath ?? "unknown blueprint"}) — inputs shown below,
        rendered triggers/conditions/actions aren't expanded.</div>
        ${a.blueprintInputs
          ? html`<pre class="blueprint-inputs">${JSON.stringify(a.blueprintInputs, null, 2)}</pre>`
          : ""}
      `;
    }

    const prose = composeAutomationProse(a, this.names);

    return html`
      <div class="section-label">Triggers</div>
      ${prose.triggerLines.map((line) => html`<div class="trigger-line">${inlineMarkup(line)}</div>`)}
      ${prose.conditionLine
        ? html`<div class="section-label">Conditions</div>
            <div class="condition-line">${inlineMarkup(prose.conditionLine)}</div>`
        : ""}
      <div class="section-label">Actions</div>
      ${prose.actionLines.map(
        (line) =>
          html`<div class="action-line" style="padding-left: ${line.indent * 16}px">${inlineMarkup(line.text)}</div>`,
      )}
      ${prose.modeNote ? html`<div class="mode-note">(${prose.modeNote})</div>` : ""}
      ${a.parseWarnings.length
        ? html`<div class="section-label">Warnings</div>
            ${a.parseWarnings.map((w) => html`<div class="warning">${w}</div>`)}`
        : ""}
      <button class="raw-toggle" @click=${() => (this.showRaw = !this.showRaw)}>
        ${this.showRaw ? "Hide" : "Show"} raw config
      </button>
      ${this.showRaw ? html`<pre>${JSON.stringify(a.raw, null, 2)}</pre>` : ""}
    `;
  }

  private onViewFlowchart(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("view-flowchart", { detail: { entityId: this.automation.entityId }, bubbles: true, composed: true }),
    );
  }

  private onViewDependencyGraph(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("view-dependency-graph", {
        detail: { entityId: this.automation.entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected render() {
    const a = this.automation;
    return html`
      <div class="card">
        <div class="header" @click=${() => (this.expanded = !this.expanded)}>
          <span class="dot ${a.enabled ? "on" : "off"}" title=${a.enabled ? "Enabled" : "Disabled"}></span>
          <span class="alias">${a.alias}</span>
          <span class="last-triggered">${relativeTime(a.lastTriggered)}</span>
          ${!a.configUnavailable && !a.isBlueprintInstance
            ? html`
                <a class="edit-link" href="#" @click=${this.onViewFlowchart}>Flowchart</a>
                <a class="edit-link" href="#" @click=${this.onViewDependencyGraph}>Dependency Graph</a>
              `
            : ""}
          <a
            class="edit-link"
            href="/config/automation/edit/${a.id}"
            target="_top"
            @click=${(e: Event) => e.stopPropagation()}
            >Edit ↗</a
          >
        </div>
        ${this.expanded ? html`<div class="body">${this.renderBody()}</div>` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "atlas-automation-card": AtlasAutomationCard;
  }
}
