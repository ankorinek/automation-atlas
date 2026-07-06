import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { Atlas } from "../ir/schema.js";
import { noNames, type NameResolver } from "../prose/humanize.js";
import "./automation-card.js";

@customElement("atlas-plain-language-view")
export class AtlasPlainLanguageView extends LitElement {
  @property({ attribute: false }) atlas!: Atlas;
  @property({ attribute: false }) names: NameResolver = noNames;
  @state() private search = "";

  static styles = css`
    :host {
      display: block;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }
    input[type="search"] {
      flex: 1;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 1em;
    }
    .count {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin-bottom: 8px;
    }
  `;

  private onSearch(e: Event) {
    this.search = (e.target as HTMLInputElement).value;
  }

  protected render() {
    const query = this.search.trim().toLowerCase();
    const filtered = query
      ? this.atlas.automations.filter((a) => a.alias.toLowerCase().includes(query))
      : this.atlas.automations;

    return html`
      <div class="toolbar">
        <input type="search" placeholder="Search automations…" .value=${this.search} @input=${this.onSearch} />
      </div>
      <div class="count">${filtered.length} of ${this.atlas.automations.length} automations</div>
      ${repeat(
        filtered,
        (a) => a.entityId,
        (a) => html`<atlas-automation-card .automation=${a} .names=${this.names}></atlas-automation-card>`,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "atlas-plain-language-view": AtlasPlainLanguageView;
  }
}
