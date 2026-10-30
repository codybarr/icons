import { createRoot, on, ref, type Handle } from "remix/component";
import { IconGridDots, IconSun, IconMoon, IconSearch, IconX, IconArrowRight, IconArrowLeft, IconArrowUpRight } from "../generated/remix/tabler/index.ts";
import { iconExample, iconImport, type IconRecord, type SearchResults, type StyleFilter } from "./shared.ts";

import { CopyButton } from "./copy-button.tsx";
import { Home } from "./home.tsx";
import { iconPath, iconSlug, parseIconRoute, type ExampleTab } from "./icon-route.ts";

function IconTile(handle: Handle<{ icon: IconRecord; select: (icon: IconRecord) => void }>) {
  return () => {
    const { icon, select } = handle.props;
    return <button type="button" class="icon-tile" aria-label={`Preview ${icon.name}, ${icon.style}`} title={`${icon.component} · ${icon.style}`} mix={on("click", () => select(icon))}>
      <span class="tile-art"><img class="icon-image" src={`/api/icons/${icon.component}`} width={28} height={28} loading="lazy" decoding="async" alt="" /></span>
      <span class="tile-name">{icon.name}</span>
      <span class={`style-mark ${icon.style}`} aria-hidden="true" />
    </button>;
  };
}

function IconModal(handle: Handle<{ icon: IconRecord; tab: ExampleTab; changeTab: (tab: ExampleTab) => void; close: () => void }>) {
  let dialog: HTMLDialogElement;
  let size = 96;
  const close = () => { dialog.close(); handle.props.close(); };
  return () => {
    const { icon, tab, changeTab } = handle.props;
    const code = tab === "component" ? iconExample(icon) : iconImport(icon);
    return <dialog class="icon-dialog" aria-labelledby="modal-title" mix={[
      ref(node => { dialog = node as HTMLDialogElement; dialog.showModal(); }),
      on("cancel", event => { event.preventDefault(); close(); }),
      on("click", event => { if (event.target === dialog) close(); }),
    ]}>
      <div class="dialog-content">
        <div class="dialog-heading"><div><span class="eyebrow">{icon.style} / 24 × 24</span><h2 id="modal-title">{icon.name}</h2></div>
          <button type="button" class="icon-button" aria-label="Close icon preview" title="Close" mix={on("click", close)}><IconX size={20} /></button>
        </div>
        <div class="large-preview"><img class="icon-image" src={`/api/icons/${icon.component}`} width={size} height={size} alt={`${icon.name} ${icon.style} icon`} /></div>
        <div class="preview-controls"><code>{icon.component}</code><div class="size-controls" role="group" aria-label="Preview size">{[24, 48, 96].map(value => <button type="button" aria-pressed={size === value} mix={on("click", () => { size = value; handle.update(); })}>{value}</button>)}</div></div>
        <div class="code-panel">
          <div class="code-toolbar"><div class="tabs" role="tablist" aria-label="Usage example">
            {(["component", "import"] as const).map(item => <button id={`example-tab-${item}`} type="button" role="tab" aria-selected={tab === item} aria-controls="example-code" tabIndex={tab === item ? 0 : -1}
              mix={[on("click", () => changeTab(item)), on("keydown", event => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const nextTab = event.key === "Home" ? "component" : event.key === "End" ? "import" : tab === "component" ? "import" : "component";
                  changeTab(nextTab); handle.queueTask(() => document.getElementById(`example-tab-${nextTab}`)?.focus());
                }
              })]}>{item === "component" ? "Remix 3.1" : "Core data"}</button>)}
          </div><CopyButton text={code} label="Copy usage example" /></div>
          <pre id="example-code" role="tabpanel" aria-labelledby={`example-tab-${tab}`} tabIndex={0}><code>{code}</code></pre>
        </div>
        <div class="dialog-foot"><span class="status-dot" />@nosweat/icons · tree-shakable ESM</div>
      </div>
    </dialog>;
  };
}

function App(handle: Handle) {
  const isHome = location.pathname === "/";
  const initial = new URLSearchParams(location.search);
  const route = parseIconRoute(location.pathname);
  let query = initial.get("q") || "";
  let style: StyleFilter = ["outline", "filled"].includes(initial.get("style") || "") ? initial.get("style") as StyleFilter : "all";
  let page = Math.max(1, Number(initial.get("page")) || 1);
  let results: SearchResults | undefined;
  let loading = true;
  let error = "";
  let selected: IconRecord | undefined;
  let selectedSlug = route?.slug || "";
  let legacyComponent = route ? "" : initial.get("icon") || "";
  let tab: ExampleTab = route?.tab ?? (initial.get("tab") === "import" ? "import" : "component");
  let theme = document.documentElement.dataset.theme || "light";
  let timeout: ReturnType<typeof setTimeout>;
  let controller: AbortController | undefined;
  let requestId = 0;

  const select = (icon: IconRecord) => { selected = icon; selectedSlug = iconSlug(icon); legacyComponent = ""; updateURL(); handle.update(); };
  const changeTab = (nextTab: ExampleTab) => { tab = nextTab; updateURL(); handle.update(); };
  const close = () => { selected = undefined; selectedSlug = ""; legacyComponent = ""; tab = "component"; updateURL(); handle.update(); };
  async function restoreIcon() {
    const target = selectedSlug || legacyComponent;
    const legacy = !!legacyComponent;
    if (!target) return;
    const search = legacy ? target : target.replace(/-filled$/, "");
    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: search })}`, { signal: handle.signal });
      if (!response.ok) return;
      const data: SearchResults = await response.json();
      if (handle.signal.aborted || (selectedSlug || legacyComponent) !== target) return;
      const icon = data.icons.find(icon => legacy ? icon.component === target : iconSlug(icon) === target);
      if (!icon) { close(); return; }
      select(icon);
    } catch { /* Keep the explorer usable if the linked icon cannot be loaded. */ }
  }
  function updateURL() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (style !== "all") params.set("style", style);
    if (page > 1) params.set("page", String(page));
    if (legacyComponent) { params.set("icon", legacyComponent); params.set("tab", tab); }
    const path = selectedSlug ? iconPath(selectedSlug, tab) : "/icons";
    history.replaceState(null, "", `${path}${params.size ? `?${params}` : ""}`);
  }
  async function load() {
    const current = ++requestId;
    controller?.abort();
    controller = new AbortController();
    loading = true; error = ""; handle.update();
    updateURL();
    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: query, style, page: String(page) })}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Could not load icons. Please try again.");
      const data: SearchResults = await response.json();
      if (current !== requestId || handle.signal.aborted) return;
      results = data; page = data.page; updateURL();
    } catch (caught) {
      if (current !== requestId || handle.signal.aborted || (caught as Error).name === "AbortError") return;
      error = caught instanceof Error ? caught.message : "Could not load icons.";
    } finally {
      if (current === requestId && !handle.signal.aborted) { loading = false; handle.update(); }
    }
  }
  function changeSearch(nextQuery: string, nextStyle = style, immediate = false) {
    clearTimeout(timeout); controller?.abort(); requestId++;
    query = nextQuery; style = nextStyle; page = 1; loading = true;
    handle.update();
    if (immediate) void load(); else timeout = setTimeout(() => void load(), 150);
  }
  function changePage(nextPage: number) {
    clearTimeout(timeout); page = nextPage; void load();
    document.getElementById("explorer-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (!isHome) handle.queueTask(() => { void load(); void restoreIcon(); });
  handle.signal.addEventListener("abort", () => { clearTimeout(timeout); controller?.abort(); });
  document.title = isHome ? "Install — @nosweat/icons" : "Tabler — @nosweat/icons";

  return () => <>
    <a href="#main" class="skip-link">Skip to content</a>
    <header class="site-header"><div class="header-inner">
      <a href="/" class="brand" aria-label="Nosweat icons home"><span class="brand-symbol"><IconGridDots size={22} /></span><span>@nosweat<span class="brand-divider">/</span><strong>icons</strong></span></a>
      <nav aria-label="Main navigation"><a href="/" aria-current={isHome ? "page" : undefined}>Get started</a><a href="/icons" aria-current={!isHome ? "page" : undefined}>Icons</a></nav>
      <div class="header-actions"><span class="version">v0.1.0</span><button type="button" class="icon-button theme-button" title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} mix={on("click", () => {
        theme = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#141614" : "#f8f9f6");
        try { localStorage.setItem("tabler-theme", theme); } catch { /* Storage may be disabled. */ }
        handle.update();
      })}>{theme === "dark" ? <IconSun size={19} /> : <IconMoon size={19} />}</button></div>
    </div></header>
    <main id="main" class={isHome ? "main-shell home" : "main-shell explorer"}>
      {isHome ? <Home /> : <>
        <div class="page-heading" id="explorer-heading"><div><div class="eyebrow"><span class="status-dot" />THE COLLECTION</div><h1>Tabler icons.</h1><p>Outline & filled / Core & Remix 3.1</p></div><span class="collection-count">{results ? (results.counts.outline + results.counts.filled).toLocaleString() : "—"}<small>icons, any framework</small></span></div>
        <div class="search-toolbar">
          <div class="search-field"><IconSearch size={21} /><input type="search" name="q" value={query} maxLength={120} aria-label="Search icons" placeholder="Search icons by name…" autoComplete="off" spellcheck={false} mix={on("input", event => changeSearch((event.target as HTMLInputElement).value))} />{query && <button type="button" class="icon-button" title="Clear search" aria-label="Clear search" mix={on("click", () => changeSearch("", style, true))}><IconX size={17} /></button>}</div>
          <div class="segmented-control" role="group" aria-label="Icon style">{(["all", "outline", "filled"] as const).map(item => <button type="button" aria-pressed={style === item} mix={on("click", () => changeSearch(query, item, true))}>{item === "all" ? "All styles" : item === "outline" ? "Outline" : "Filled"}</button>)}</div>
        </div>
        <div class="results-bar"><span role="status" aria-live="polite">{loading ? "Finding icons…" : error ? "Search unavailable" : `${results?.total.toLocaleString() || 0} icons${query ? ` matching “${query}”` : ""}`}</span><span class="results-meta">{results?.version ? `Tabler ${results.version}` : "Tabler Icons"}</span></div>
        {error ? <div class="empty-state" role="alert"><IconSearch size={32} /><h2>That didn’t load.</h2><p>{error}</p><button class="button secondary" type="button" mix={on("click", () => void load())}>Try again</button></div>
          : !loading && !results?.icons.length ? <div class="empty-state"><IconSearch size={36} /><h2>No icons found.</h2><p>Try a shorter name or a different style.</p><button class="button secondary" type="button" mix={on("click", () => changeSearch("", "all", true))}>Reset search</button></div>
          : <div class={`icon-grid ${loading ? "is-loading" : ""}`} aria-label="Icon results" aria-busy={loading}>{results ? results.icons.map(icon => <IconTile key={icon.component} icon={icon} select={select} />) : Array.from({ length: 24 }, (_, i) => <div key={i} class="skeleton-tile" />)}</div>}
        {results && results.pages > 1 && !error && <nav class="pagination" aria-label="Results pages"><span>Page {results.page} of {results.pages}</span><div><button type="button" class="button secondary" disabled={loading || results.page <= 1} mix={on("click", () => changePage(page - 1))}><IconArrowLeft size={16} />Previous</button><button type="button" class="button secondary" disabled={loading || results.page >= results.pages} mix={on("click", () => changePage(page + 1))}>Next<IconArrowRight size={16} /></button></div></nav>}
      </>}
    </main>
    <footer class="site-footer"><div><a class="footer-brand" href="/">@nosweat<span>/</span>icons</a><span>Built with the icons you’re looking at.</span></div><a href="https://tabler.io/icons" target="_blank" rel="noreferrer">Tabler Icons · MIT<IconArrowUpRight size={14} /></a></footer>
    {selected && <IconModal key={selected.component} icon={selected} tab={tab} changeTab={changeTab} close={close} />}
  </>;
}

createRoot(document.getElementById("app")!).render(<App />);
