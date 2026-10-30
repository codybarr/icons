import { expect, test } from "bun:test";
import { createElement } from "remix/component";
import { renderToString } from "remix/component/server";
import { Home } from "./home.tsx";

test("home includes installation, Core and Remix quick starts, and gallery links", async () => {
  const html = await renderToString(createElement(Home, {}));
  expect(html).toContain("bun add @nosweat/icons");
  expect(html).toContain('role="tablist" aria-label="Package manager"');
  expect(html).toContain('id="install-tab-npm"');
  expect(html).toContain('id="install-tab-pnpm"');
  expect(html).toContain("@nosweat/icons/core/tabler");
  expect(html).toContain("@nosweat/icons/remix/tabler");
  expect(html).toContain("remix@3.1");
  expect(html).toContain("jsxImportSource");
  expect(html).toContain("remix/component");
  expect(html).toContain('href="/icons"');
  expect(html).toContain('href="/icons?q=heart"');
});
