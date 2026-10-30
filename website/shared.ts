export type IconStyle = "outline" | "filled";
export type StyleFilter = IconStyle | "all";
export type IconRecord = { name: string; component: string; exportName?: string; style: IconStyle };
export type SearchResults = {
  icons: IconRecord[];
  total: number;
  page: number;
  pages: number;
  counts: { outline: number; filled: number };
  version: string;
};

export const PAGE_SIZE = 72;
export const packageName = "@nosweat/icons";
export const installCommands = {
  npm: `npm install ${packageName}`,
  pnpm: `pnpm add ${packageName}`,
  bun: `bun add ${packageName}`,
};

export function iconImport(icon: IconRecord) {
  const value = icon.component.slice(4);
  const name = icon.exportName ?? value[0]!.toLowerCase() + value.slice(1);
  return `import { createElement, type Handle, type Props, type RemixElement } from "remix/component";
import type { IconNode, IconPaths } from "${packageName}/core";
import { ${name} as selectedPaths } from "${packageName}/core/tabler";

// Your design system's spacing scale — not fixed pixel sizes.
const space = { 2: "0.5rem", 4: "1rem", 6: "1.5rem", 8: "2rem" } as const;

type IconProps = Omit<Props<"svg">, "children" | "innerHTML" | "size" | "width" | "height"> & {
  paths: IconPaths;
  size?: keyof typeof space;
};

function renderNode(node: IconNode): RemixElement {
  return createElement(node.tag, { ...node.attrs },
    ...(node.children ?? []).map(renderNode));
}

export function Icon(handle: Handle<IconProps>) {
  return () => {
    const { paths, size = 6, ...props } = handle.props;
    return (
      <svg
        viewBox="0 0 24 24"
        width={space[size]}
        height={space[size]}
        aria-hidden={props["aria-label"] || props["aria-labelledby"] ? undefined : "true"}
        {...props}
      >
        {paths.map(renderNode)}
      </svg>
    );
  };
}

export function Example() {
  return () => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}>
      <Icon paths={selectedPaths} size={6} style={{ color: "crimson" }} />
      Favorite
    </span>
  );
}`;
}

export function iconExample(icon: IconRecord) {
  return `import { ${icon.component} } from "${packageName}/remix/tabler";\n\nexport function Example() {\n  return () => (\n    <${icon.component}\n      size={24}\n      color="currentColor"\n      title="${icon.name.replaceAll("-", " ")}"\n    />\n  );\n}`;
}
