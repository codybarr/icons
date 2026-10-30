import { createElement, type Handle, type RemixElement } from "remix/component";
import type { IconNode, IconPaths } from "./core.ts";
import type { IconProps } from "./icon.ts";
export type { IconProps } from "./icon.ts";

function renderNode(node: IconNode, strokeWidth?: number | string): RemixElement {
  const attrs = { ...node.attrs };
  if (strokeWidth !== undefined && "stroke-width" in attrs) attrs["stroke-width"] = String(strokeWidth);
  return createElement(node.tag, attrs, ...(node.children ?? []).map(child => renderNode(child, strokeWidth)));
}

/** Native Remix render closures read current props on every render. */
export function tablerIcon(paths: IconPaths, name: string, style: "outline" | "filled") {
  return function Icon(handle: Handle<IconProps>): () => RemixElement {
    return () => {
      const { size = 24, title, strokeWidth, ...props } = handle.props;
      return createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: size, height: size,
        class: `icon icon-tabler icon-tabler-${style} icon-tabler-${name}`,
        "aria-hidden": title || props["aria-label"] || props["aria-labelledby"] ? undefined : "true",
        role: title ? "img" : undefined,
        ...props,
      }, ...(title ? [createElement("title", {}, title)] : []), ...paths.map(node => renderNode(node, strokeWidth)));
    };
  };
}
