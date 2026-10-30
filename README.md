# @nosweat/icons

Tree-shakable SVG geometry, with optional native **Remix 3.1** components. Tabler is the first icon collection; library names are explicit so more can be added later.

```sh
bun add @nosweat/icons
```

## Core: bring your own renderer

```ts
import { heart, clock, heartFilled } from "@nosweat/icons/core/tabler";
import type { IconPaths, IconNode } from "@nosweat/icons/core";
```

Each icon is a readonly array of `{ tag, attrs, children? }`. Attribute names use SVG spelling, including `stroke-width`. SVG primitives such as circles, lines, and rectangles are preserved, not converted to paths. Root presentation attributes are applied to top-level nodes, so both outline and filled icons render correctly.

For example, a framework-independent DOM wrapper:

```ts
import type { IconNode, IconPaths } from "@nosweat/icons/core";

const NS = "http://www.w3.org/2000/svg";
function renderNode(node: IconNode): SVGElement {
  const element = document.createElementNS(NS, node.tag);
  for (const [name, value] of Object.entries(node.attrs)) {
    element.setAttribute(name, value);
  }
  for (const child of node.children ?? []) element.append(renderNode(child));
  return element;
}

export function Icon(paths: IconPaths, size = 24) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.append(...paths.map(renderNode));
  return svg;
}
```

Set CSS `color` on the SVG to control `currentColor`. For meaningful icons, supply an accessible name and remove `aria-hidden`. Treat exported arrays as immutable. No framework or runtime dependency is loaded by core imports.

Names are camelCase, with a `Filled` suffix: `arrowUpRight`, `heartFilled`. Names starting with digits or reserved JavaScript words use an `icon` prefix (`icon123`, `iconPackage`). Individual imports are also available at `@nosweat/icons/core/tabler/heart`.

## Remix 3.1

```sh
bun add remix@3.1
```

Configure TypeScript with `"jsx": "react-jsx"` and `"jsxImportSource": "remix/component"`.

```tsx
import { IconHeart, IconClock, IconHeartFilled } from "@nosweat/icons/remix/tabler";

export function Example() {
  return () => (
    <IconHeart size={24} strokeWidth={1.5} color="crimson" title="Favorite" />
  );
}
```

Native render closures read current props on every render. Components accept SVG props plus `size` (default 24), `strokeWidth`, and `title`. Decorative icons are hidden from assistive technology; `title`, `aria-label`, or `aria-labelledby` makes them accessible. These are Remix components, not React components. Remix is an optional peer dependency and is only needed for the Remix subpath.

Individual components: `@nosweat/icons/remix/tabler/IconHeart`. Generated components share the core geometry. ESM modules and `sideEffects: false` let bundlers discard unused icons.

## Development

```sh
bun install
bun run generate                     # latest stable Tabler release
bun run generate --version v3.50.0    # reproducible, explicit upstream release
bun test
bun run test:package                  # declarations + ESM + tree-shaking checks
bun check
bun run dev                          # http://127.0.0.1:3000
```

The generator downloads raw SVGs directly from Tabler's tagged GitHub archive using Bun, validates them, preserves Tabler's MIT license, and writes a versioned manifest. Generation uses a staging directory so failures do not destroy the last successful output. Set `GITHUB_TOKEN` if needed for GitHub API rate limits. Generated sources are ignored; generate before building or packing the npm package.

## Cloudflare

```sh
bun run build:website
bun run dev:worker
bun run deploy
```

The gallery includes search, style filters, pagination, previews, dark mode, and copyable Core/Remix imports. The website build prerenders SVG assets; the Cloudflare Worker needs neither Bun nor Remix at runtime. `wrangler.jsonc` uses the `nosweat-icons` Worker and an `ASSETS` binding. Deployment requires your Cloudflare credentials. No deployment or npm publication is performed automatically.

Tabler icon artwork is MIT licensed: https://github.com/tabler/tabler-icons. The upstream license is included as `dist/TABLER-LICENSE` in the package and served with the gallery.
