import type { IconRecord } from "./shared.ts";

export type ExampleTab = "component" | "import";

export function iconSlug(icon: IconRecord) {
  return `${icon.name}${icon.style === "filled" ? "-filled" : ""}`;
}

export function parseIconRoute(pathname: string) {
  const match = /^\/icons\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(core|remix)\/?$/.exec(pathname);
  if (!match) return undefined;
  return { slug: match[1]!, tab: (match[2] === "core" ? "import" : "component") as ExampleTab };
}

export function iconPath(slug: string, tab: ExampleTab) {
  return `/icons/${slug}/${tab === "import" ? "core" : "remix"}`;
}
