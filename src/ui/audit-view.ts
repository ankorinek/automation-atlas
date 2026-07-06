import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { AuditFinding, AuditSeverity } from "../audit/rules.js";
import type { Atlas } from "../ir/schema.js";
import { inlineMarkup } from "./inline-markup.js";

const SEVERITY_RANK: Record<AuditSeverity, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_LABEL: Record<AuditSeverity, string> = { error: "Error", warning: "Warning", info: "Info" };

@customElement("atlas-audit-view")
export class AtlasAuditView extends LitElement {
  @property({ attribute: false }) findings: AuditFinding[] = [];
  @property({ attribute: false }) atlas?: Atlas;

  static styles = css`
    :host {
      display: block;
    }
    .summary {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-bottom: 12px;
    }
    .row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .chip {
      flex-shrink: 0;
      font-size: 0.7em;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 10px;
      color: #fff;
    }
    .chip.error {
      background: var(--error-color, #b00020);
    }
    .chip.warning {
      background: var(--warning-color, #ff9800);
    }
    .chip.info {
      background: var(--secondary-text-color, #727272);
    }
    .message {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    a.edit-link {
      color: var(--primary-color);
      text-decoration: none;
      flex-shrink: 0;
      font-size: 0.85em;
    }
    @media (max-width: 480px) {
      .row {
        flex-wrap: wrap;
      }
    }
    .empty {
      color: var(--secondary-text-color);
      padding: 16px 0;
    }
    code {
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      padding: 0 4px;
    }
  `;

  private storageIdFor(entityId: string | undefined): string | undefined {
    if (!entityId || !this.atlas) return undefined;
    return this.atlas.automations.find((a) => a.entityId === entityId)?.id;
  }

  protected render() {
    if (this.findings.length === 0) {
      return html`<div class="empty">No issues found.</div>`;
    }

    const sorted = [...this.findings].sort((a, b) => {
      const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rank !== 0) return rank;
      return (a.automationAlias ?? "").localeCompare(b.automationAlias ?? "");
    });

    const counts = { error: 0, warning: 0, info: 0 };
    for (const f of this.findings) counts[f.severity]++;

    return html`
      <div class="summary">${counts.error} errors, ${counts.warning} warnings, ${counts.info} info</div>
      ${repeat(
        sorted,
        (f) => f.id,
        (f) => {
          const storageId = this.storageIdFor(f.automationEntityId);
          return html`
            <div class="row">
              <span class="chip ${f.severity}">${SEVERITY_LABEL[f.severity]}</span>
              <span class="message">
                ${f.automationAlias ? html`<strong>${f.automationAlias}</strong>: ` : ""}${inlineMarkup(f.message)}
              </span>
              ${storageId
                ? html`<a class="edit-link" href="/config/automation/edit/${storageId}" target="_top">Edit ↗</a>`
                : ""}
            </div>
          `;
        },
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "atlas-audit-view": AtlasAuditView;
  }
}
