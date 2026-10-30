import { expect } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = await mkdtemp(join(tmpdir(), "icons-package-"));
try {
  const entry = join(root, "entry.ts");
  await Bun.write(entry, `export { heart } from ${JSON.stringify(new URL("../dist/generated/core/tabler/index.js", import.meta.url).pathname)};`);
  const result = await Bun.build({ entrypoints: [entry], target: "browser", minify: true });
  if (!result.success) throw new AggregateError(result.logs);
  const text = await result.outputs[0]!.text();
  expect(text).not.toContain("remix");
  expect(text.length).toBeLessThan(2000);
  const core = await import(new URL("../dist/generated/core/tabler/index.js", import.meta.url).href);
  expect(Array.isArray(core.heart)).toBe(true);
  expect(Array.isArray(core.heartFilled)).toBe(true);
  const remix = await import(new URL("../dist/generated/remix/tabler/index.js", import.meta.url).href);
  expect(typeof remix.IconHeart).toBe("function");
  await Bun.write(entry, `export { IconHeart } from ${JSON.stringify(new URL("../dist/generated/remix/tabler/index.js", import.meta.url).pathname)};`);
  const remixBuild = await Bun.build({ entrypoints: [entry], target: "browser", minify: true, external: ["remix/*"] });
  if (!remixBuild.success) throw new AggregateError(remixBuild.logs);
  const remixText = await remixBuild.outputs[0]!.text();
  expect(remixText.length).toBeLessThan(4000);
  console.log(`Package checks passed; tree-shaken heart: ${text.length} bytes core, ${remixText.length} bytes Remix (runtime external)`);
} finally { await rm(root, { recursive: true, force: true }); }
