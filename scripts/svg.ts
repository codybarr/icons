import { DOMParser, type Element, type Node } from "@xmldom/xmldom";
import type { IconNode, IconPaths } from "../src/core.ts";

export type IconStyle = "outline" | "filled";
const reserved = new Set(["default", "delete", "switch", "function", "class", "new", "return", "var", "const", "let", "import", "export", "in", "instanceof", "typeof", "void", "with", "yield", "await", "enum", "implements", "interface", "package", "private", "protected", "public", "static", "super", "this", "throw", "try", "catch", "finally", "break", "case", "continue", "debugger", "do", "else", "extends", "for", "if", "while", "null", "true", "false"]);
export function exportName(name: string, style: IconStyle): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`Invalid icon name: ${name}`);
  let result = name.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase()) + (style === "filled" ? "Filled" : "");
  if (/^\d/.test(result) || reserved.has(result)) result = `icon${result[0]!.toUpperCase()}${result.slice(1)}`;
  return result;
}
export function componentName(name: string, style: IconStyle): string {
  exportName(name, style); // Validate names before constructing an identifier.
  return `Icon${name.split("-").map(part => part[0]!.toUpperCase() + part.slice(1)).join("")}${style === "filled" ? "Filled" : ""}`;
}
const tags = new Set(["g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect"]);
const attrs = new Set(["xmlns", "width", "height", "viewBox", "class", "d", "fill", "fill-rule", "clip-rule", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "fill-opacity", "opacity", "transform", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "x2", "y1", "y2", "points"]);
function attributes(element: Element): Record<string, string> {
  return Object.fromEntries(Array.from(element.attributes).map(attr => {
    if (!attrs.has(attr.name) || /url\s*\(/i.test(attr.value)) throw new Error(`Unsupported SVG attribute: ${attr.name}`);
    return [attr.name, attr.value];
  }));
}
export function parseSvg(svg: string): IconPaths {
  if (/<!DOCTYPE|<!ENTITY/i.test(svg)) throw new Error("SVG declarations are not supported");
  const document = new DOMParser({ onError: (level, message) => { throw new Error(`Invalid SVG (${level}): ${message}`); } }).parseFromString(svg, "image/svg+xml");
  const root = document.documentElement;
  if (!root || root.tagName !== "svg") throw new Error("Expected an SVG root");
  const defaults = attributes(root);
  if (defaults.viewBox !== "0 0 24 24") throw new Error("Expected a 24 × 24 viewBox");
  for (const key of ["xmlns", "width", "height", "viewBox", "class"]) delete defaults[key];
  function convert(node: Node, inherited: Record<string, string> = {}): IconNode[] {
    if (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent?.trim())) return [];
    if (node.nodeType !== 1) throw new Error("Unexpected SVG content");
    const element = node as Element;
    if (!tags.has(element.tagName)) throw new Error(`Unsupported SVG element: ${element.tagName}`);
    const children = Array.from(element.childNodes).flatMap(child => convert(child));
    return [{ tag: element.tagName as IconNode["tag"], attrs: { ...inherited, ...attributes(element) }, ...(children.length ? { children } : {}) }];
  }
  const paths = Array.from(root.childNodes).flatMap(node => convert(node, defaults));
  if (!paths.length) throw new Error("Empty SVG");
  return paths;
}
export function convertSvg(svg: string, name: string, style: IconStyle): string {
  return `// Generated from Tabler SVGs. Do not edit.\nimport type { IconPaths } from "../../../src/core.ts";\nexport const ${exportName(name, style)}: IconPaths = ${JSON.stringify(parseSvg(svg))};\n`;
}
export function remixSource(name: string, style: IconStyle): string {
  const data = exportName(name, style);
  return `// Generated from Tabler SVGs. Do not edit.\nimport { ${data} } from "../../core/tabler/${data}.ts";\nimport { tablerIcon } from "../../../src/remix.ts";\nexport const ${componentName(name, style)} = /* @__PURE__ */ tablerIcon(${data}, ${JSON.stringify(name)}, ${JSON.stringify(style)});\n`;
}
