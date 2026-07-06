// ELK layout — dynamically imported (see loadElk below) so elkjs (~1.5MB+) never lands in the
// Plain Language tab's bundle; it's fetched only when a Flowchart/Graph view actually opens.
//
// `layoutGraph` is generic so both the per-automation flowchart (build-graph.ts's FlowNode/FlowEdge)
// and the entity/automation ego-graph (build-ego-graph.ts's EgoNode/EgoEdge) share one ELK
// pipeline — same text measurement, same edge-label sizing/placement, same lazy-import chunk.
import type { ElkExtendedEdge, ElkNode as ElkNodeShape } from "elkjs/lib/elk-api.js";
import type { FlowchartGraph, FlowNode } from "./build-graph.js";

export interface GraphNodeInput {
  id: string;
  lines: string[];
}

export interface GraphEdgeInput {
  id: string;
  source: string;
  target: string;
  label?: string[];
}

export interface PositionedNode extends FlowNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PositionedEdgeLabel {
  lines: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
  label?: PositionedEdgeLabel;
  points: Point[];
}

export interface LaidOutGraph {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
}

export interface LaidOutGraphOf<N extends GraphNodeInput, E extends GraphEdgeInput> {
  nodes: (N & { x: number; y: number; width: number; height: number })[];
  edges: (E & { points: Point[]; label?: PositionedEdgeLabel })[];
  width: number;
  height: number;
}

const LINE_HEIGHT = 16;
const PADDING_X = 16;
const PADDING_Y = 10;
const MIN_WIDTH = 90;
const JOIN_SIZE = 14;
export const NODE_FONT_PX = 11;
export const LABEL_FONT_PX = 10;
const LABEL_LINE_HEIGHT = 13;

// Real glyph widths in a proportional sans-serif font vary a lot by character (a "W" is roughly
// 3x an "i"), so a single flat average-char-width estimate reliably overflows the box for
// text skewed toward wide characters. In a browser, measure with a scratch canvas context using
// the exact font the SVG uses; vitest runs in plain Node with no canvas, so fall back to a
// narrow/wide character bucketing that's still far closer than one flat average.
const NARROW_CHARS = new Set("iIl.,:;'|!()[]{}fjt- ".split(""));
const WIDE_CHARS = new Set("mMWw@%&#".split(""));

function estimateCharWidth(ch: string, fontPx: number): number {
  if (NARROW_CHARS.has(ch)) return fontPx * 0.28;
  if (WIDE_CHARS.has(ch)) return fontPx * 0.85;
  if (ch >= "A" && ch <= "Z") return fontPx * 0.68;
  if (ch >= "0" && ch <= "9") return fontPx * 0.55;
  return fontPx * 0.52;
}

function estimateTextWidth(text: string, fontPx: number): number {
  let total = 0;
  for (const ch of text) total += estimateCharWidth(ch, fontPx);
  return total;
}

let measureCtx: CanvasRenderingContext2D | null | undefined;
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  measureCtx = typeof document === "undefined" ? null : (document.createElement("canvas").getContext("2d") ?? null);
  return measureCtx;
}

export function measureTextWidth(text: string, fontPx: number = NODE_FONT_PX): number {
  const ctx = getMeasureCtx();
  if (!ctx) return estimateTextWidth(text, fontPx);
  ctx.font = `${fontPx}px sans-serif`;
  return ctx.measureText(text).width;
}

function widestLine(lines: string[], fontPx: number): number {
  return Math.max(0, ...lines.map((l) => measureTextWidth(l, fontPx)));
}

function nodeSize(node: GraphNodeInput): { width: number; height: number } {
  // The flowchart's synthetic "join" nodes (branch-convergence dots) are a fixed tiny circle;
  // no other graph type currently uses this kind, so the check is a no-op elsewhere.
  if ((node as { kind?: string }).kind === "join") return { width: JOIN_SIZE, height: JOIN_SIZE };
  return {
    width: Math.max(MIN_WIDTH, widestLine(node.lines, NODE_FONT_PX) + PADDING_X * 2),
    height: Math.max(30, node.lines.length * LINE_HEIGHT + PADDING_Y * 2),
  };
}

const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 4;

function edgeLabelSize(lines: string[]): { width: number; height: number } {
  return {
    width: widestLine(lines, LABEL_FONT_PX) + LABEL_PADDING_X * 2,
    height: lines.length * LABEL_LINE_HEIGHT + LABEL_PADDING_Y * 2,
  };
}

let elkModulePromise: Promise<typeof import("elkjs/lib/elk.bundled.js")> | undefined;

/** Lazily loads elkjs. Call this from UI code right before layoutGraph to trigger the code-split fetch. */
function loadElk(): Promise<typeof import("elkjs/lib/elk.bundled.js")> {
  elkModulePromise ??= import("elkjs/lib/elk.bundled.js");
  return elkModulePromise;
}

export async function layoutGraph<N extends GraphNodeInput, E extends GraphEdgeInput>(
  nodes: N[],
  edges: E[],
  options?: { direction?: "RIGHT" | "DOWN" },
): Promise<LaidOutGraphOf<N, E>> {
  const { default: ElkConstructor } = await loadElk();
  const elk = new ElkConstructor();

  const sizeById = new Map(nodes.map((n) => [n.id, nodeSize(n)]));

  const elkGraph: ElkNodeShape = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": options?.direction ?? "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": "50",
      "elk.spacing.nodeNode": "24",
      "elk.spacing.edgeLabel": "6",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.edgeLabels.sideSelection": "SMART",
    },
    children: nodes.map((n) => ({ id: n.id, ...sizeById.get(n.id)! })),
    edges: edges.map((e): ElkExtendedEdge => {
      const labelSize = e.label ? edgeLabelSize(e.label) : undefined;
      return {
        id: e.id,
        sources: [e.source],
        targets: [e.target],
        labels: labelSize ? [{ text: e.label!.join("\n"), ...labelSize }] : undefined,
      };
    }),
  };

  const result = await elk.layout(elkGraph);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const positionedNodes = (result.children ?? []).map((c) => {
    const original = nodeById.get(c.id)!;
    const size = sizeById.get(c.id)!;
    return { ...original, x: c.x ?? 0, y: c.y ?? 0, width: c.width ?? size.width, height: c.height ?? size.height };
  });

  const edgeById = new Map(edges.map((e) => [e.id, e]));
  const positionedEdges = (result.edges ?? []).map((e) => {
    const original = edgeById.get(e.id)!;
    const section = e.sections?.[0];
    const points: Point[] = section ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint] : [];
    const elkLabel = e.labels?.[0];
    const label: PositionedEdgeLabel | undefined =
      original.label && elkLabel
        ? {
            lines: original.label,
            x: elkLabel.x ?? 0,
            y: elkLabel.y ?? 0,
            width: elkLabel.width ?? 0,
            height: elkLabel.height ?? 0,
          }
        : undefined;
    return { ...original, label, points };
  });

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width: result.width ?? 0,
    height: result.height ?? 0,
  };
}

export function layoutFlowchart(graph: FlowchartGraph): Promise<LaidOutGraph> {
  return layoutGraph(graph.nodes, graph.edges) as Promise<LaidOutGraph>;
}
