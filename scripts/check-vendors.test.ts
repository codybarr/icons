import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { planUpdate, updateVendors } from "./check-vendors.ts";

test("vendor update bumps the package patch for any newer stable upstream version", () => {
  expect(planUpdate("v3.50.0", "v3.51.0", "0.1.0")).toEqual({ tabler: "v3.51.0", version: "0.1.1" });
  expect(planUpdate("v3.9.0", "v3.10.0", "1.2.9")?.version).toBe("1.2.10");
  expect(planUpdate("v3.50.0", "v4.0.0", "0.1.0")?.version).toBe("0.1.1");
});

test("unchanged and older vendor versions do not release", () => {
  expect(planUpdate("v3.50.0", "v3.50.0", "0.1.0")).toBeNull();
  expect(planUpdate("v3.50.0", "v3.49.9", "0.1.0")).toBeNull();
  expect(planUpdate("v4.0.0", "v3.99.9", "0.1.0")).toBeNull();
});

test("vendor updates preserve package formatting and are idempotent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "icons-vendors-"));
  const root = pathToFileURL(directory + "/");
  try {
    const original = '{\n  "name": "@nosweat/icons",\n  "version": "0.1.0"\n}\n';
    await Bun.write(new URL("package.json", root), original);
    await Bun.write(new URL("vendors.json", root), '{"tabler":"v3.50.0"}\n');
    await updateVendors("v3.51.0", root);
    const result = await Bun.file(new URL("package.json", root)).text();
    expect(result).toBe(original.replace('"0.1.0"', '"0.1.1"'));
    expect(await Bun.file(new URL("vendors.json", root)).json()).toEqual({ tabler: "v3.51.0" });
    expect(await updateVendors("v3.51.0", root)).toBeNull();
    expect(await Bun.file(new URL("package.json", root)).text()).toBe(result);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("invalid vendor versions and prerelease package bumps fail safely", () => {
  for (const version of ["3.51.0", "v3.51.0-beta.1", "v03.51.0", "v3.51.0\ninjected=true"]) {
    expect(() => planUpdate("v3.50.0", version, "0.1.0")).toThrow();
  }
  expect(() => planUpdate("v3.50.0", "v3.51.0", "0.2.0-beta.1")).toThrow();
});
