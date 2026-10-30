import { latestVersion } from "./generate.ts";

function stableVersion(version: string): number[] {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Expected a stable version, got ${version}`);
  }
  const parts = version.split(".").map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error(`Version is too large: ${version}`);
  return parts;
}

export function planUpdate(current: string, latest: string, packageVersion: string) {
  if (!current.startsWith("v") || !latest.startsWith("v")) throw new Error("Vendor versions must start with v");
  const before = stableVersion(current.slice(1));
  const after = stableVersion(latest.slice(1));
  const difference = after.findIndex((part, index) => part !== before[index]);
  // Never downgrade, even if an upstream release is deleted or marked prerelease.
  if (difference === -1 || after[difference]! < before[difference]!) return null;
  const [major, minor, patch] = stableVersion(packageVersion);
  if (!Number.isSafeInteger(patch! + 1)) throw new Error("Package patch version overflow");
  return { tabler: latest, version: `${major}.${minor}.${patch! + 1}` };
}

export async function updateVendors(latest: string, root = new URL("../", import.meta.url)) {
  const vendorFile = Bun.file(new URL("vendors.json", root));
  const packageFile = Bun.file(new URL("package.json", root));
  const vendors = await vendorFile.json();
  const packageText = await packageFile.text();
  const pkg = JSON.parse(packageText);
  const update = planUpdate(vendors.tabler, latest, pkg.version);
  if (update) {
    await Bun.write(vendorFile, JSON.stringify({ ...vendors, tabler: update.tabler }, null, 2) + "\n");
    await Bun.write(packageFile, packageText.replace(
      /("version"\s*:\s*")[^"]+(")/,
      (_match, prefix, suffix) => `${prefix}${update.version}${suffix}`,
    ));
    console.log(`Tabler ${vendors.tabler} → ${update.tabler}; @nosweat/icons ${pkg.version} → ${update.version}`);
  } else {
    console.log("No newer stable vendor release found.");
  }
  return update;
}

if (import.meta.main) {
  const update = await updateVendors(await latestVersion());
  if (process.env.GITHUB_OUTPUT) {
    const output = Bun.file(process.env.GITHUB_OUTPUT);
    const previous = await output.exists() ? await output.text() : "";
    await Bun.write(output, previous + `changed=${Boolean(update)}\n` + (update ? `release_tag=v${update.version}\n` : ""));
  }
}
