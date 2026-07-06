import { html, type TemplateResult } from "lit";

/** Splits on backtick-delimited spans (our prose convention for unresolved entity_ids) and renders them as <code>. */
export function inlineMarkup(text: string): (string | TemplateResult)[] {
  const parts = text.split(/`([^`]+)`/g);
  return parts.map((part, i) => (i % 2 === 1 ? html`<code>${part}</code>` : part));
}
