import { LitElement, css, html, svg, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { buildFlowchartGraph } from "../diagram/build-graph.js";
import { layoutFlowchart, type LaidOutGraph, type PositionedEdge, type PositionedNode } from "../diagram/layout.js";
import { buildTraceOverlay, isEdgeTaken, isNodeExecuted, type TraceOverlay } from "../diagram/trace-overlay.js";
import { fetchLatestAutomationTrace } from "../ha/fetch.js";
import type { HomeAssistant } from "../ha/types.js";
import type { AutomationIR } from "../ir/schema.js";
import { noNames, type NameResolver } from "../prose/humanize.js";
import { inlineMarkup } from "./inline-markup.js";
import { renderEdgeLabel } from "./svg-edge-label.js";

const COLORS = {
  trigger: { fill: "#e3f2fd", stroke: "#1976d2" },
  condition: { fill: "#fff3e0", stroke: "#f57c00" },
  decision: { fill: "#fff3e0", stroke: "#f57c00" },
  fork: { fill: "#f3e5f5", stroke: "#8e24aa" },
  action: { fill: "#ffffff", stroke: "#666666" },
  terminal: { fill: "#eeeeee", stroke: "#999999" },
  join: { fill: "#999999", stroke: "#999999" },
  text: "#212121",
  edge: "#888888",
  executedStroke: "#2e7d32",
  executedFill: "#c8e6c9",
  dimOpacity: "0.35",
  selectedStroke: "#0288d1",
  labelFill: "var(--card-background-color, #fff)",
  labelText: "var(--primary-text-color, #333)",
};

@customElement("atlas-flowchart-view")
export class AtlasFlowchartView extends LitElement {
  @property({ attribute: false }) ir!: AutomationIR;
  @property({ attribute: false }) names: NameResolver = noNames;
  @property({ attribute: false }) hass?: HomeAssistant;

  @state() private laidOut?: LaidOutGraph;
  @state() private layoutState: "loading" | "ready" | "error" = "loading";
  @state() private overlay?: TraceOverlay;
  @state() private traceState: "idle" | "loading" | "loaded" | "none" | "error" = "idle";
  @state() private selectedNode?: PositionedNode;

  static styles = css`
    :host {
      display: block;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    button {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 0.85em;
      color: var(--primary-text-color);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .status {
      color: var(--secondary-text-color);
      padding: 8px 0;
    }
    .status.error {
      color: var(--error-color, #b00020);
    }
    .canvas {
      overflow: auto;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      max-height: 70vh;
    }
    svg text {
      font-family: sans-serif;
      font-size: 11px;
    }
    .node {
      cursor: pointer;
    }
    .detail-panel {
      margin-top: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      overflow-wrap: anywhere;
      color: var(--primary-text-color);
    }
    .detail-panel pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.75em;
      margin-top: 8px;
    }
    code {
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      padding: 0 4px;
    }
  `;

  protected async willUpdate(changed: PropertyValues): Promise<void> {
    if (changed.has("ir") && this.ir) {
      this.layoutState = "loading";
      this.overlay = undefined;
      this.traceState = "idle";
      this.selectedNode = undefined;
      try {
        const graph = buildFlowchartGraph(this.ir, this.names);
        this.laidOut = await layoutFlowchart(graph);
        this.layoutState = "ready";
      } catch {
        this.layoutState = "error";
      }
    }
  }

  private async loadTrace(): Promise<void> {
    if (!this.hass) return;
    this.traceState = "loading";
    try {
      const trace = await fetchLatestAutomationTrace(this.hass, this.ir.id);
      if (!trace) {
        this.traceState = "none";
        return;
      }
      this.overlay = buildTraceOverlay(this.ir, trace);
      this.traceState = "loaded";
    } catch {
      this.traceState = "error";
    }
  }

  private clearTrace(): void {
    this.overlay = undefined;
    this.traceState = "idle";
  }

  private onNodeClick(node: PositionedNode): void {
    this.selectedNode = this.selectedNode?.id === node.id ? undefined : node;
  }

  private nodeColors(node: PositionedNode): { fill: string; stroke: string; opacity: string } {
    const base = COLORS[node.kind] ?? COLORS.action;
    if (!this.overlay) return { fill: base.fill, stroke: base.stroke, opacity: "1" };
    const executed = isNodeExecuted(node, this.overlay);
    return executed
      ? { fill: COLORS.executedFill, stroke: COLORS.executedStroke, opacity: "1" }
      : { fill: base.fill, stroke: base.stroke, opacity: COLORS.dimOpacity };
  }

  private renderNodeShape(node: PositionedNode) {
    const { x, y, width, height, kind } = node;
    const { fill, stroke, opacity } = this.nodeColors(node);
    const strokeWidth = this.selectedNode?.id === node.id ? 3 : 1.5;
    const finalStroke = this.selectedNode?.id === node.id ? COLORS.selectedStroke : stroke;
    if (kind === "join") {
      return svg`<circle cx=${x + width / 2} cy=${y + height / 2} r=${width / 2} fill=${fill} opacity=${opacity} />`;
    }
    if (kind === "decision" || kind === "condition") {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const points = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
      return svg`<polygon points=${points} fill=${fill} stroke=${finalStroke} stroke-width=${strokeWidth} opacity=${opacity} />`;
    }
    if (kind === "trigger") {
      return svg`<rect x=${x} y=${y} width=${width} height=${height} rx=${height / 2} ry=${height / 2} fill=${fill} stroke=${finalStroke} stroke-width=${strokeWidth} opacity=${opacity} />`;
    }
    if (kind === "terminal") {
      return svg`<rect x=${x} y=${y} width=${width} height=${height} rx="6" ry="6" fill=${fill} stroke=${finalStroke} stroke-width=${strokeWidth} stroke-dasharray="4 3" opacity=${opacity} />`;
    }
    return svg`<rect x=${x} y=${y} width=${width} height=${height} rx="4" ry="4" fill=${fill} stroke=${finalStroke} stroke-width=${strokeWidth} opacity=${opacity} />`;
  }

  private renderNode(node: PositionedNode) {
    const lineHeight = 13;
    const startY = node.y + node.height / 2 - ((node.lines.length - 1) * lineHeight) / 2;
    return svg`
      <g class="node" @click=${() => this.onNodeClick(node)}>
        ${this.renderNodeShape(node)}
        ${node.lines.map(
          (line, i) =>
            svg`<text x=${node.x + node.width / 2} y=${startY + i * lineHeight} text-anchor="middle" dominant-baseline="middle" fill=${COLORS.text}>${line}</text>`,
        )}
      </g>
    `;
  }

  private renderEdge(edge: PositionedEdge) {
    if (!edge.points.length) return svg``;
    const d = edge.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const taken = this.overlay ? isEdgeTaken(edge, this.overlay) : false;
    const stroke = this.overlay ? (taken ? COLORS.executedStroke : COLORS.edge) : COLORS.edge;
    const opacity = this.overlay && !taken ? COLORS.dimOpacity : "1";
    const strokeWidth = taken ? 2.5 : 1.5;
    return svg`
      <g opacity=${opacity}>
        <path d=${d} fill="none" stroke=${stroke} stroke-width=${strokeWidth} marker-end="url(#arrow)" />
        ${renderEdgeLabel(edge.label, stroke, COLORS.labelFill, COLORS.labelText)}
      </g>
    `;
  }

  private getSvgElement(): SVGSVGElement | null {
    return this.renderRoot.querySelector("svg");
  }

  private async copyAsSvg(): Promise<void> {
    const svgEl = this.getSvgElement();
    if (!svgEl) return;
    const serialized = new XMLSerializer().serializeToString(svgEl);
    await navigator.clipboard.writeText(serialized);
  }

  private downloadPng(): void {
    const svgEl = this.getSvgElement();
    if (!svgEl || !this.laidOut) return;
    const serialized = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = this.laidOut!.width * scale;
      canvas.height = this.laidOut!.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${this.ir.alias.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  }

  private renderDetailPanel() {
    if (!this.selectedNode) return "";
    const text = this.selectedNode.lines.join(" ");
    return html`
      <div class="detail-panel">
        <div>${inlineMarkup(text)}</div>
        ${this.selectedNode.source
          ? html`<pre>${JSON.stringify(this.selectedNode.source, null, 2)}</pre>`
          : ""}
        <button @click=${() => (this.selectedNode = undefined)}>Close</button>
      </div>
    `;
  }

  protected render() {
    if (this.layoutState === "loading") return html`<div class="status">Laying out flowchart…</div>`;
    if (this.layoutState === "error" || !this.laidOut) {
      return html`<div class="status error">Couldn't lay out this automation's flowchart.</div>`;
    }
    return html`
      <div class="toolbar">
        <button @click=${() => this.loadTrace()} ?disabled=${!this.hass || this.traceState === "loading"}>
          ${this.traceState === "loading" ? "Loading trace…" : "Overlay last trace"}
        </button>
        ${this.overlay ? html`<button @click=${() => this.clearTrace()}>Clear overlay</button>` : ""}
        <button @click=${() => this.copyAsSvg()}>Copy as SVG</button>
        <button @click=${() => this.downloadPng()}>Download PNG</button>
      </div>
      ${this.traceState === "none" ? html`<div class="status">No trace recorded yet for this automation.</div>` : ""}
      ${this.traceState === "error" ? html`<div class="status error">Couldn't load the last trace.</div>` : ""}
      <div class="canvas">
        <svg viewBox="0 0 ${this.laidOut.width} ${this.laidOut.height}" width=${this.laidOut.width} height=${this.laidOut.height}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill=${COLORS.edge} />
            </marker>
          </defs>
          ${this.laidOut.edges.map((e) => this.renderEdge(e))}
          ${this.laidOut.nodes.map((n) => this.renderNode(n))}
        </svg>
      </div>
      ${this.renderDetailPanel()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "atlas-flowchart-view": AtlasFlowchartView;
  }
}
