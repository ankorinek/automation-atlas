import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { runAudit, type AuditFinding } from "./audit/rules.js";
import { fetchAtlas, buildNameLookup, subscribeAutomationReloaded } from "./ha/fetch.js";
import type { HomeAssistant, UnsubscribeFn } from "./ha/types.js";
import type { Atlas } from "./ir/schema.js";
import type { NameResolver } from "./prose/humanize.js";
import "./ui/plain-language-view.js";
import "./ui/flowchart-view.js";
import "./ui/ego-graph-view.js";
import "./ui/audit-view.js";
import "./card.js";

interface PanelInfo {
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; atlas: Atlas };
type Tab = "plain-language" | "flowchart" | "dependency-graph" | "audit";

@customElement("automation-atlas-panel")
export class AutomationAtlasPanel extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) narrow = false;
  @property({ attribute: false }) panel?: PanelInfo;
  @property({ attribute: false }) route?: unknown;

  @state() private load: LoadState = { status: "loading" };
  @state() private names: NameResolver = () => undefined;
  @state() private activeTab: Tab = "plain-language";
  @state() private flowchartEntityId?: string;
  @state() private centerId?: string;
  @state() private auditFindings: AuditFinding[] = [];

  private hasLoaded = false;
  private unsubscribeReload?: UnsubscribeFn;

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
      min-height: 100%;
      box-sizing: border-box;
      max-width: 1100px;
      margin: 0 auto;
    }
    .topbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    h1 {
      flex: 1;
      font-size: 1.4em;
      margin: 0;
    }
    button.refresh {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .tabs button {
      background: none;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 0.95em;
      color: var(--secondary-text-color);
      border-bottom: 2px solid transparent;
    }
    @media (max-width: 480px) {
      :host {
        padding: 8px;
      }
      .tabs button {
        padding: 8px 10px;
        font-size: 0.85em;
      }
    }
    .tabs button.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      font-weight: 500;
    }
    .status {
      color: var(--secondary-text-color);
      padding: 32px 0;
      text-align: center;
    }
    .status.error {
      color: var(--error-color, #b00020);
    }
    select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      margin-bottom: 12px;
      max-width: 100%;
    }
  `;

  protected async updated(changed: PropertyValues): Promise<void> {
    if (changed.has("hass") && this.hass && !this.hasLoaded) {
      this.hasLoaded = true;
      await this.loadAtlas();
      this.unsubscribeReload = await subscribeAutomationReloaded(this.hass, () => this.loadAtlas());
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeReload?.();
  }

  private async loadAtlas(): Promise<void> {
    this.load = { status: "loading" };
    try {
      const { atlas, entityRegistry } = await fetchAtlas(this.hass);
      this.names = buildNameLookup(this.hass, entityRegistry);
      this.auditFindings = runAudit(atlas, entityRegistry, this.hass);
      this.load = { status: "ready", atlas };
    } catch (err) {
      this.load = { status: "error", message: err instanceof Error ? err.message : String(err) };
    }
  }

  private onViewFlowchart(e: CustomEvent<{ entityId: string }>): void {
    this.flowchartEntityId = e.detail.entityId;
    this.activeTab = "flowchart";
  }

  private onViewDependencyGraph(e: CustomEvent<{ entityId: string }>): void {
    this.centerId = e.detail.entityId;
    this.activeTab = "dependency-graph";
  }

  private onRecenter(e: CustomEvent<{ id: string }>): void {
    this.centerId = e.detail.id;
  }

  private onPickFlowchartAutomation(e: Event): void {
    this.flowchartEntityId = (e.target as HTMLSelectElement).value;
  }

  private onPickCenter(e: Event): void {
    this.centerId = (e.target as HTMLSelectElement).value;
  }

  private renderTabs() {
    return html`
      <div class="tabs">
        <button class=${this.activeTab === "plain-language" ? "active" : ""} @click=${() => (this.activeTab = "plain-language")}>
          Plain Language
        </button>
        <button class=${this.activeTab === "flowchart" ? "active" : ""} @click=${() => (this.activeTab = "flowchart")}>
          Flowchart
        </button>
        <button class=${this.activeTab === "dependency-graph" ? "active" : ""} @click=${() => (this.activeTab = "dependency-graph")}>
          Dependency Graph
        </button>
        <button class=${this.activeTab === "audit" ? "active" : ""} @click=${() => (this.activeTab = "audit")}>
          Audit
        </button>
      </div>
    `;
  }

  private renderFlowchartTab(atlas: Atlas) {
    const eligible = atlas.automations.filter((a) => !a.configUnavailable && !a.isBlueprintInstance);
    const currentId = this.flowchartEntityId ?? eligible[0]?.entityId;
    const ir = eligible.find((a) => a.entityId === currentId);
    return html`
      <select .value=${currentId ?? ""} @change=${this.onPickFlowchartAutomation}>
        ${eligible.map((a) => html`<option value=${a.entityId}>${a.alias}</option>`)}
      </select>
      ${ir
        ? html`<atlas-flowchart-view .ir=${ir} .names=${this.names} .hass=${this.hass}></atlas-flowchart-view>`
        : html`<div class="status">No automations available to diagram.</div>`}
    `;
  }

  private renderDependencyGraphTab(atlas: Atlas) {
    const eligible = atlas.automations.filter((a) => !a.configUnavailable && !a.isBlueprintInstance);
    const currentId = this.centerId ?? eligible[0]?.entityId;
    const currentIsListed = eligible.some((a) => a.entityId === currentId);

    if (!currentId) {
      return html`<div class="status">No automations available to graph.</div>`;
    }

    return html`
      ${currentIsListed
        ? html`
            <select .value=${currentId} @change=${this.onPickCenter}>
              ${eligible.map((a) => html`<option value=${a.entityId}>${a.alias}</option>`)}
            </select>
          `
        : html`
            <div class="status">
              Centered on: <strong>${this.names(currentId) ?? currentId}</strong>
              <a href="#" @click=${(e: Event) => { e.preventDefault(); this.centerId = eligible[0]?.entityId; }}>
                Back to automation list
              </a>
            </div>
          `}
      <atlas-ego-graph-view .centerId=${currentId} .atlas=${atlas} .names=${this.names}></atlas-ego-graph-view>
    `;
  }

  private renderAuditTab() {
    return html`
      <atlas-audit-view
        .findings=${this.auditFindings}
        .atlas=${this.load.status === "ready" ? this.load.atlas : undefined}
      ></atlas-audit-view>
    `;
  }

  protected render() {
    return html`
      <div class="topbar">
        <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
        <h1>Automation Atlas</h1>
        <button class="refresh" @click=${() => this.loadAtlas()}>Refresh</button>
      </div>
      ${this.renderTabs()}
      ${this.load.status === "loading"
        ? html`<div class="status">Loading automations…</div>`
        : this.load.status === "error"
          ? html`<div class="status error">Couldn't load automations: ${this.load.message}</div>`
          : html`
              <div @view-flowchart=${this.onViewFlowchart} @view-dependency-graph=${this.onViewDependencyGraph} @recenter=${this.onRecenter} style="display: contents">
                ${this.activeTab === "plain-language"
                  ? html`<atlas-plain-language-view .atlas=${this.load.atlas} .names=${this.names}></atlas-plain-language-view>`
                  : this.activeTab === "flowchart"
                    ? this.renderFlowchartTab(this.load.atlas)
                    : this.activeTab === "dependency-graph"
                      ? this.renderDependencyGraphTab(this.load.atlas)
                      : this.renderAuditTab()}
              </div>
            `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "automation-atlas-panel": AutomationAtlasPanel;
  }
}
