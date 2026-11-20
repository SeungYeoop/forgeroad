// 구역 설계도: 손으로 정한 배치(구간·섬·동굴 방·던전 방과 역할). 모양 세부(바위 가장자리·종유석·벽돌)는 생성기가 그린다
// 좌표: px (구역 왼쪽 위 기준). 지표 기준 높이 y=4800. 1칸(블록)=8px
// 역할(role): rest 쉼터(적 없음) · arena 전투(적 더) · treasure 보물(상자) · vista 전망 · sanctum 성소 · trap 함정

export const BLUEPRINTS = {
  // ── g1_0 「재의 들판」: 1번 지역 첫 지상 구역. 난이도 낮음 ──
  // ▲ 문 x≈4352 y≈1200 (거대 하늘섬 평평한 윗면), ▼ 문 x≈3330 (서쪽 동굴 맨 아래 심연 동굴)
  // 땅속: 서쪽 절반 자연 동굴, 동쪽 절반 고대 유적 던전 (층마다 무너진 벽으로 이어진다)
  g1_0: {
    // 지표 구간 (높이는 위로 +px)
    surface: [
      { kind: "flat", a: 0, b: 700 }, // 입구 들판: 안전한 시작
      { kind: "hills", a: 700, b: 1900, bumps: [{ c: 1060, h: 130, w: 280 }, { c: 1560, h: 210, w: 320 }], role: "arena" }, // 낮은 구릉: 단 점프 익히기
      { kind: "valley", a: 1900, b: 2900, c: 2400, d: 190, w: 430, p: 0.36, pond: 180 }, // 재 골짜기: 연못(헤엄)
      { kind: "mountain", a: 2950, b: 5800, c: 4330, h: 600, wl: 1380, wr: 1470, top: 0.12, shoulder: { side: 1, at: 0.5, amt: 0.14 } }, // 재의 산: 이정표·하늘 출발점
      { kind: "mesa", a: 5800, b: 7300, c: 6560, h: 220, w: 640, p: 0.58, role: "arena" }, // 고원: 첫 전투 무대
      { kind: "flat", a: 7300, b: 8192 }, // 출구 들판
    ],
    // 지표 함정 (평평한 자리)
    pads: [],
    // 지표 보물: 산 서쪽 중턱 작은 굴 (막다른 곳에 상자)
    spots: [{ xa: 4960, xb: 5160, role: "treasure" }, { xa: 6300, xb: 6900, role: "arena" }, { xa: 1000, xb: 1700, role: "arena" }],
    // 지표 굴 입구 (→ 입구 동굴): 골짜기 서쪽 비탈 (연못 옆)
    mouths: [{ x: 2140, to: "C1" }],
    // 하늘: 거대 섬 셋(▲ 섬 · 서쪽 거대 섬 · 동쪽 거대 섬) + 큰 섬들. 산 모양 없이 윗면은 평평하거나 큰 턱
    //   큰 섬은 옆 굴 입구로 들어가 섬 속 동굴을 지나 꼭대기로 나온다 (거대 섬은 낮은 쪽 꼭대기 → 턱 벽 굴 입구 → 높은 쪽 꼭대기)
    //   서쪽 길: 산 정상 → A1 → W1(거대: 낮은 쪽 속 동굴·샘 → 턱 벽 입구 → 높은 쪽 속 동굴, 보물) → W3(속 폐허, 보물실) → W4(속 기둥 동굴) → W5 → ▲ 섬 서쪽 입구
    //   동쪽 길: 산 동쪽 어깨 → E1 → E2(거대: 낮은 쪽 속 동굴·샘 → 턱 벽 입구 → 높은 쪽 기둥 동굴) → E4(속 동굴·샘, 보물) → E5(속 동굴) → E6 → ▲ 섬 동쪽 입구
    //   ▲ 섬 속 신전: 양쪽 옆 입구 → 방 → 계단 → 방 → 계단 → 평평한 윗면의 ▲ 문 (서쪽 성소에 큰 상자)
    //     지하 묘실 (신전 아래): 서쪽 회랑 바닥 계단 ↔ 묘실 회랑 → 보물실, 동쪽 경비실 바닥 구멍으로 떨어져도 들어온다
    //   높은 하늘: ▲ 섬 서쪽 끝 → W6 보물섬 → W7 전망섬 · ▲ 섬 동쪽 끝 → E7 보물섬
    //   "id>" / "id<" = 동쪽 / 서쪽 옆 굴 입구, "id^" = 턱 섬의 높은 쪽, "g:x" = 땅 x 자리 평지
    //   섬 속: halls 방 [x0, x1, 바닥 F, 높이 h] (kind pool 샘 · pillar 뒤 기둥) · pass 계단 굴 [xa, fa, xb, fb] · mouths 옆 입구 (edge = 입구가 뚫린 벽 x)
    sky: {
      peakY: 1200,
      gate: {
        cx: 4350, w: 2800, sh: 760, tS: 1500, belly: 0.7, flat: true,
        inner: {
          kind: "ruin",
          halls: [
            { x0: 3000, x1: 3300, F: 1840, h: 200, type: "colonnade", role: "arena" }, // 서쪽 회랑
            { x0: 3600, x1: 3940, F: 1520, h: 230, type: "sanctum" }, // 성소 (큰 상자)
            { x0: 5400, x1: 5700, F: 1830, h: 200, role: "arena" }, // 동쪽 경비실
            { x0: 4760, x1: 5060, F: 1520, h: 210, type: "colonnade", role: "rest" }, // 동쪽 회랑
            { x0: 3600, x1: 4200, F: 2300, h: 220, type: "colonnade", role: "arena", trap: [3860, 3940] }, // 지하 묘실 회랑 (가운데 가시)
            { x0: 3900, x1: 4900, F: 2024, h: 190, role: "rest" }, // 중층 홀 (묘실 계단 중간에서 가로 굴)
            { x0: 4400, x1: 5560, F: 2360, h: 280, type: "vault", role: "treasure" }, // 지하 묘실 보물실
          ],
          pass: [[3300, 1840, 3600, 1520, 150], [3940, 1520, 4260, 1200, 150], [5400, 1830, 5060, 1520, 150], [4760, 1520, 4440, 1200, 150], [4200, 2300, 4400, 2360, 150], [3600, 2300, 3120, 1840, 150], [3300, 2024, 3900, 2024, 150]],
          // 동쪽 경비실 바닥 구멍 → 보물실 (한쪽 길, 나올 때는 서쪽 계단)
          drops: [[5440, 5480, 1830, 2080]],
          mouths: [{ side: "W", x: 3000, F: 1840 }, { side: "E", x: 5700, F: 1830 }],
        },
      },
      isles: [
        { id: "A1", cx: 3700, top: 3992, w: 520, t: 220, role: "rest" }, // 산 위 쉼터: ▲ 섬 밑이 올려다보인다
        { id: "M", cx: 3650, top: 3400, w: 700, t: 260, shape: "lumpy", role: "vista" }, // 가운데 전망 섬: ▲ 섬 배와 양쪽 길이 다 보인다
        // 서쪽 거대 섬: 높은 쪽(서) 2860 · 낮은 쪽(동) 3440
        { id: "W1", cx: 1590, top: 3440, w: 2820, t: 700, shape: "block", form: "keel", role: "rest", step: { at: 0.468, dy: 580, hi: "L" },
          inner: { halls: [{ x0: 2480, x1: 2900, F: 3880, h: 220, role: "arena" }, { x0: 1960, x1: 2180, F: 3700, h: 200, kind: "pool", role: "rest" },
              { x0: 1000, x1: 1300, F: 3332, h: 210, role: "arena" }, { x0: 560, x1: 760, F: 3132, h: 190, role: "treasure" }],
            pass: [[2480, 3880, 2180, 3700], [1960, 3700, 1640, 3440], [1000, 3332, 760, 3132], [560, 3132, 320, 2860]],
            mouths: [{ side: "E", x: 1300, F: 3332, edge: 1500 }, { side: "E", x: 2900, F: 3880 }] } },
        { id: "W3", cx: 2240, top: 2250, w: 1200, t: 700, shape: "block", form: "tiers", role: "rest",
          inner: { kind: "ruin", halls: [{ x0: 1720, x1: 2040, F: 2792, h: 200, type: "colonnade", role: "arena" }, { x0: 2300, x1: 2480, F: 2532, h: 180, type: "vault", role: "treasure" }],
            pass: [[2040, 2792, 2300, 2532], [2480, 2532, 2760, 2250]], mouths: [{ side: "W", x: 1720, F: 2792 }] } },
        { id: "W4", cx: 870, top: 1700, w: 1140, t: 660, shape: "block", form: "cone", role: "arena",
          inner: { halls: [{ x0: 1060, x1: 1380, F: 2142, h: 200, role: "rest" }, { x0: 640, x1: 820, F: 1942, h: 180, kind: "pillar", role: "arena" }],
            pass: [[1060, 2142, 820, 1942], [640, 1942, 400, 1700]], mouths: [{ side: "E", x: 1380, F: 2142 }] } },
        { id: "W5", cx: 2225, top: 1800, w: 950, t: 260, shape: "slab", role: "arena" }, // ▲ 섬 앞 들판 섬
        { id: "W6", cx: 2300, top: 1250, w: 700, t: 320, shape: "lumpy", role: "treasure" }, // 높은 하늘 보물섬
        { id: "W7", cx: 1130, top: 1180, w: 700, t: 300, shape: "spire", role: "vista" }, // 가장 높은 서쪽 전망섬
        // 동쪽 거대 섬: 낮은 쪽(서) 3700 · 높은 쪽(동) 3200
        { id: "E1", cx: 5560, top: 4304, w: 380, t: 140, shape: "slab", role: "rest" },
        { id: "E2", cx: 7030, top: 3700, w: 2120, t: 600, shape: "block", form: "roots", role: "arena", step: { at: 0.547, dy: 500, hi: "R" },
          inner: { halls: [{ x0: 6060, x1: 6400, F: 4080, h: 210, role: "arena" }, { x0: 6640, x1: 6800, F: 3880, h: 190, kind: "pool", role: "rest" },
              { x0: 7280, x1: 7580, F: 3592, h: 220, kind: "pillar", role: "arena" }],
            pass: [[6400, 4080, 6640, 3880], [6800, 3880, 7000, 3700], [7580, 3592, 7940, 3200]],
            mouths: [{ side: "W", x: 7280, F: 3592, edge: 7130 }, { side: "W", x: 6060, F: 4080 }] } },
        { id: "E4", cx: 6400, top: 2560, w: 1000, t: 640, shape: "block", form: "bowl", role: "arena",
          inner: { halls: [{ x0: 6560, x1: 6850, F: 3052, h: 220, kind: "pool", role: "rest" }, { x0: 6180, x1: 6320, F: 2812, h: 190, role: "treasure" }],
            pass: [[6560, 3052, 6320, 2812], [6180, 2812, 5960, 2560]], mouths: [{ side: "E", x: 6850, F: 3052 }] } },
        { id: "E5", cx: 7550, top: 2050, w: 900, t: 620, shape: "block", form: "cone", role: "rest", step: { at: 0.4, dy: 72, hi: "L" },
          inner: { halls: [{ x0: 7180, x1: 7480, F: 2452, h: 220, role: "arena" }],
            pass: [[7480, 2452, 7860, 2050]], mouths: [{ side: "W", x: 7180, F: 2452 }] } },
        { id: "E6", cx: 6330, top: 1840, w: 900, t: 300, shape: "slab", role: "arena", step: { at: 0.6, dy: 72, hi: "R" } }, // ▲ 섬 앞 턱 섬
        { id: "E7", cx: 6220, top: 1150, w: 680, t: 300, shape: "lumpy", role: "treasure" }, // 높은 하늘 보물섬 (동, ▲ 섬 동쪽 끝에서)
        // 갈래 섬 (땅 가까이)
        { id: "CV", cx: 4870, top: 3904, w: 340, t: 150, role: "treasure", shape: "spire" }, // 산 정상에서 오르는 보물섬
        { id: "XT", cx: 7969, top: 4504, w: 190, t: 120, role: "treasure", shape: "spire" }, // 출구 들판 위 작은 보물 바위
      ],
      // 이을 길 (아래 → 위)
      links: [
        ["g:4250", "A1"], ["A1", "W1>"], ["W1^", "W3<"], ["W3", "W4>"], ["W4", "W5"], ["W5", "G<"],
        ["g:5040", "E1"], ["E1", "E2<"], ["E2^", "E4>"], ["E4", "E5<"], ["E5^", "E6^"], ["E6", "G>"],
        ["G", "W6"], ["G", "E7"], ["W6", "W7"], ["g:4250", "CV"], ["W1", "M"], ["g:7520", "XT"],
      ],
    },
    // 서쪽 자연 동굴 (x 0~4100): 방 [x0, x1, 바닥 y, 높이] + 종류·역할
    // 바위층 사이 동굴 띠 다섯. 띠마다 방 3~4개가 높낮이를 바꿔 가며 이어지고, 위아래는 던전(탑 방)·협곡·떨어지는 구멍으로 오간다
    //   띠 안에서는 이웃 방 일부만 가로로 잇고, 나머지는 위아래 띠로 돌아가게 한다 (미로)
    //   띠1: 서쪽 동굴 · 입구 동굴 · 덩굴 회랑 · 산 밑 큰 공동 (→ 던전 1층)
    //   띠2: 뿌리 굴 · 박쥐 둥지 · 갈림 굴 · 협곡 옆 굴 (→ 협곡) + 이끼 굴 · 박쥐 동굴 (→ 던전 2·3층)
    //   띠3: 지하 호수 · 전투 홀 · 고드름 굴 (→ 던전 5층)
    //   띠4: 버섯 굴 · 메아리 홀 · 낮은 굴 · 탑 밑 굴 (→ 던전 6층 탑 밑)
    //   띠5: 깊은 동굴 · 수정 동굴 · ▼ 심연 동굴 (→ 던전 8층) + 던전 옆 쉼터 (→ 던전 7층)
    //   협곡: 산 밑 큰 공동(C3) 바닥 구멍 → 이끼 굴(C13) → 박쥐 동굴(C8). 두 층 사이만
    caves: [
      { id: "C1", x0: 1240, x1: 1780, fy: 5160, h: 220, kind: "hall", floor: "flat", role: "rest" }, // 입구 동굴
      { id: "C4", x0: 150, x1: 880, fy: 5264, h: 240, kind: "pillared", floor: "flat", role: "arena" }, // 서쪽 동굴
      { id: "C2", x0: 2230, x1: 2950, fy: 5440, h: 230, kind: "tiered", floor: "steps", role: "arena" }, // 덩굴 회랑
      { id: "C3", x0: 3060, x1: 4060, fy: 5472, h: 470, kind: "grand", floor: "flat", role: "vista" }, // 산 밑 큰 공동 (바닥 구멍 → 동쪽 협곡)
      { id: "C13", x0: 3460, x1: 4060, fy: 5856, h: 200, kind: "small", floor: "flat", role: "rest" }, // 이끼 굴 (→ 던전 보물실 1)
      { id: "C8", x0: 3460, x1: 4060, fy: 6240, h: 230, kind: "hall", floor: "steps", role: "arena" }, // 박쥐 동굴 (→ 던전 함정 복도)
      { id: "C5", x0: 250, x1: 1500, fy: 6650, h: 330, kind: "lake", floor: "basin", role: "treasure" }, // 지하 호수 (물 건너 상자)
      { id: "C7", x0: 2260, x1: 3000, fy: 6880, h: 300, kind: "pillared", floor: "mound", role: "arena" }, // 전투 홀
      { id: "C12", x0: 3460, x1: 4060, fy: 7008, h: 240, kind: "tiered", floor: "steps", role: "treasure" }, // 고드름 굴 (→ 던전 보물실 3)
      { id: "C9", x0: 300, x1: 1500, fy: 7760, h: 260, kind: "hall", floor: "steps", role: "arena" }, // 깊은 동굴
      // 띠2 (서쪽 → 협곡)
      { id: "N1", x0: 250, x1: 700, fy: 5950, h: 210, kind: "small", floor: "flat", role: "treasure" }, // 뿌리 굴 (막다른 곳 상자)
      { id: "N2", x0: 950, x1: 1500, fy: 5850, h: 240, kind: "hall", floor: "mound", role: "arena" }, // 박쥐 둥지
      { id: "N3", x0: 1750, x1: 2300, fy: 6000, h: 250, kind: "tiered", floor: "steps", role: "rest" }, // 갈림 굴
      { id: "N4", x0: 2550, x1: 3050, fy: 6150, h: 220, kind: "hall", floor: "flat", role: "arena" }, // 협곡 옆 굴
      // 띠4 (서쪽 → 던전 탑 E 밑)
      { id: "P1", x0: 300, x1: 850, fy: 7250, h: 200, kind: "small", floor: "flat", role: "treasure" }, // 버섯 굴 (막다른 곳 상자)
      { id: "P2", x0: 1100, x1: 1700, fy: 7200, h: 230, kind: "hall", floor: "mound", role: "arena" }, // 메아리 홀
      { id: "P3", x0: 1950, x1: 2550, fy: 7300, h: 210, kind: "hall", floor: "steps", role: "rest" }, // 낮은 굴
      { id: "P4", x0: 2800, x1: 3350, fy: 7392, h: 220, kind: "tiered", floor: "steps", role: "arena" }, // 탑 밑 굴
      { id: "C14", x0: 3460, x1: 4060, fy: 7776, h: 230, kind: "hall", floor: "flat", role: "rest" }, // 던전 옆 쉼터 (→ 던전 보물실 5)
      { id: "C11", x0: 1900, x1: 2500, fy: 8100, h: 240, kind: "small", floor: "flat", role: "treasure", ceil: "dome" }, // 수정 동굴
      { id: "C10", x0: 2900, x1: 3720, fy: 8240, h: 260, kind: "hall", floor: "flat", role: "rest", deep: 1 }, // ▼ 심연 동굴
    ],
    shafts: [{ x: 3240, top: 5472, bot: 6240, w: 200 }],
    // 띠마다 서쪽 무리와 동쪽 무리로 나눠 가로로는 끊고, 서쪽 무리는 바닥 구멍으로 아래 띠에 떨어진다 (지표 입구 → ▼ 동굴까지 내려가는 길)
    //   올라올 때는 동쪽 던전 탑이나 협곡으로
    links: [
      ["C4", "C1"], ["C2", "C3"], ["N1", "N2"], ["N3", "N4"], ["C5", "C7"], ["C7", "C12"], ["P1", "P2"], ["P3", "P4"], ["C9", "C11"], ["C11", "C10"],
      ["C3", "R00"], ["C13", "R10"], ["C8", "R20"], ["C12", "TE"], ["P4", "TE_d"], ["C14", "R60"], ["C10", "R71"],
    ],
    // 떨어지는 구멍 [위 방, 아래 방]
    //   셋째 값 = 구멍을 못 뚫을 때 대신 이을 옆길 (구멍으로만 드나드는 무리가 막히지 않게)
    drops: [["C1", "N2", ["N2", "N3"]], ["N1", "C5", ["N2", "N3"]], ["C5", "P2", ["P2", "P3"]], ["P1", "C9", ["P2", "P3"]], ["N4", "C7", ["N2", "N3"]], ["P3", "C11"]],
    // 동쪽 던전 (고대 유적): 격자 칸 512×384px, 6열 × 8층. 방은 직사각형, 길은 수평 문과 탑 방만
    //   내려가는 길: 정문 탑 → 1층 회랑 → 탑 A → 2층 투기장 → 탑 B → 3층 → 탑 C → 4층 → 탑 D → 5층 → 탑 E → 6층 → 탑 F → 7층 → 탑 G → 성소
    //   탑은 열을 바꿔 가며 놓아 층마다 가로로 지나가게 하고, 탑마다 발판 짜임이 다르다
    //   서쪽 벽 동굴 길 (cave): 1·2·3·5·7·8층 — 동굴 쪽에서만 들어가는 보물실도 있다
    dungeon: {
      x0: 4224,
      y0: 5120,
      cols: 6,
      stories: 8,
      gate: { door: 7250, col: 5 },
      // 탑: 열, 윗층 s (s·s+1 두 층), 윗층 문 쪽(up)·아랫층 문 쪽(down), 발판 짜임
      towers: [
        { id: "TA", col: 2, s: 0, up: "WE", down: "WE", pat: "zig" },
        { id: "TB", col: 5, s: 1, up: "W", down: "W", pat: "float" },
        { id: "TC", col: 1, s: 2, up: "WE", down: "WE", pat: "ring" },
        { id: "TD", col: 4, s: 3, up: "WE", down: "WE", pat: "pillar" },
        { id: "TE", col: 0, s: 4, up: "WE", down: "WE", pat: "zig", cave: "both" },
        { id: "TF", col: 3, s: 5, up: "WE", down: "WE", pat: "float" },
        { id: "TG", col: 5, s: 6, up: "W", down: "W", pat: "ring" },
      ],
      // 방: [열 시작, 열 끝, 층] 종류·역할. 같은 층 이웃 방은 문으로 잇는다. cave: 서쪽 벽에 동굴로 난 길
      rooms: [
        { id: "R00", c0: 0, c1: 1, s: 0, type: "guard", role: "arena", cave: 1 }, // 경비실 (산 밑 큰 공동과 이어짐)
        { id: "R01", c0: 3, c1: 4, s: 0, type: "colonnade", role: "arena" }, // 입구 회랑: 첫 전투
        { id: "R10", c0: 0, c1: 1, s: 1, type: "vault", role: "treasure", cave: 1 }, // 보물실 1 (이끼 굴 ↔ 탑 TA 아래층)
        { id: "R11", c0: 3, c1: 4, s: 1, type: "arena", role: "arena" }, // 투기장 1
        { id: "R20", c0: 0, c1: 0, s: 2, type: "trap", role: "trap", cave: 1 }, // 함정 복도 (동굴로)
        { id: "R21", c0: 2, c1: 3, s: 2, type: "colonnade", role: "arena" }, // 경비 회랑
        { id: "R22", c0: 4, c1: 4, s: 2, type: "guard", role: "arena" }, // 초소
        { id: "R30", c0: 0, c1: 0, s: 3, type: "shrine", role: "rest" }, // 쉼터 1
        { id: "R31", c0: 2, c1: 3, s: 3, type: "arena", role: "arena" }, // 투기장 2
        { id: "R32", c0: 5, c1: 5, s: 3, type: "vault", role: "treasure" }, // 보물실 2
        { id: "R41", c0: 1, c1: 2, s: 4, type: "trap", role: "trap" }, // 감옥 복도 (가시)
        { id: "R43", c0: 3, c1: 3, s: 4, type: "guard", role: "arena" }, // 간수실
        { id: "R42", c0: 5, c1: 5, s: 4, type: "shrine", role: "rest" }, // 쉼터 2
        { id: "R51", c0: 1, c1: 2, s: 5, type: "arena", role: "arena" }, // 투기장 3
        { id: "R52", c0: 4, c1: 5, s: 5, type: "vault", role: "treasure" }, // 보물 창고 (받침대 셋)
        { id: "R60", c0: 0, c1: 0, s: 6, type: "vault", role: "treasure", cave: 1 }, // 보물실 3 (동굴과 이어짐)
        { id: "R61", c0: 1, c1: 2, s: 6, type: "shrine", role: "rest" }, // 쉼터 3 (성소 앞)
        { id: "R62", c0: 4, c1: 4, s: 6, type: "guard", role: "arena" }, // 성소 문지기
        { id: "R71", c0: 0, c1: 1, s: 7, type: "vault", role: "treasure", cave: 1 }, // 성소 뒤 보물실 (▼ 동굴로)
        { id: "R70", c0: 2, c1: 4, s: 7, type: "sanctum", role: "arena" }, // 성소: 마지막 전투 + 큰 상자
      ],
    },
  },
};

// ── 설계도 변형 도구: 높이 옮기기 · 좌우 뒤집기 (그래스메어 하늘 설계를 하늘 구역으로 옮길 때) ──
const WZ = 8192;
const mapInner = (I, fx, fy) => I && {
  ...I,
  halls: (I.halls ?? []).map((h) => ({ ...h, ...xs(fx, h.x0, h.x1), F: fy(h.F), trap: h.trap ? sortX(fx(h.trap[0]), fx(h.trap[1])) : undefined })),
  pass: (I.pass ?? []).map(([xa, fa, xb, fb, w]) => [fx(xa), fy(fa), fx(xb), fy(fb), w].filter((v) => v !== undefined)),
  drops: (I.drops ?? []).map(([x0, x1, y0, y1]) => [...sortX(fx(x0), fx(x1)), fy(y0), fy(y1)]),
  mouths: (I.mouths ?? []).map((m) => ({ ...m, x: fx(m.x), F: fy(m.F), edge: m.edge != null ? fx(m.edge) : undefined, side: fx(0) > fx(1) ? (m.side === "W" ? "E" : "W") : m.side })),
};
const sortX = (a, b) => (a < b ? [a, b] : [b, a]);
const xs = (fx, x0, x1) => { const [a, b] = sortX(fx(x0), fx(x1)); return { x0: a, x1: b }; };
// 하늘 설계도 S를 (dx 뒤집기 여부 flip, 높이 dy)로 옮긴다
export function moveSky(S, { flip = false, dy = 0, W = WZ } = {}) {
  const fx = flip ? (x) => W - x : (x) => x, fy = (y) => y + dy;
  const swapId = (k) => {
    if (k.startsWith("g:")) return "g:" + fx(Number(k.slice(2)));
    if (k.startsWith("G:")) return "G:" + fx(Number(k.slice(2)));
    if (!flip) return k;
    return k.endsWith(">") ? k.slice(0, -1) + "<" : k.endsWith("<") ? k.slice(0, -1) + ">" : k;
  };
  return {
    ...S,
    peakY: fy(S.peakY),
    gate: S.gate && { ...S.gate, cx: fx(S.gate.cx), inner: mapInner(S.gate.inner, fx, fy) },
    isles: S.isles.map((q) => ({
      ...q, cx: fx(q.cx), top: fy(q.top),
      step: q.step && flip ? { ...q.step, at: 1 - q.step.at, hi: q.step.hi === "L" ? "R" : "L" } : q.step,
      inner: mapInner(q.inner, fx, fy),
    })),
    links: S.links.map(([a, b, n]) => [swapId(a), swapId(b), n].filter((v) => v !== undefined)),
  };
}
// 섬 몇 개만 바꾸기 (id → 덮어쓸 값, null이면 지움)
export function editSky(S, patch = {}, links = null) {
  const isles = S.isles.filter((q) => patch[q.id] !== null).map((q) => (patch[q.id] ? { ...q, ...patch[q.id] } : q));
  for (const [id, q] of Object.entries(patch)) q && !S.isles.some((p) => p.id === id) && isles.push({ id, ...q });
  return { ...S, isles, links: links ?? S.links };
}

// ── g1_m1 「스톤브리지 · 돌다리」 손 설계: 덩어리 섬 대신 길고 얇은 돌다리 판이 층층이 엇갈린다 ──
//   다리 열세 개가 서→동→서로 꺾이며 350px씩 오르고, 꺾이는 자리는 속에 옛 초소가 있는 돌탑 섬. 정상은 무너진 성(유적 방·계단 굴)
//   갈래: 다리 끝마다 짧은 보물 바위 · 동쪽 끝 전망탑
BLUEPRINTS.g1_m1 = {
  skyBase: 8000,
  flatWalk: 1,
  sky: {
    peakY: 1800,
    gate: {
      cx: 4350, w: 2700, sh: 600, tS: 1300, belly: 0.5, flat: true,
      inner: {
        kind: "ruin",
        halls: [
          { x0: 3050, x1: 3550, F: 3000, h: 220, type: "colonnade", role: "arena" }, // 서쪽 성벽 회랑
          { x0: 5150, x1: 5650, F: 3000, h: 220, type: "colonnade", role: "arena" }, // 동쪽 성벽 회랑
          { x0: 4000, x1: 4700, F: 2650, h: 240, type: "sanctum" }, // 옥좌실 (큰 상자)
        ],
        pass: [[3550, 3000, 4000, 2650, 150], [4700, 2650, 5150, 3000, 150], [4000, 2650, 3150, 1800, 150], [4700, 2650, 5550, 1800, 150]],
        mouths: [{ side: "W", x: 3050, F: 3000 }, { side: "E", x: 5650, F: 3000 }],
      },
    },
    isles: [
      { id: "B1", cx: 3300, top: 7650, w: 1800, t: 90, shape: "slab", role: "rest" }, // 첫 다리
      { id: "B2", cx: 1100, top: 7300, w: 1800, t: 90, shape: "slab", role: "arena" },
      { id: "B3", cx: 3300, top: 6950, w: 1800, t: 90, shape: "slab", role: "arena" },
      { id: "B4", cx: 5500, top: 6600, w: 1800, t: 90, shape: "slab", role: "rest" },
      { id: "K1", cx: 7400, top: 6250, w: 1100, t: 420, shape: "lumpy", role: "arena" }, // 동쪽 돌탑 섬 (꺾임)
      { id: "B6", cx: 5500, top: 5900, w: 1800, t: 90, shape: "slab", role: "arena" },
      { id: "B7", cx: 3300, top: 5550, w: 1800, t: 90, shape: "slab", role: "arena" },
      { id: "K2", cx: 1100, top: 5200, w: 1600, t: 420, shape: "lumpy", role: "rest" }, // 서쪽 돌탑 섬 (쉼터)
      { id: "B9", cx: 3300, top: 4900, w: 1800, t: 90, shape: "slab", role: "arena" },
      { id: "B10", cx: 5500, top: 4550, w: 1800, t: 90, shape: "slab", role: "arena" },
      { id: "K3", cx: 7500, top: 4200, w: 1100, t: 420, shape: "lumpy", role: "arena" }, // 동쪽 돌탑 섬 2
      { id: "B12", cx: 5500, top: 3850, w: 1800, t: 90, shape: "slab", role: "rest" },
      { id: "B13", cx: 7550, top: 3500, w: 1100, t: 90, shape: "slab", role: "arena" },
      { id: "P", cx: 6275, top: 3200, w: 550, t: 260, shape: "spire", role: "arena" }, // 성문 앞 돌기둥
      // 갈래
      { id: "T1", cx: 7600, top: 7650, w: 500, t: 150, shape: "spire", role: "treasure" }, // 땅 가까운 동쪽 보물 바위
      { id: "T2", cx: 3900, top: 3500, w: 600, t: 240, shape: "spire", role: "vista" }, // 성 밑 전망탑
      { id: "T3", cx: 6400, top: 1650, w: 600, t: 300, shape: "lumpy", role: "treasure" }, // 성 동쪽 보물섬
    ],
    links: [
      ["g:4600", "B1"], ["B1", "B2"], ["B2", "B3"], ["B3", "B4"], ["B4", "K1"], ["K1", "B6"], ["B6", "B7"], ["B7", "K2"],
      ["K2", "B9"], ["B9", "B10"], ["B10", "K3"], ["K3", "B12"], ["B12", "B13"], ["B13", "P"], ["P", "G>"],
      ["g:6900", "T1"], ["B12", "T2"], ["G", "T3"],
    ],
  },
};

// ── g0_m1 「그린스텝 · 하늘 계단」 손 설계: 기초 땅(구름 섬 길)은 맨 아래 8000, 그 위로 넓은 풀 계단밭 섬이 지그재그로 쌓인다 ──
//   동쪽으로 다섯 단 → 서쪽으로 네 단 → 동쪽으로 네 단 → 정상 풀밭(▲) 동쪽 굴로. 단마다 350px씩 오르고, 섬은 계단밭(tiers)이라 윗면도 층층이
//   갈래: 땅 가까이 서쪽 보물섬 · 가운데 높이 동쪽 끝 전망섬 · 정상 위 보물섬 둘
BLUEPRINTS.g0_m1 = {
  skyBase: 8000,
  flatWalk: 1,
  sky: {
    peakY: 1600,
    gate: {
      cx: 4350, w: 2600, sh: 600, tS: 1300, belly: 0.6, flat: true,
      inner: {
        halls: [
          { x0: 3100, x1: 3550, F: 2800, h: 210, type: "colonnade", role: "arena" }, // 서쪽 풀밭 굴
          { x0: 5150, x1: 5600, F: 2800, h: 210, role: "arena" }, // 동쪽 풀밭 굴
          { x0: 4000, x1: 4700, F: 2450, h: 230, type: "sanctum" }, // 정상 아래 성소 (큰 상자)
        ],
        pass: [[3550, 2800, 4000, 2450, 150], [4700, 2450, 5150, 2800, 150], [4000, 2450, 3150, 1600, 150], [4700, 2450, 5550, 1600, 150]],
        mouths: [{ side: "W", x: 3100, F: 2800 }, { side: "E", x: 5600, F: 2800 }],
      },
    },
    isles: [
      { id: "A", cx: 1700, top: 7600, w: 1000, t: 220, shape: "slab", role: "rest" }, // 첫 계단밭
      { id: "B", cx: 3200, top: 7300, w: 1000, t: 360, shape: "twin", role: "arena" },
      { id: "C", cx: 4700, top: 6950, w: 1000, t: 360, shape: "chunk", role: "arena" },
      { id: "D", cx: 6200, top: 6600, w: 1000, t: 360, shape: "twin", role: "rest" },
      { id: "E", cx: 7600, top: 6250, w: 800, t: 320, shape: "lumpy", role: "arena" }, // 동쪽 꺾임 섬
      { id: "F", cx: 6200, top: 5900, w: 1000, t: 360, shape: "chunk", role: "arena" },
      { id: "G2", cx: 4700, top: 5550, w: 1000, t: 360, shape: "block", form: "bowl", role: "rest", inner: { halls: [{ x0: 4400, x1: 4800, F: 5800, h: 200, kind: "pool", role: "treasure" }], pass: [[4800, 5800, 5100, 5550]], mouths: [] } }, // 샘 굴 섬
      { id: "H", cx: 3200, top: 5200, w: 1000, t: 360, shape: "twin", role: "arena" },
      { id: "I", cx: 1650, top: 4850, w: 1100, t: 360, shape: "lumpy", role: "rest" }, // 서쪽 꺾임 섬
      { id: "J", cx: 3200, top: 4500, w: 1000, t: 360, shape: "chunk", role: "arena" },
      { id: "K", cx: 4700, top: 4150, w: 1000, t: 360, shape: "twin", role: "arena" },
      { id: "L", cx: 6200, top: 3800, w: 1000, t: 360, shape: "chunk", role: "rest" },
      { id: "M", cx: 7600, top: 3420, w: 800, t: 320, shape: "lumpy", role: "arena" },
      { id: "P", cx: 6500, top: 3100, w: 800, t: 300, shape: "slab", role: "arena" }, // 정상 앞 판섬
      // 갈래
      { id: "T1", cx: 450, top: 7450, w: 500, t: 240, shape: "spire", role: "treasure" }, // 땅 가까운 서쪽 보물섬
      { id: "V1", cx: 400, top: 4500, w: 500, t: 260, shape: "spire", role: "vista" }, // 서쪽 끝 전망섬
      { id: "T2", cx: 2500, top: 1450, w: 600, t: 280, shape: "lumpy", role: "treasure" }, // 정상 서쪽 보물섬
      { id: "T3", cx: 6200, top: 1400, w: 600, t: 280, shape: "lumpy", role: "treasure" }, // 정상 동쪽 보물섬
    ],
    links: [
      ["g:2700", "A"], ["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"], ["E", "F"], ["F", "G2"], ["G2", "H"], ["H", "I"],
      ["I", "J"], ["J", "K"], ["K", "L"], ["L", "M"], ["M", "P"], ["P", "G>"],
      ["A", "T1"], ["I", "V1"], ["G", "T2"], ["G", "T3"],
    ],
  },
};
// ── gm1_m1 「리프크라운 · 잎 왕관」 손 설계: 작은 섬 대신 거대한 잎 덩어리 층이 위로 갈수록 좁아지며 쌓인다 (나무 왕관 모양) ──
//   층마다 끝에서 끝까지 잎 위를 길게 걷고, 끝의 잔가지 섬(나뭇가지)을 밟아 다음 층으로. 꼭대기는 왕관 정상 (▲, 동쪽 굴)
//   갈래: 층 아래로 매달린 새 둥지 보물섬 · 서쪽 높은 전망 가지
BLUEPRINTS.gm1_m1 = {
  skyBase: 8000,
  flatWalk: 1,
  sky: {
    peakY: 1700,
    gate: {
      cx: 4350, w: 2700, sh: 600, tS: 1200, belly: 0.6, flat: true,
      inner: {
        halls: [
          { x0: 3100, x1: 3550, F: 2800, h: 210, role: "arena" }, // 서쪽 잎굴
          { x0: 5150, x1: 5600, F: 2800, h: 210, role: "arena" }, // 동쪽 잎굴
          { x0: 4000, x1: 4700, F: 2450, h: 230, type: "sanctum" }, // 왕관 속 둥지 (큰 상자)
        ],
        pass: [[3550, 2800, 4000, 2450, 150], [4700, 2450, 5150, 2800, 150], [4000, 2450, 3150, 1700, 150], [4700, 2450, 5550, 1700, 150]],
        mouths: [{ side: "W", x: 3100, F: 2800 }, { side: "E", x: 5600, F: 2800 }],
      },
    },
    isles: [
      { id: "L1", cx: 4050, top: 7600, w: 5700, t: 240, shape: "lumpy", role: "rest", mat: "leaf" }, // 맨 아래 잎 층
      { id: "W1", cx: 7550, top: 7250, w: 500, t: 160, shape: "slab", role: "arena", mat: "wood" }, // 잔가지
      { id: "L2", cx: 4350, top: 6900, w: 4800, t: 260, shape: "lumpy", role: "arena", mat: "leaf" },
      { id: "W2", cx: 1200, top: 6550, w: 400, t: 160, shape: "slab", role: "rest", mat: "wood" },
      { id: "L3", cx: 3950, top: 6200, w: 4100, t: 260, shape: "lumpy", role: "arena", mat: "leaf" },
      { id: "W3", cx: 6650, top: 5850, w: 500, t: 160, shape: "slab", role: "arena", mat: "wood" },
      { id: "L4", cx: 4000, top: 5500, w: 3600, t: 260, shape: "lumpy", role: "rest", mat: "leaf" },
      { id: "W4", cx: 1400, top: 5150, w: 600, t: 160, shape: "slab", role: "arena", mat: "wood" },
      { id: "L5", cx: 3900, top: 4800, w: 3200, t: 260, shape: "lumpy", role: "arena", mat: "leaf" },
      { id: "W5", cx: 6150, top: 4450, w: 500, t: 160, shape: "slab", role: "arena", mat: "wood" },
      { id: "L6", cx: 4100, top: 4100, w: 2600, t: 260, shape: "lumpy", role: "rest", mat: "leaf" },
      { id: "W6", cx: 1950, top: 3750, w: 500, t: 160, shape: "slab", role: "arena", mat: "wood" },
      { id: "L7", cx: 4100, top: 3450, w: 3000, t: 240, shape: "lumpy", role: "arena", mat: "leaf" },
      { id: "W7", cx: 6250, top: 3100, w: 500, t: 160, shape: "slab", role: "arena", mat: "wood" },
      // 갈래
      { id: "N1", cx: 7700, top: 6200, w: 500, t: 200, shape: "spire", role: "treasure", mat: "wood" }, // 새 둥지 보물 가지 (동)
      { id: "N2", cx: 450, top: 4800, w: 500, t: 200, shape: "spire", role: "vista", mat: "wood" }, // 서쪽 높은 전망 가지
      { id: "N3", cx: 6500, top: 1550, w: 600, t: 260, shape: "lumpy", role: "treasure", mat: "leaf" }, // 왕관 동쪽 보물 잎
    ],
    links: [
      ["g:600", "L1"], ["L1", "W1"], ["W1", "L2"], ["L2", "W2"], ["W2", "L3"], ["L3", "W3"], ["W3", "L4"], ["L4", "W4"],
      ["W4", "L5"], ["L5", "W5"], ["W5", "L6"], ["L6", "W6"], ["W6", "L7"], ["L7", "W7"], ["W7", "G>"],
      ["W3", "N1"], ["W4", "N2"], ["G", "N3"],
    ],
  },
};

// ── gm1_0 「모스바크」: 이끼 덮인 거목 숲 (지상). 그래스메어 땅·하늘 짜임을 좌우로 뒤집고 숲답게 ──
//   지표: 0~900 숲 입구 · 900~2400 이끼 고원(전투) · 2400~5250 거목 언덕(하늘 출발점) · 5300~6300 개울 골짜기(웅덩이) · 6300~7500 뿌리 둔덕(전투) · 7500~ 출구
//   하늘: 거목 수관 섬들 (뿌리가 늘어진 섬 · 둥근 잎 덩이 섬), ▲ 신전 섬은 이끼 덮인 옛 신전
//   땅속: 자연 동굴 (입구 둘: 개울 골짜기 · 뿌리 둔덕)
{
  const G0 = BLUEPRINTS.g1_0, fx = (x) => WZ - x;
  const surf = G0.surface.map((q) => {
    const o = { ...q, a: fx(q.b), b: fx(q.a) };
    if (q.c != null) o.c = fx(q.c);
    if (q.bumps) o.bumps = q.bumps.map((b) => ({ ...b, c: fx(b.c), h: Math.round(b.h * 1.15) }));
    if (q.kind === "mountain") Object.assign(o, { wl: q.wr, wr: q.wl, h: 560, shoulder: q.shoulder && { ...q.shoulder, side: q.shoulder.side ? 0 : 1 } });
    if (q.kind === "valley") Object.assign(o, { d: 150, pond: 220 });
    return o;
  }).reverse();
  const S0 = moveSky(G0.sky, { flip: true });
  const S1 = editSky(S0, {
    A1: { shape: "lumpy", role: "rest" }, M: { shape: "twin", role: "vista" },
    W1: { form: "roots" }, E2: { form: "roots" }, W3: { form: "roots" }, E4: { form: "bowl" }, W4: { form: "cone" }, E5: { form: "roots" },
    W5: { shape: "lumpy" }, E6: { shape: "lumpy" }, W6: { shape: "twin" }, E7: { shape: "lumpy" }, W7: { shape: "spire" },
  });
  BLUEPRINTS.gm1_0 = {
    surface: surf,
    pads: [],
    spots: G0.spots.map((q) => ({ ...q, xa: fx(q.xb), xb: fx(q.xa) })),
    mouthX: [5600, 6900],
    sky: S1,
  };
}

// ── 동굴 구역 셋 (y=1 줄): 같은 동굴 생성기에 지역마다 다른 짜임과 소품 (natgen.js CAVE_STYLE) ──
//   g1_1 드립스톤: 종유석 대공동 · 지하 호수 · 높은 천장 / g0_1 아이언베인: 옛 갱도 · 나무 판자 벽과 횃불 · 광맥 수정
//   gm1_1 루트홀로우: 둥근 굴방 · 뿌리 기둥 · 늘어진 뿌리와 빛 버섯
// 동굴 방 한 줄: [id, x0, x1, 바닥 y, 높이, 종류, 바닥, 역할, 덧붙임(peak·deep·entry)]
const cvR = (rows) => rows.map(([id, x0, x1, fy, h, kind, floor, role, ex]) => ({ id, x0, x1, fy, h, kind, floor, role, ...(ex ?? {}) }));

// ── g1_1 「드립스톤 · 수몰 사원」 손 설계: 자연 동굴이 주인공 ──
//   가운데에 물에 잠긴 석회 사원(5열 7층). 사원 정문 탑 꼭대기 = ▲ 하늘 구멍, 사원 서쪽 벽에서 동굴 갈래 다섯이 뻗는다
//   서쪽 위: 천장을 덮은 종유석 대공동 / 서쪽 가운데: 박쥐 둥지·석회 다락·물웅덩이(입구 길) / 서쪽 아래: 지하 호수 → 검은 물가
//   동쪽: 메아리 굴 · 동쪽 입구 · 협곡 어귀 → 중턱 → 바닥(폭포처럼 구멍 셋) / 바닥: 심연 입구(▼) 와 바닥 보물굴
//   위아래는 사원 탑과 떨어지는 구멍으로, 동굴은 비탈 굴로만 (사다리·세로 갱도 없음)
BLUEPRINTS.g1_1 = {
  cave: { style: "drip" },
  caves: cvR([
    // 꼭대기
    ["T0", 80, 440, 2500, 240, "small", "flat", "treasure"], // 천장 보물굴
    ["GR", 600, 2900, 2600, 620, "grand", "basin", "vista"], // 종유석 대공동
    ["PK", 4272, 5100, 2880, 300, "hall", "flat", "rest", { peak: 1 }], // ▲ 하늘 구멍 (사원 정문 탑 꼭대기)
    ["T1", 5600, 6900, 2500, 340, "tiered", "steps", "arena"], // 고드름 회랑
    ["T2", 7400, 8050, 2100, 260, "small", "flat", "treasure"], // 얼음 틈
    // 서쪽 갈래
    ["W1a", 2500, 3300, 3700, 340, "tiered", "steps", "arena"], // 물방울 회랑
    ["W1b", 900, 2000, 3400, 340, "hall", "mound", "arena"], // 박쥐 둥지
    ["W2a", 2700, 3350, 4250, 300, "hall", "flat", "rest"], // 흐름돌 계단참
    ["W2b", 1000, 2200, 4150, 340, "pillared", "flat", "arena"], // 석회 다락
    ["W3a", 2700, 3350, 4800, 300, "hall", "steps", "arena"], // 첫 갈림굴
    ["W3m", 1300, 2200, 4850, 300, "lake", "basin", "rest"], // 석회 물웅덩이
    ["EL", 64, 800, 4800, 300, "hall", "flat", "rest", { entry: "L" }],
    ["W4a", 2400, 3350, 5350, 380, "pillared", "mound", "arena"], // 흰 기둥 홀
    ["W4b", 500, 1800, 5500, 340, "hall", "flat", "arena"], // 젖은 굴
    ["W5a", 1700, 3300, 6050, 440, "lake", "basin", "treasure"], // 지하 호수 (물 건너 보물)
    ["W5b", 200, 1200, 6350, 320, "hall", "steps", "rest"], // 검은 물가
    // 바닥
    ["B1", 150, 1300, 7000, 340, "tiered", "steps", "arena"], // 가라앉은 계단
    ["B2", 1760, 2500, 7400, 320, "hall", "mound", "arena"], // 갑충 굴
    ["DP", 3150, 4400, 7950, 380, "hall", "flat", "rest", { deep: 1 }], // ▼ 심연 입구
    ["B3", 4900, 5800, 7900, 280, "small", "flat", "treasure"], // 바닥 보물굴
    ["B4", 6300, 7400, 7500, 360, "hall", "flat", "arena"], // 협곡 바닥
    // 동쪽
    ["E2", 6950, 7900, 3300, 340, "hall", "steps", "rest"], // 메아리 굴
    ["ER", 6950, 8100, 4800, 340, "hall", "mound", "rest", { entry: "R" }],
    ["E3", 6950, 8050, 6000, 380, "tiered", "steps", "arena"], // 협곡 어귀
    ["E4", 6950, 8050, 6700, 340, "hall", "flat", "arena"], // 협곡 중턱
  ]),
  // 수몰 사원: 5열 7층 (x 3840~6400, y 3200~5888). 정문 탑(VG)은 ▲ 방 높이에서 1층으로, 서쪽 벽엔 대공동으로 난 문
  dungeon: {
    x0: 3840, y0: 3200, cols: 5, stories: 7, wall: "brick", step: 6, stairs: 1,
    gate: { col: 0, row: 2880, door: 4272, up: "WE", down: "E", cave: "up" },
    towers: [
      { id: "TA", col: 2, s: 0, up: "WE", down: "WE", pat: "zig" },
      { id: "TB", col: 4, s: 1, up: "W", down: "W", pat: "float" },
      { id: "TC", col: 0, s: 2, up: "WE", down: "WE", pat: "ring", cave: "both" },
      { id: "TD", col: 3, s: 3, up: "WE", down: "WE", pat: "pillar" },
      { id: "TE", col: 1, s: 4, up: "WE", down: "WE", pat: "zig" },
      { id: "TF", col: 4, s: 5, up: "W", down: "W", pat: "float", caveE: "down" },
    ],
    rooms: [
      { id: "R01", c0: 1, c1: 1, s: 0, type: "guard", role: "arena" }, // 물에 잠긴 문간
      { id: "R03", c0: 3, c1: 4, s: 0, type: "colonnade", role: "arena", cave: "E" }, // 위 회랑 (메아리 굴로)
      { id: "R10", c0: 0, c1: 1, s: 1, type: "vault", role: "treasure", cave: 1 }, // 보물실 (물방울 회랑으로)
      { id: "R13", c0: 3, c1: 3, s: 1, type: "shrine", role: "rest" }, // 샘 쉼터
      { id: "R21", c0: 1, c1: 2, s: 2, type: "arena", role: "arena" }, // 투기장
      { id: "R23", c0: 3, c1: 3, s: 2, type: "guard", role: "arena" }, // 초소
      { id: "R31", c0: 1, c1: 2, s: 3, type: "trap", role: "trap" }, // 물 고인 함정 복도
      { id: "R34", c0: 4, c1: 4, s: 3, type: "vault", role: "treasure", cave: "E" }, // 동쪽 보물실 (동쪽 입구로)
      { id: "R40", c0: 0, c1: 0, s: 4, type: "guard", role: "arena", cave: 1 }, // 서쪽 초소 (흰 기둥 홀로)
      { id: "R42", c0: 2, c1: 2, s: 4, type: "shrine", role: "rest" }, // 샘 쉼터 2
      { id: "R44", c0: 4, c1: 4, s: 4, type: "colonnade", role: "arena" }, // 아래 회랑
      { id: "R50", c0: 0, c1: 0, s: 5, type: "vault", role: "treasure" }, // 깊은 보물실
      { id: "R52", c0: 2, c1: 3, s: 5, type: "arena", role: "arena" }, // 투기장 2
      { id: "R60", c0: 0, c1: 3, s: 6, type: "sanctum", role: "arena", cave: 1 }, // 성소 (지하 호수로)
    ],
  },
  links: [
    ["T0", "GR"], ["GR", "VG"], ["PK", "T1"], ["T1", "T2"],
    ["W1b", "W1a"], ["W1a", "R10"], ["W2b", "W2a"], ["W2a", "TC"],
    ["EL", "W3m"], ["W3m", "W3a"], ["W3a", "TC_d"], ["W4b", "W4a"], ["W4a", "R40"],
    ["W5b", "W5a"], ["W5a", "R60"], ["B1", "B2"], ["B2", "DP"], ["DP", "B3"], ["B3", "B4"],
    ["R03", "E2"], ["R34", "ER"], ["TF", "E3"],
  ],
  // 떨어지는 구멍: 대공동 → 박쥐 둥지 → 석회 다락 → 물웅덩이 / 젖은 굴 → 검은 물가 → 가라앉은 계단 / 협곡 폭포 둘
  drops: [["GR", "W1b"], ["W1b", "W2b"], ["W2b", "W3m"], ["W4b", "W5b"], ["W5b", "B1"], ["E3", "E4"], ["E4", "B4"]],
};
// ── g0_1 「아이언베인 · 광산 요새」 손 설계: 던전이 주인공 ──
//   가운데를 7열 9층 옛 광산 요새가 차지한다 (승강 탑 아홉, 나무 판자 벽). 층마다 긴 갱도 회랑 · 광석 창고 · 선로 함정 · 광부 쉼터
//   ▲는 요새 꼭대기 정문 탑 위 환기구, 동굴은 요새 바깥 껍데기에 붙은 광맥굴뿐 (서쪽 채굴장 · 수정 광맥 · 지하수 갱 / 동쪽 선광장 · 광차 창고)
//   ▼는 맨 아래 무너진 갱 → 깊은 광맥 대공동 → 심연 입구
BLUEPRINTS.g0_1 = {
  cave: { style: "mine" },
  caves: cvR([
    ["T", 900, 2050, 2650, 300, "hall", "flat", "treasure"], // 높은 광맥 (정문 탑 서쪽 문)
    ["PK", 4272, 5300, 2752, 300, "hall", "flat", "rest", { peak: 1 }], // ▲ 환기구
    ["E0", 5800, 6800, 2500, 300, "tiered", "steps", "arena"], // 환기 갱
    ["E0b", 7300, 8000, 2200, 260, "small", "flat", "treasure"], // 막힌 환기 갱 끝
    ["W0", 400, 1900, 3300, 420, "grand", "steps", "vista"], // 버려진 채굴장
    ["E1", 6450, 7700, 3300, 380, "pillared", "flat", "arena"], // 선광장
    ["W1b", 200, 900, 4000, 320, "hall", "mound", "treasure"], // 수정 광맥굴
    ["W1", 1300, 1950, 4300, 260, "small", "flat", "rest"], // 광부 쉼터
    ["E3", 6400, 7600, 4300, 300, "hall", "mound", "arena"], // 버력 더미 굴
    ["EL", 64, 900, 4800, 300, "hall", "flat", "rest", { entry: "L" }],
    ["WM", 1250, 1900, 4900, 280, "hall", "flat", "arena"], // 옛 갱도 입구
    ["ER", 7000, 8100, 4800, 300, "hall", "flat", "rest", { entry: "R" }],
    ["E5", 6450, 7500, 5500, 320, "hall", "flat", "treasure"], // 광차 창고
    ["W6b", 100, 650, 5650, 280, "small", "flat", "treasure"], // 물에 잠긴 굴 끝
    ["W6", 1000, 1900, 5900, 320, "lake", "basin", "rest"], // 지하수 갱
    ["W8", 1200, 1950, 6700, 320, "hall", "steps", "arena"], // 무너진 갱
    ["E8", 6400, 7300, 6700, 340, "hall", "flat", "arena"], // 용광로 뒤 갱
    ["W9", 800, 2400, 7450, 400, "grand", "basin", "vista"], // 깊은 광맥 대공동
    ["E10", 6300, 7800, 7650, 380, "pillared", "flat", "arena"], // 무너진 지주 홀
    ["DP", 3150, 4300, 7900, 360, "hall", "flat", "rest", { deep: 1 }], // ▼ 심연 입구
    ["E9", 4900, 5900, 8000, 300, "hall", "flat", "treasure"], // 바닥 광석 더미
  ]),
  // 광산 요새: 7열 9층 (x 2304~5888, y 3072~6528). 정문 탑(가운데 열)이 ▲ 환기구로, 양쪽 벽 동굴 문 열
  dungeon: {
    x0: 2304, y0: 3072, cols: 7, stories: 9, wall: "wood", step: 6, stairs: 1,
    gate: { col: 3, row: 2752, door: 4272, up: "WE", down: "WE", cave: "up" },
    towers: [
      { id: "TA", col: 1, s: 0, up: "WE", down: "WE" },
      { id: "TB", col: 5, s: 1, up: "WE", down: "WE" },
      { id: "TC", col: 3, s: 2, up: "WE", down: "WE" },
      { id: "TD", col: 0, s: 3, up: "WE", down: "WE", cave: "both" },
      { id: "TE", col: 6, s: 3, up: "WE", down: "WE", caveE: "both" },
      { id: "TF", col: 2, s: 4, up: "WE", down: "WE" },
      { id: "TG", col: 4, s: 5, up: "WE", down: "WE" },
      { id: "TH", col: 1, s: 6, up: "WE", down: "WE" },
      { id: "TI", col: 5, s: 7, up: "WE", down: "WE" },
    ],
    rooms: [
      { id: "R00", c0: 0, c1: 0, s: 0, type: "vault", role: "treasure", cave: 1 }, // 꼭대기 광석 창고
      { id: "R02", c0: 2, c1: 2, s: 0, type: "guard", role: "arena" }, // 정문 경비실
      { id: "R04", c0: 4, c1: 6, s: 0, type: "colonnade", role: "arena", cave: "E" }, // 1층 갱도 회랑
      { id: "R10", c0: 0, c1: 0, s: 1, type: "guard", role: "arena" }, // 십장 초소
      { id: "R12", c0: 2, c1: 4, s: 1, type: "arena", role: "arena" }, // 광부 숙소 (싸움터)
      { id: "R16", c0: 6, c1: 6, s: 1, type: "vault", role: "treasure" }, // 공구 창고
      { id: "R20", c0: 0, c1: 2, s: 2, type: "colonnade", role: "arena" }, // 2층 갱도 회랑
      { id: "R24", c0: 4, c1: 4, s: 2, type: "shrine", role: "rest" }, // 광부 쉼터
      { id: "R26", c0: 6, c1: 6, s: 2, type: "guard", role: "arena" }, // 동쪽 초소
      { id: "R31", c0: 1, c1: 2, s: 3, type: "trap", role: "trap" }, // 선로 함정 복도
      { id: "R34", c0: 4, c1: 5, s: 3, type: "guard", role: "arena" }, // 화약고 경비
      { id: "R41", c0: 1, c1: 1, s: 4, type: "vault", role: "treasure" }, // 화약고
      { id: "R43", c0: 3, c1: 5, s: 4, type: "arena", role: "arena" }, // 제련 홀
      { id: "R50", c0: 0, c1: 1, s: 5, type: "colonnade", role: "arena" }, // 5층 갱도 회랑
      { id: "R53", c0: 3, c1: 3, s: 5, type: "shrine", role: "rest" }, // 물 쉼터
      { id: "R55", c0: 5, c1: 6, s: 5, type: "guard", role: "arena", cave: "E" }, // 광차 출입구
      { id: "R60", c0: 0, c1: 0, s: 6, type: "vault", role: "treasure", cave: 1 }, // 지하수 쪽 창고
      { id: "R62", c0: 2, c1: 3, s: 6, type: "trap", role: "trap" }, // 무너지는 복도
      { id: "R65", c0: 5, c1: 6, s: 6, type: "vault", role: "treasure" }, // 금고
      { id: "R70", c0: 0, c1: 0, s: 7, type: "guard", role: "arena" }, // 깊은 초소
      { id: "R72", c0: 2, c1: 4, s: 7, type: "arena", role: "arena" }, // 용광로 홀
      { id: "R76", c0: 6, c1: 6, s: 7, type: "shrine", role: "rest" }, // 깊은 쉼터
      { id: "R80", c0: 0, c1: 4, s: 8, type: "sanctum", role: "arena", cave: 1 }, // 십장의 금고 (성소)
      { id: "R86", c0: 6, c1: 6, s: 8, type: "vault", role: "treasure", cave: "E" }, // 바닥 창고
    ],
  },
  links: [
    ["T", "VG"], ["PK", "E0"], ["E0", "E0b"], ["W0", "R00"], ["R04", "E1"],
    ["W1b", "W1"], ["W1", "TD"], ["EL", "WM"], ["WM", "TD_d"], ["TE", "E3"], ["TE_d", "ER"], ["R55", "E5"],
    ["W6b", "W6"], ["W6", "R60"], ["W8", "R80"], ["W9", "DP"], ["DP", "E9"], ["R86", "E8"], ["E9", "E10"],
  ],
  drops: [["W8", "W9"], ["E8", "E10"]],
};

// ── gm1_1 「루트홀로우 · 뿌리 속」 손 설계: 세로로 박힌 고목 줄기가 주인공 ──
//   가운데에 3열 10층 고목 줄기(나무껍질 성채): 탑이 좌우로 엇갈리며 꼭대기 ▲ 에서 바닥까지 내려가고, 가운데 열엔 방이 한 칸씩
//   줄기의 탑마다 뿌리 굴이 양옆 아래로 뻗는다 (빛 버섯 숲 · 뿌리 웅덩이 · 독 포자 굴). 맨 아래엔 거대한 뿌리 심장 공동, 그 서쪽에 ▼
BLUEPRINTS.gm1_1 = {
  cave: { style: "root" },
  caves: cvR([
    ["A0b", 300, 1300, 2100, 280, "hall", "mound", "treasure"], // 말라붙은 뿌리굴
    ["A0", 1800, 3000, 2300, 320, "hall", "mound", "arena"], // 뿌리 꼭대기 굴
    ["PK", 4016, 4900, 2400, 300, "hall", "flat", "rest", { peak: 1 }], // ▲ 줄기 꼭대기 옹이 구멍
    ["E0", 5500, 6800, 2200, 300, "hall", "mound", "arena"], // 윗뿌리 회랑
    ["E0b", 7300, 8050, 1900, 260, "small", "flat", "treasure"], // 새 둥지 굴
    ["W2b", 600, 1700, 3000, 340, "hall", "mound", "arena"], // 굼벵이 굴
    ["W2", 2300, 3100, 3400, 340, "hall", "mound", "arena"], // 껍질 틈 굴
    ["E1", 5600, 6900, 3300, 360, "hall", "mound", "arena"], // 노움 굴
    ["E1b", 7400, 8050, 3000, 280, "small", "flat", "treasure"], // 노움 보물굴
    ["W3", 2400, 3150, 3900, 300, "hall", "flat", "rest"], // 뿌리 쉼터
    ["W3b", 400, 1900, 4000, 420, "pillared", "mound", "rest"], // 빛 버섯 숲
    ["E3", 5600, 7000, 4250, 380, "lake", "basin", "rest"], // 뿌리 웅덩이
    ["EL", 64, 900, 4800, 300, "hall", "flat", "rest", { entry: "L" }],
    ["WE", 1500, 2700, 4950, 340, "hall", "mound", "arena"], // 뿌리 입구 굴
    ["EM", 5600, 6300, 4900, 300, "hall", "flat", "arena"], // 동쪽 뿌리목
    ["ER", 6800, 8100, 4800, 320, "hall", "flat", "rest", { entry: "R" }],
    ["W6", 2500, 3150, 5450, 320, "lake", "basin", "rest"], // 뿌리 물웅덩이
    ["W6b", 700, 2000, 5700, 380, "hall", "mound", "arena"], // 버섯 사슴 굴
    ["E7", 5600, 7200, 5700, 380, "pillared", "mound", "arena"], // 독 포자 굴
    ["E7b", 7600, 8050, 5400, 260, "small", "flat", "treasure"], // 포자 주머니 굴
    ["W8", 2400, 3150, 6250, 320, "hall", "steps", "arena"], // 썩은 뿌리 굴
    ["W8b", 600, 1900, 6600, 360, "pillared", "mound", "arena"], // 망령 굴
    ["E9", 5500, 6400, 6650, 300, "hall", "flat", "arena"], // 뿌리 끝 굴
    ["W9", 500, 2000, 7550, 380, "hall", "mound", "treasure"], // 잔뿌리 굴
    ["DP", 2500, 3500, 7950, 360, "hall", "flat", "rest", { deep: 1 }], // ▼ 뿌리 밑 구멍
    ["HEART", 3900, 6200, 7800, 600, "grand", "mound", "vista"], // 뿌리 심장 공동
  ]),
  // 고목 줄기: 3열 10층 (x 3584~5120, y 2560~6400). 탑이 왼쪽·오른쪽 끝 열을 번갈아 두 층씩, 가운데 열은 방
  dungeon: {
    x0: 3584, y0: 2560, cols: 3, stories: 10, wall: "wood", mat: "wood", step: 6, stairs: 1,
    gate: { col: 0, row: 2400, door: 4016, up: "WE", down: "E", cave: "up" },
    towers: [
      { id: "T1", col: 2, s: 0, up: "W", down: "W", caveE: "both" },
      { id: "T2", col: 0, s: 1, up: "E", down: "E", cave: "both" },
      { id: "T3", col: 2, s: 2, up: "W", down: "W", caveE: "both" },
      { id: "T4", col: 0, s: 3, up: "E", down: "E", cave: "both" },
      { id: "T5", col: 2, s: 4, up: "W", down: "W", caveE: "both" },
      { id: "T6", col: 0, s: 5, up: "E", down: "E", cave: "both" },
      { id: "T7", col: 2, s: 6, up: "W", down: "W", caveE: "both" },
      { id: "T8", col: 0, s: 7, up: "E", down: "E", cave: "both" },
      { id: "T9", col: 2, s: 8, up: "W", down: "W", caveE: "both" },
    ],
    rooms: [
      { id: "M0", c0: 1, c1: 1, s: 0, type: "guard", role: "arena" }, // 옹이 문간
      { id: "M1", c0: 1, c1: 1, s: 1, type: "shrine", role: "rest" }, // 수액 샘
      { id: "M2", c0: 1, c1: 1, s: 2, type: "vault", role: "treasure" }, // 도토리 창고
      { id: "M3", c0: 1, c1: 1, s: 3, type: "guard", role: "arena" }, // 뿌리 초소
      { id: "M4", c0: 1, c1: 1, s: 4, type: "trap", role: "trap" }, // 가시 덩굴 복도
      { id: "M5", c0: 1, c1: 1, s: 5, type: "arena", role: "arena" }, // 나이테 홀
      { id: "M6", c0: 1, c1: 1, s: 6, type: "shrine", role: "rest" }, // 수액 샘 2
      { id: "M7", c0: 1, c1: 1, s: 7, type: "vault", role: "treasure" }, // 씨앗 창고
      { id: "M8", c0: 1, c1: 1, s: 8, type: "guard", role: "arena" }, // 뿌리 문지기
      { id: "M9", c0: 0, c1: 1, s: 9, type: "sanctum", role: "arena" }, // 줄기 밑동 성소
    ],
  },
  links: [
    ["A0b", "A0"], ["A0", "VG"], ["PK", "E0"], ["E0", "E0b"],
    ["W2b", "W2"], ["W2", "T2"], ["T1_d", "E1"], ["E1", "E1b"],
    ["W3b", "W3"], ["W3", "T2_d"], ["T3_d", "E3"],
    ["EL", "WE"], ["WE", "T6"], ["T5_d", "EM"], ["EM", "ER"],
    ["W6b", "W6"], ["W6", "T6_d"], ["T7_d", "E7"], ["E7", "E7b"],
    ["W8b", "W8"], ["W8", "T8_d"], ["T9_d", "E9"],
    ["W9", "DP"], ["DP", "HEART"],
  ],
  drops: [["A0b", "W2b"], ["W2b", "W3b"], ["W6b", "W8b"], ["W8b", "W9"], ["E9", "HEART"], ["E1", "E3"]],
};
