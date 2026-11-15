# 테스트 도구 (헤드리스 크롬 원격 제어)

1. `npx vite build` → `npx vite preview --port 4173`
2. 크롬을 원격 디버깅으로 켠다 (PowerShell):
   `chrome.exe --headless=new --remote-debugging-port=9333 --user-data-dir=<임시폴더> --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1280,720 http://localhost:4173/`
3. `node tools/cdp.mjs <스크립트.js> [스크린샷.png]` — 스크립트는 async 함수 몸통. `LOG=1` 이면 콘솔 출력도 보인다.

- `foetest/gallery.js`: 몬스터 시트를 크게 늘어놓아 그림 확인. 앞에 `window.__LIST=[["fr0_0",[["idle"],["wind",3]],3]];` 를 붙여 실행.
- `foetest/step.js`: 몬스터마다 update를 직접 90번 돌려 오류 확인.
- `foetest/fight.js`: 탐험 장면에서 몬스터들을 소환해 0.6초마다 상태 기록.
- `foetest/teleport.js`: `window.__D=거리;` 를 붙여 지역 이동.
- 탐험 장면 시작: `window.__game.scene.start("Run")`, 장면 객체: `window.__run`, 글루: `window.__FG`.
- 주의: 헤드리스는 느려서 게임 시간이 실제보다 천천히 간다(속도 판단 금지). 페이지 새로고침 직후 7~10초 기다릴 것(부팅 렌더링).
