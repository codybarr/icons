import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement } from "remix/component";
import { renderToString } from "remix/component/server";
import { generate } from "./generate.ts";
import { parseSvg, exportName } from "./svg.ts";
import { tablerIcon } from "../src/remix.ts";

const svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/></svg>';

test("core preserves primitives and inherited presentation without a framework", () => {
  expect(parseSvg(svg)).toEqual([
    { tag: "circle", attrs: { fill: "none", stroke: "currentColor", "stroke-width": "2", cx: "12", cy: "12", r: "9" } },
    { tag: "path", attrs: { fill: "none", stroke: "currentColor", "stroke-width": "2", d: "M12 8v4" } },
  ]);
  expect(exportName("arrow-up-right", "filled")).toBe("arrowUpRightFilled");
  expect(exportName("123", "outline")).toBe("icon123");
  expect(exportName("package", "outline")).toBe("iconPackage");
});

test("rejects executable markup, declarations, resources and unsupported viewBoxes", () => {
  for (const invalid of [svg.replace("<circle", '<script'), svg.replace('cx="12"', 'onclick="evil()"'), svg.replace('fill="none"', 'fill="url(https://bad)"'), '<!DOCTYPE svg>' + svg, svg.replace('0 0 24 24', '0 0 48 48')]) {
    expect(() => parseSvg(invalid)).toThrow();
  }
});

test("Remix renders geometry, size, stroke width and accessible titles", async () => {
  const Icon = tablerIcon(parseSvg(svg), "clock", "outline");
  const output = await renderToString(createElement(Icon, { size: 32, title: "Clock", strokeWidth: 1, color: "red" }));
  expect(output).toContain('width="32"');
  expect(output).toContain('stroke-width="1"');
  expect(output).toContain('<title>Clock</title>');
  expect(output).toContain('role="img"');
  expect(output).not.toContain('aria-hidden');
  const decorative = await renderToString(createElement(Icon, {}));
  expect(decorative).toContain('aria-hidden="true"');
  const labelled = await renderToString(createElement(Icon, { "aria-label": "Clock" }));
  expect(labelled).not.toContain('aria-hidden');
});

test("generation is deterministic and failed input preserves the last generation", async () => {
  const root = await mkdtemp(join(tmpdir(), "nosweat-icons-"));
  try {
    const archive = new Bun.Archive({ "tabler/icons/outline/clock.svg": svg, "tabler/icons/filled/clock.svg": svg, "tabler/LICENSE": "MIT" });
    expect(await generate(archive, "v1.0.0", root)).toEqual({ outline: 1, filled: 1 });
    const file = Bun.file(join(root, "generated/core/tabler/clock.ts"));
    const original = await file.text();
    expect(original).not.toContain("remix");
    await generate(archive, "v1.0.0", root);
    expect(await file.text()).toBe(original);
    await expect(generate(new Bun.Archive({ "tabler/icons/outline/clock.svg": svg }), "v1.0.0", root)).rejects.toThrow();
    expect(await file.text()).toBe(original);
  } finally { await rm(root, { recursive: true, force: true }); }
});
