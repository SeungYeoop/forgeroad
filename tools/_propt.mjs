import { paintProp } from "../src/forge/natprops.js";
for (const k of ["p_cairn","p_menhir","p_sheep","p_fence","p_hay","p_flags","p_bell","p_lectern","p_nest","p_font"]) { const r = paintProp(k, 1, 0, { top: 0x8ec045, rock: 0xd09a72, acc: 0xffd27a }); console.log(k, r.w, r.h); }
