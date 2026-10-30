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

With [mise](https://mise.jdx.dev/) installed, use Pitchfork to manage the dev website in the background:

```sh
mise trust
mise install
mise run start                       # http://127.0.0.1:4311 (waits for readiness)
mise run status
mise run logs                        # Ctrl-C leaves the website running
mise run restart
mise run stop
```

`start` and `restart` install dependencies and generate icons if missing. `mise run dev` runs the foreground hot-reload server on port 3000. Pitchfork uses a directory-derived namespace so stopping this checkout does not stop other projects. Local overrides can go in `mise.local.toml` and `pitchfork.local.toml` (both ignored by Git).

The generator downloads raw SVGs directly from Tabler's tagged GitHub archive using Bun, validates them, preserves Tabler's MIT license, and writes a versioned manifest. Generation uses a staging directory so failures do not destroy the last successful output. Set `GITHUB_TOKEN` if needed for GitHub API rate limits. Generated sources are ignored; generate before building or packing the npm package.

## npm releases

Publishing a GitHub Release runs `.github/workflows/release.yml` to generate icons, run tests and type checks, build and pack **@nosweat/icons**, and publish the validated tarball to npm. The tarball is also retained as a GitHub Actions artifact. Draft releases and tag pushes alone do not publish.

The same workflow checks for newer stable vendor releases nightly at **03:23 UTC** (or via **Run workflow**). Currently it checks Tabler against `vendors.json`. When a newer version is found, it bumps the package patch version, validates the updated icons, commits `vendors.json` and `package.json` to the default branch, tags and creates a GitHub Release, and publishes to npm in the same run. No update means no commit or publication; older upstream versions never cause downgrades. The default branch must allow pushes by `github-actions[bot]`; protected-branch rules may need an explicit allowance. Automated updates refuse to bump a prerelease package version.

One-time setup:

1. Ensure your npm account can publish to the `@nosweat` scope. If the package does not exist yet, publish its initial version manually first; npm requires an existing package to configure a trusted publisher.
2. On npm, open **@nosweat/icons → Settings → Trusted Publisher** and select **GitHub Actions**. Set organization/user to **`codybarr`**, repository to **`icons`**, and workflow filename to **`release.yml`**. Leave the environment field empty (the workflow does not use a GitHub environment).
3. Keep the GitHub repository public for npm provenance. The package's `repository` URL must match this repository.

No `NPM_TOKEN` secret is needed. The job receives `id-token: write` permission and authenticates to npm using GitHub OIDC. Bun handles dependencies, builds, and packing; the publish step uses `bunx npm@11` for trusted publishing and provenance support.

For each release:

1. Update `version` in `package.json` and commit it.
2. Create a tag matching that version exactly (for example, `v0.1.0`) and publish a GitHub Release for the tag.
3. Check the **Publish npm package** Actions run. Stable releases publish to `latest`; prerelease versions (for example, `0.2.0-beta.1`) must be marked as GitHub prereleases and publish to `next`.

The workflow rejects mismatched tags and prerelease flags. npm versions are immutable: use a new version for changes to an already published package. Release builds read the Tabler pin from `vendors.json`; nightly updates advance that pin automatically. Bun is pinned to the version in `mise.toml`.

If publication fails after an automated commit/release, fix the cause and rerun the failed Actions jobs. The next nightly check will not republish an unchanged vendor version. GitHub Releases created with `GITHUB_TOKEN` do not trigger another workflow run, so automated updates publish in their originating run.

To create a package locally without publishing:

```sh
bun run generate --version v3.50.0
bun test
bun run test:package
bun check
bun pm pack --ignore-scripts         # writes nosweat-icons-<version>.tgz
```

## Cloudflare

```sh
bun run build:website
bun run dev:worker
bun run deploy
```

The gallery includes search, style filters, pagination, previews, dark mode, and copyable Core/Remix imports. The website build prerenders SVG assets; the Cloudflare Worker needs neither Bun nor Remix at runtime. `wrangler.jsonc` uses the `nosweat-icons` Worker and an `ASSETS` binding. Deployment requires your Cloudflare credentials. Website deployment is manual; npm publication runs for published GitHub Releases and validated nightly vendor updates.

Tabler icon artwork is MIT licensed: https://github.com/tabler/tabler-icons. The upstream license is included as `dist/TABLER-LICENSE` in the package and served with the gallery.
