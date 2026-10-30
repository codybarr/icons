import { on, type Handle } from "remix/component";
import { IconCheck, IconCopy } from "../generated/remix/tabler/index.ts";

export function CopyButton(handle: Handle<{ text: string; label?: string }>) {
  let state: "idle" | "copied" | "error" = "idle";
  let timer: ReturnType<typeof setTimeout>;
  handle.signal.addEventListener("abort", () => clearTimeout(timer));
  return () => (
    <span class="copy-control">
      <button class="icon-button copy-button" type="button" aria-label={state === "copied" ? "Copied" : handle.props.label || "Copy code"} title={state === "copied" ? "Copied" : handle.props.label || "Copy code"}
        mix={on("click", async () => {
          try { await navigator.clipboard.writeText(handle.props.text); state = "copied"; }
          catch { state = "error"; }
          if (handle.signal.aborted) return;
          handle.update();
          clearTimeout(timer);
          timer = setTimeout(() => { state = "idle"; handle.update(); }, 2200);
        })}>
        {state === "copied" ? <IconCheck size={17} /> : <IconCopy size={17} />}
      </button>
      <span class={state === "error" ? "copy-error" : "sr-only"} role="status">{state === "copied" ? "Copied to clipboard" : state === "error" ? "Could not copy. Select the code manually." : ""}</span>
    </span>
  );
}
