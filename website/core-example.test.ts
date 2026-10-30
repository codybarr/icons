import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createElement } from "remix/component";
import { renderToString } from "remix/component/server";
import { iconImport } from "./shared.ts";

test("copyable Core example typechecks and renders custom size tokens in Remix", async () => {
  const root = resolve(import.meta.dir, "..");
  const dir = await mkdtemp(join(root, ".core-example-"));
  try {
    const entry = join(dir, "example.tsx");
    const fixture = join(dir, "tabler.ts");
    await Bun.write(entry, iconImport({ name: "heart", component: "IconHeart", style: "outline" }));
    await Bun.write(fixture, 'export const heart = [{ tag: "path", attrs: { d: "M1 2", fill: "currentColor" } }] as const;');
    await Bun.write(join(dir, "tsconfig.json"), JSON.stringify({
      extends: join(root, "tsconfig.json"),
      compilerOptions: { paths: {
        "@nosweat/icons/core": [join(root, "src/core.ts")],
        "@nosweat/icons/core/tabler": [fixture],
      } },
      include: [entry, fixture],
    }));
    const check = Bun.spawn(["bun", "check", "--project", join(dir, "tsconfig.json")], { stdout: "pipe", stderr: "pipe" });
    const diagnostics = await new Response(check.stdout).text() + await new Response(check.stderr).text();
    expect(await check.exited, diagnostics).toBe(0);

    const result = await Bun.build({
      entrypoints: [entry], outdir: dir, target: "bun", external: ["remix/*"],
      plugins: [{ name: "fixture", setup(build) {
        build.onResolve({ filter: /^@nosweat\/icons\/core\/tabler$/ }, () => ({ path: fixture }));
      } }],
    });
    if (!result.success) throw new AggregateError(result.logs);
    const { Icon, Example } = await import(join(dir, "example.js"));
    const example = await renderToString(createElement(Example, {}));
    expect(example).toContain('width="1.5rem"');
    expect(example).toContain('gap: 0.5rem');
    expect(example).toContain('aria-hidden="true"');
    expect(example).toContain('<path');
    const labelled = await renderToString(createElement(Icon, { paths: [], size: 8, "aria-label": "Favorite" }));
    expect(labelled).toContain('width="2rem"');
    expect(labelled).not.toContain('aria-hidden');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
