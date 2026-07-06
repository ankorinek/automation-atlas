// Shared edge-label rendering for graph views (flowchart, ego-graph): a bordered box + multi-line
// text positioned at ELK's own computed label placement. Pulled out as a standalone function
// (not a method on any one view) so a future overflow/contrast fix lands once for every graph
// view that renders edge labels, not once per view.
import { svg, type SVGTemplateResult } from "lit";
import type { PositionedEdgeLabel } from "../diagram/layout.js";

const LABEL_LINE_HEIGHT = 13;

export function renderEdgeLabel(
  label: PositionedEdgeLabel | undefined,
  strokeColor: string,
  fillColor = "var(--card-background-color, #fff)",
  textColor = "var(--primary-text-color, #333)",
): SVGTemplateResult | "" {
  if (!label) return "";
  const textStartY = label.y + LABEL_LINE_HEIGHT * 0.8 + (label.height - label.lines.length * LABEL_LINE_HEIGHT) / 2;
  return svg`
    <g>
      <rect
        x=${label.x}
        y=${label.y}
        width=${label.width}
        height=${label.height}
        rx="3"
        ry="3"
        fill=${fillColor}
        stroke=${strokeColor}
        stroke-width="1"
      />
      ${label.lines.map(
        (line, i) =>
          svg`<text
            x=${label.x + label.width / 2}
            y=${textStartY + i * LABEL_LINE_HEIGHT}
            text-anchor="middle"
            font-family="sans-serif"
            font-size="10px"
            font-weight="500"
            fill=${textColor}
          >${line}</text>`,
      )}
    </g>
  `;
}
