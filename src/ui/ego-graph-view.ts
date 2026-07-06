import { LitElement, css, html, svg, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { buildEgoGraph, type EgoEdge, type EgoNode } from "../graph/build-ego-graph.js";
import { layoutGraph, type LaidOutGraphOf } from "../diagram/layout.js";
import type { Atlas } from "../ir/schema.js";
import { noNames, type NameResolver } from "../prose/humanize.js";
import { renderEdgeLabel } from "./svg-edge-label.js";

type EgoLaidOut = LaidOutGraphOf<EgoNode, EgoEdge>;
type PositionedEgoNode = EgoLaidOut["nodes"][number];
type PositionedEgoEdge = EgoLaidOut["edges"][number];

const EGO_COLORS = {
  automation: { fill: "#e3f2fd", stroke: "#1976d2" },
  entity: { fill: "#e8f5e9", stroke: "#388e3c" },
  text: "#212121",
  edge: "#888888",
  centerStroke: "#0288d1",
  labelFill: "var(--card-background-color, #fff)",
  labelText: "var(--primary-text-color, #333)",
};

@customElement("atlas-ego-graph-view")
export class AtlasEgoGraphView extends LitElement {
  @property({ attribute: false }) centerId!: string;
  @property({ attribute: false }) atlas!: Atlas;
  @property({ attribute: false }) names: NameResolver = noNames;

  @state() private laidOut?: EgoLaidOut;
  @state() private layoutState: "loading" | "ready" | "error" = "loading";

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
  `;

  protected async willUpdate(changed: PropertyValues): Promise<void> {
    if ((changed.has("centerId") || changed.has("atlas")) && this.centerId && this.atlas) {
      this.layoutState = "loading";
      try {
        const graph = buildEgoGraph(this.centerId, this.atlas, this.names);
        this.laidOut = await layoutGraph(graph.nodes, graph.edges);
        this.layoutState = "ready";
      } catch {
        this.layoutState = "error";
      }
    }
  }

  private onNodeClick(node: PositionedEgoNode): void {
    if (node.isCenter) return;
    this.dispatchEvent(new CustomEvent("recenter", { detail: { id: node.id }, bubbles: true, composed: true }));
  }

  private renderNode(node: PositionedEgoNode) {
    const { x, y, width, height } = node;
    const palette = EGO_COLORS[node.kind];
    const strokeWidth = node.isCenter ? 3 : 1.5;
    const stroke = node.isCenter ? EGO_COLORS.centerStroke : palette.stroke;
    const lineHeight = 13;
    const startY = y + height / 2 - ((node.lines.length - 1) * lineHeight) / 2;
    return svg`
      <g class="node" @click=${() => this.onNodeClick(node)}>
        <rect x=${x} y=${y} width=${width} height=${height} rx="8" ry="8" fill=${palette.fill} stroke=${stroke} stroke-width=${strokeWidth} />
        ${node.lines.map(
          (line, i) =>
            svg`<text x=${x + width / 2} y=${startY + i * lineHeight} text-anchor="middle" dominant-baseline="middle" fill=${EGO_COLORS.text}>${line}</text>`,
        )}
      </g>
    `;
  }

  private renderEdge(edge: PositionedEgoEdge) {
    if (!edge.points.length) return svg``;
    const d = edge.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const dash = edge.heuristic ? "4 3" : undefined;
    return svg`
      <g>
        <path d=${d} fill="none" stroke=${EGO_COLORS.edge} stroke-width="1.5" stroke-dasharray=${dash} marker-end="url(#arrow)" />
        ${renderEdgeLabel(edge.label, EGO_COLORS.edge, EGO_COLORS.labelFill, EGO_COLORS.labelText)}
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
        a.download = `${(this.names(this.centerId) ?? this.centerId).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-graph.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  }

  protected render() {
    if (this.layoutState === "loading") return html`<div class="status">Laying out graph…</div>`;
    if (this.layoutState === "error" || !this.laidOut) {
      return html`<div class="status error">Couldn't lay out this graph.</div>`;
    }
    return html`
      <div class="toolbar">
        <button @click=${() => this.copyAsSvg()}>Copy as SVG</button>
        <button @click=${() => this.downloadPng()}>Download PNG</button>
      </div>
      <div class="canvas">
        <svg viewBox="0 0 ${this.laidOut.width} ${this.laidOut.height}" width=${this.laidOut.width} height=${this.laidOut.height}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill=${EGO_COLORS.edge} />
            </marker>
          </defs>
          ${this.laidOut.edges.map((e) => this.renderEdge(e))}
          ${this.laidOut.nodes.map((n) => this.renderNode(n))}
        </svg>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "atlas-ego-graph-view": AtlasEgoGraphView;
  }
}
