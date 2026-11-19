# 테스트 도구 (헤드리스 크롬 원격 제어)

1. `npx vite build` → `npx vite preview --port 4173`
2. 크롬을 원격 디버깅으로 켠다 (PowerShell):
   `chrome.exe --headless=new --remote-debugging-port=9333 --user-data-dir=<임시폴더> --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1280,720 http://localhost:4173/`
3. `node tools/cdp.mjs <스크립트.js> [스크린샷.png]` — 스크립트는 async 함수 몸통. `LOG=1` 이면 콘솔 출력도 보인다.

- `foetest/gallery.js`: 몬스터 시트를 크게 늘어놓아 그림 확인. 앞에 `window.__LIST=[["fr0_0",[["idle"],["wind",3]],3]];` 를 붙여 실행.
- `foetest/step.js`: 몬스터마다 update를 직접 90번 돌려 오류 확인.
- `foetest/fight.js`: 탐험 장면에서 몬스터들을 소환해 0.6초마다 상태 기록.
- `foetest/teleport.js`: `window.__D=거리;` 를 붙여 지역 이동.
- 지형 회귀 검사: Vite를 `node node_modules/vite/bin/vite.js --port 5198`로 실행하고, 디버깅 포트 9333의 크롬에서 `node tools/check-terrain.mjs tools/foetest/terrain.js`를 실행한다. `TEST_URL` 환경 변수로 다른 서버 주소를 지정할 수 있다.
- 지형 검사는 별도 탭에서 맵 캐시 삭제·역순 재생성, 화면과 충돌 데이터 일치, 빈 공간 이동·벽 충돌·바닥 착지를 확인한다. 실패하면 종료 코드 1을 반환한다.
- 재진입 검사: `node tools/check-terrain.mjs tools/foetest/terrain-reentry.js`. 8회 재진입하며 이전 지형 이미지와 작업이 정리되는지, 새 맵의 실제 픽셀이 원본 지형과 같은지 확인한다. `DISABLE_WORKERS=1` 환경 변수로 작업 스레드 없이도 검사할 수 있다.
- 지하 연출 검사: `node tools/check-terrain.mjs tools/foetest/underground.js [스크린샷.png]`. 지하 5종의 입체 레이어, 비·눈 차단과 지상 복귀, 충돌 데이터 유지를 검사한다.
- 탐험 장면 시작: `window.__game.scene.start("Run")`, 장면 객체: `window.__run`, 글루: `window.__FG`.

## 자연 지형 (natgen.js · finephys.js · terrfine.js)
노드에서 바로 (JSON import를 위해 `--import ./tools/json-hook.mjs`):
- 종합 검사: `node --import ./tools/json-hook.mjs tools/natterrain-test.mjs` — 같은 시드 같은 지형, 그림 = 충돌(1px), 모든 출구 도달·갇힘 0, 길찾기 이동을 실제 충돌로 재현, 경사 분포, 지역 차이, 시간. `SEEDS=1,2,3`, `FAST=1`
- 일괄 검사·구조 그림: `SEEDS=1,2 ZONES=g1_0,gm3_0 IMG=폴더 node --import ./tools/json-hook.mjs tools/natlab.mjs` (`QUIET=1`이면 문제 있는 구역만)
- 실제 게임 그림 PNG: `node --import ./tools/json-hook.mjs tools/natpaint.mjs gm3_0 1 out.png [x y w h]`
- 길찾기 ↔ 충돌 재현: `node --import ./tools/json-hook.mjs tools/natphys.mjs`
- 실게임(헤드리스 크롬, Vite는 `localhost`로 열린다 — 127.0.0.1이 아니다): `TEST_URL=http://localhost:5198/ node tools/natcheck.mjs <스크린샷 폴더> [구역id,…]`
- 실게임 순간이동 화면: `TEST_URL=http://localhost:5198/ node tools/natview.mjs <스크린샷 폴더> g1_0 "x,y,이름;x,y,이름"` (x·y = 구역 안 px, y = 발 높이, `ZOOM=0.6`). 설계가 오래 걸리는 구역은 natcheck에 `TRAVEL_WAIT=25000`
- 설계도 구역(`src/forge/natbp.js`, 지금은 g1_0): 하늘섬·동굴 방·던전 방을 정한 대로 짓는다. 진단 (모두 `node --import ./tools/json-hook.mjs tools/<이름> g1_0`): 못 닿은 마디 무리 `natunr.mjs` · 하늘 디딤돌 뛰기 `nathops.mjs` · 상자·적·역할 수 `natloot.mjs` · 지표 높이·평평한 곳·섬 목록 `natgprof.mjs` · 하늘에서 가장 높이 닿은 곳 `natup.mjs` · 하늘 오르기 실패 이유 `natsky.mjs`
- 시드 여러 개 한 번에 (고치기 없이): `node --import ./tools/json-hook.mjs tools/natseeds.mjs g1_0 1-30` — 갇힌 곳·못 닿은 곳 무리 좌표. 원인 찾기: `natdbgs.mjs g1_0 <시드>`(설계 길·구멍 실패), `natnodes.mjs`(마디 도달), `natcolumn.mjs`(세로줄 공기 구간)
- 3D 픽셀 소품(`src/forge/natprops.js`) 모아 보기: `node tools/natprops-sheet.mjs out.png 2` · 크게 `node tools/natprops-big.mjs out.png`
- 여러 시드 비교 디버그 페이지: `npm run dev` → http://localhost:5173/terrain-lab.html?zone=gm3_0&seeds=1,2,3,4 (배포판에도 포함: …/terrain-lab.html)
- 주의: 이 노트북은 계속 100% 부하가 걸리면 몇 초 뒤 CPU가 크게 느려진다. 긴 일괄 검사의 시간 수치는 앞쪽 몇 개만 믿을 것
- 주의: 헤드리스는 느려서 게임 시간이 실제보다 천천히 간다(속도 판단 금지). 페이지 새로고침 직후 7~10초 기다릴 것(부팅 렌더링).
