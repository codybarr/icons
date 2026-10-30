import { expect, test } from "bun:test";
import { iconPath, iconSlug, parseIconRoute } from "./icon-route.ts";

test("icon routes round-trip both tabs and styles", () => {
  for (const style of ["outline", "filled"] as const) {
    const slug = iconSlug({ name: "accessible-off", component: "IconAccessibleOff", style });
    expect(slug).toBe(style === "filled" ? "accessible-off-filled" : "accessible-off");
    for (const tab of ["component", "import"] as const) {
      const path = iconPath(slug, tab);
      expect(path).toBe(`/icons/${slug}/${tab === "import" ? "core" : "remix"}`);
      expect(parseIconRoute(path)).toEqual({ slug, tab });
      expect(parseIconRoute(`${path}/`)).toEqual({ slug, tab });
    }
  }
});

test("only complete icon routes match", () => {
  for (const path of ["/", "/icons", "/icons/heart", "/icons/heart/unknown", "/icons/heart/core/extra", "/api/icons/heart/core"]) {
    expect(parseIconRoute(path)).toBeUndefined();
  }
});
