/** Framework-independent SVG geometry. Attribute names use SVG spelling. */
export type IconNode = {
  readonly tag: "g" | "path" | "circle" | "ellipse" | "line" | "polyline" | "polygon" | "rect";
  readonly attrs: Readonly<Record<string, string>>;
  readonly children?: readonly IconNode[];
};

/** Tabler geometry uses a 0 0 24 24 viewBox and currentColor. */
export type IconPaths = readonly IconNode[];
