import { on, type Handle } from "remix/component";
import { IconArrowRight, IconArrowUpRight, IconPackage } from "../generated/remix/tabler/index.ts";
import { CopyButton } from "./copy-button.tsx";
import { installCommands, packageName } from "./shared.ts";

const coreExample = `import { heart, clock, heartFilled } from "@nosweat/icons/core/tabler";
import type { IconPaths } from "@nosweat/icons/core";

// SVG nodes: { tag, attrs, children? }
// Render inside <svg viewBox="0 0 24 24">.
const paths: IconPaths = heart;`;
const remixExample = `import { IconHeart, IconHeartFilled } from "@nosweat/icons/remix/tabler";

export function Example() {
  return () => (
    <IconHeart size={24} title="Favorite" />
  );
}`;
const jsxConfig = `{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "remix/component"
  }
}`;
const previews = ["Heart", "Clock", "Bolt", "Command", "Cloud", "Star", "Sun", "Code"];
const managers = ["bun", "npm", "pnpm"] as const;
type Manager = typeof managers[number];

function CodeBlock(handle: Handle<{ label: string; code: string }>) {
  return () => <div class="code-panel">
    <div class="code-toolbar"><span>{handle.props.label}</span><CopyButton text={handle.props.code} label={`Copy ${handle.props.label}`} /></div>
    <pre tabIndex={0}><code>{handle.props.code}</code></pre>
  </div>;
}

export function Home(handle: Handle) {
  let manager: Manager = "bun";
  function choose(next: Manager, focus = false) {
    manager = next;
    handle.update();
    if (focus) handle.queueTask(() => document.getElementById(`install-tab-${next}`)?.focus());
  }
  return () => <>
    <section class="intro home-intro">
      <div class="eyebrow"><span class="status-dot" />SVG ICONS / CORE + REMIX</div>
      <h1>@nosweat/icons</h1>
      <p class="intro-copy">Tabler icons, without the framework lock-in.<br />{" "}Use the SVG data directly, or start with native Remix 3.1 components.</p>
      <div class="intro-actions"><a class="button primary" href="/icons">Browse icons<IconArrowRight size={18} /></a><a class="text-link" href="https://www.npmjs.com/package/@nosweat/icons" target="_blank" rel="noreferrer">View on npm<IconArrowUpRight size={16} /></a></div>
    </section>

    <section class="install-section" aria-labelledby="install-heading">
      <div class="section-label"><span class="section-number">01</span><h2 id="install-heading">Install the package</h2></div>
      <div class="install-terminal">
        <div class="terminal-toolbar">
          <div class="tabs" role="tablist" aria-label="Package manager">
            {managers.map(item => <button type="button" id={`install-tab-${item}`} role="tab" aria-selected={manager === item} aria-controls="install-command" tabIndex={manager === item ? 0 : -1}
              mix={[on("click", () => choose(item)), on("keydown", event => {
                const index = managers.indexOf(manager);
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault(); choose(managers[(index + (event.key === "ArrowRight" ? 1 : managers.length - 1)) % managers.length]!, true);
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault(); choose(event.key === "Home" ? managers[0] : managers[managers.length - 1]!, true);
                }
              })]}>{item}</button>)}
          </div><span class="terminal-label">terminal</span>
        </div>
        <div class="command-line" id="install-command" role="tabpanel" aria-labelledby={`install-tab-${manager}`} tabIndex={0}>
          <span class="prompt" aria-hidden="true">$</span><code>{installCommands[manager]}</code><CopyButton text={installCommands[manager]} label="Copy install command" />
        </div>
      </div>
      <div class="install-note"><IconPackage size={16} /><span>{packageName}</span><span class="note-divider">/</span><span>ESM · TypeScript · tree-shakable</span></div>
    </section>

    <section class="usage-section quick-start" aria-labelledby="core-heading">
      <div class="section-label"><span class="section-number">02</span><h2 id="core-heading">Core — your renderer, your rules</h2></div>
      <p class="setup-copy">No runtime dependencies. Each icon is a readonly array of SVG elements and attributes, in a 24 × 24 viewBox. Filled icons use a <code>Filled</code> suffix.</p>
      <CodeBlock label="core.ts" code={coreExample} />
      <p class="setup-copy after-code">Keep your own size tokens, spacing scale, and component API. <a href="/icons?q=heart">Open an icon’s Core data tab for a complete custom Remix wrapper<IconArrowUpRight size={14} /></a>.</p>
    </section>

    <section class="usage-section quick-start" aria-labelledby="remix-heading">
      <div class="section-label"><span class="section-number">03</span><h2 id="remix-heading">Remix — ready-made components</h2></div>
      <p class="setup-copy">For native Remix 3.1, not React. Core-only consumers don’t need Remix. Add it to your app if it isn’t already installed:</p>
      <div class="remix-install command-line"><span class="prompt" aria-hidden="true">$</span><code>{manager === "npm" ? "npm install" : `${manager} add`} remix@3.1</code><CopyButton text={`${manager === "npm" ? "npm install" : `${manager} add`} remix@3.1`} label="Copy Remix install command" /></div>
      <div class="setup-grid"><div><h3>Set the JSX runtime</h3><CodeBlock label="tsconfig.json" code={jsxConfig} /></div><div><h3>Import a component</h3><CodeBlock label="example.tsx" code={remixExample} /></div></div>
      <p class="setup-copy after-code"><code>size</code> defaults to 24. Use <code>title</code> for a meaningful icon; icons without an accessible name are decorative. <code>IconHeartFilled</code> selects the filled version.</p>
    </section>

    <section class="preview-section" aria-labelledby="preview-heading">
      <div class="section-label"><span class="section-number">04</span><h2 id="preview-heading">The Tabler collection</h2><a href="/icons" class="text-link">Browse all<IconArrowUpRight size={16} /></a></div>
      <div class="icon-grid preview-grid">{previews.map(name => <a class="icon-tile" href={`/icons?q=${name.toLowerCase()}`} aria-label={`Browse ${name.toLowerCase()} icons`}><span class="tile-art"><img class="icon-image" src={`/api/icons/Icon${name}`} width={28} height={28} loading="lazy" alt="" /></span><span class="tile-name">{name.toLowerCase()}</span></a>)}</div>
    </section>
  </>;
}
