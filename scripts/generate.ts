import { mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { componentName, exportName, convertSvg, remixSource, type IconStyle } from "./svg.ts";

const projectRoot = resolve(import.meta.dir, "..");

async function request(url: string, github = false): Promise<Response> {
  const headers: Record<string, string> = { "User-Agent": "nosweat-icons" };
  if (github) {
    headers.Accept = "application/vnd.github+json";
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Download failed (${response.status} ${response.statusText}): ${url}`);
  return response;
}

export async function latestVersion(): Promise<string> {
  const release = await (await request("https://api.github.com/repos/tabler/tabler-icons/releases/latest", true)).json() as { tag_name?: unknown };
  if (typeof release.tag_name !== "string" || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)) throw new Error("Unexpected Tabler release tag");
  return release.tag_name;
}

/** Build in a staging directory, so invalid input cannot erase a working generation. */
export async function generate(archive: Bun.Archive, version: string, root = projectRoot) {
  const stage = resolve(root, `.generated-${crypto.randomUUID()}`);
  const output = resolve(root, "generated");
  const backup = `${stage}-backup`;
  const counts = { outline: 0, filled: 0 };
  try {
    const files = await archive.files();
    await mkdir(stage, { recursive: true });
    const coreExports: string[] = [];
    const remixExports: string[] = ['export type { IconProps } from "../../../src/icon.ts";'];
    const names = new Set<string>();
    const dataNames = new Set<string>();
    const manifest: { name: string; component: string; exportName: string; style: IconStyle }[] = [];
    for (const style of ["outline", "filled"] as const) {
      for (const [path, file] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
        const match = path.match(new RegExp(`^[^/]+/icons/${style}/([a-z0-9-]+)\\.svg$`));
        if (!match) continue;
        const name = match[1]!;
        const component = componentName(name, style);
        if (names.has(component)) throw new Error(`Component name collision: ${component}`);
        names.add(component);
        const source = convertSvg(await file.text(), name, style);
        const data = exportName(name, style);
        if (dataNames.has(data)) throw new Error(`Core export name collision: ${data}`);
        dataNames.add(data);
        await Bun.write(resolve(stage, "core/tabler", `${data}.ts`), source);
        await Bun.write(resolve(stage, "remix/tabler", `${component}.ts`), remixSource(name, style));
        coreExports.push(`export { ${data} } from "./${data}.ts";`);
        remixExports.push(`export { ${component} } from "./${component}.ts";`);
        manifest.push({ name, component, exportName: data, style });
        counts[style]++;
      }
      if (!counts[style]) throw new Error(`Archive contains no ${style} SVGs`);
    }
    const license = [...files].find(([path]) => /^[^/]+\/LICENSE$/.test(path))?.[1];
    if (!license) throw new Error("Archive is missing Tabler's LICENSE");
    await Bun.write(resolve(stage, "LICENSE"), license);
    await Bun.write(resolve(stage, "core/tabler/index.ts"), coreExports.join("\n") + "\n");
    await Bun.write(resolve(stage, "remix/tabler/index.ts"), remixExports.join("\n") + "\n");
    await Bun.write(resolve(stage, "manifest.json"), JSON.stringify({ version, counts, icons: manifest }, null, 2) + "\n");
    let hadOutput = false;
    try { await rename(output, backup); hadOutput = true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    try { await rename(stage, output); }
    catch (error) { if (hadOutput) await rename(backup, output); throw error; }
    await rm(backup, { recursive: true, force: true });
    return counts;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    const { values } = parseArgs({ args: Bun.argv.slice(2), options: { version: { type: "string" }, help: { type: "boolean" } }, strict: true });
    if (values.help) {
      console.log("Usage: bun run generate [--version v3.50.0]\nDefaults to the latest stable Tabler GitHub release.");
    } else {
      const version = values.version ?? await latestVersion();
      if (!/^v\d+\.\d+\.\d+$/.test(version)) throw new Error("Version must be a stable release tag, e.g. v3.50.0");
      console.log(`Downloading Tabler ${version} raw SVGs…`);
      const response = await request(`https://codeload.github.com/tabler/tabler-icons/tar.gz/refs/tags/${version}`);
      const counts = await generate(new Bun.Archive(await response.arrayBuffer()), version);
      console.log(`Generated ${counts.outline} outline and ${counts.filled} filled icons (core + Remix) in generated/`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
