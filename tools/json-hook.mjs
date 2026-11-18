// node --import ./tools/json-hook.mjs … : Vite처럼 `import x from "./a.json"`을 그대로 읽게 한다
import { register } from "node:module";
register(
  "data:text/javascript," +
    encodeURIComponent(`export async function load(url, context, next) {
  if (url.endsWith(".json")) return next(url, { ...context, importAttributes: { type: "json" } });
  return next(url, context);
}`),
  import.meta.url,
);
