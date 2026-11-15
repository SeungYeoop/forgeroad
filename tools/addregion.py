# 새 지역 모델 등록 도우미: python tools/addregion.py <n> <모델 9개 이름(일반6, 정예2, 보스)>
# models.js / glue.js 에 import·등록을 넣고, r{n}.js 임시 행동 파일을 만든다(이미 있으면 그대로 둔다).
import sys, os
root = os.path.join(os.path.dirname(__file__), "..", "src", "forge")
n = int(sys.argv[1]); names = sys.argv[2:]
assert len(names) == 9
ids = [f"fr{n}_{k}" for k in range(6)] + [f"fr{n}_e0", f"fr{n}_e1", f"frb{n}"]
p = os.path.join(root, "foes", "models.js"); s = open(p, encoding="utf-8").read()
imp = f'import {{ {", ".join(names)} }} from "./m{n}.js";\n'
if imp not in s:
    s = s.replace("\nexport const MODELS = {", imp + "\nexport const MODELS = {")
    s = s.replace("\n};", "\n  " + ", ".join(f"{i}: {m}" for i, m in zip(ids, names)) + ",\n};", 1)
open(p, "w", encoding="utf-8").write(s)
rp = os.path.join(root, "foes", f"r{n}.js")
if not os.path.exists(rp):
    open(rp, "w", encoding="utf-8").write(
        f'// {n + 1}지역 행동 (그림은 m{n}.js) — 임시\nimport {{ register }} from "./core.js";\nimport {{ {", ".join(names[:8])} }} from "./m{n}.js";\n'
        'const idleBrain = function* (e, A) { for (;;) { A.play("idle"); yield 0.2; } };\n'
        f'for (const [id, m] of [{", ".join(f"[{chr(34)}{i}{chr(34)}, {m}]" for i, m in zip(ids[:8], names[:8]))}]) register(id, {{ ...m, brain: idleBrain }});\n')
p = os.path.join(root, "glue.js"); s = open(p, encoding="utf-8").read()
line = f'import "./foes/r{n}.js";\nimport {{ {names[8]} }} from "./foes/m{n}.js";'
if line not in s:
    s = s.replace('import "./foes/r1.js";', f'import "./foes/r1.js";\n{line}', 1)
    s = s.replace('FOES.register("frb1", elkharn);', f'FOES.register("frb1", elkharn);\nFOES.register("frb{n}", {names[8]});', 1)
open(p, "w", encoding="utf-8").write(s)
print("registered", ids)
