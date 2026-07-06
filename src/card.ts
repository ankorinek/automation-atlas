import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

interface HomeAssistant {
  [key: string]: unknown;
}

@customElement("automation-atlas-card")
export class AutomationAtlasCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  setConfig(_config: Record<string, unknown>): void {
    // Lovelace card config placeholder — populated in Phase 4.
  }

  protected render() {
    return html`<ha-card header="Automation Atlas">Coming soon.</ha-card>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "automation-atlas-card": AutomationAtlasCard;
  }
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "automation-atlas-card",
  name: "Automation Atlas",
  description: "Plain-language view of your automations.",
});
