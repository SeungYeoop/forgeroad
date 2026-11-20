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

// ── g1_m1 「스톤브리지」: 그래스메어 하늘 설계를 하늘 구역 하나로 옮긴 형태 (REGIONS.md) ──
//   아래 섬 길(구름다리, y≈4800)을 땅 삼아: 쉼터 섬 → 서쪽 거대 섬(속 동굴·샘) → 유적 섬 → 기둥 동굴 섬 → ▲ 신전 섬
//   동쪽: 돌다리 쉼터 → 동쪽 거대 섬 → 샘 섬 → 동굴 섬 → 턱 섬 → ▲ / 높은 하늘 보물섬·전망섬
{
  const S0 = moveSky(BLUEPRINTS.g1_0.sky, { dy: 400 });
  const S1 = editSky(S0, {
    A1: { top: 4392, w: 560, t: 200, role: "rest", shape: "slab" },
    E1: { top: 4440, w: 420, t: 130, role: "rest", shape: "slab" },
    CV: { top: 4300, role: "treasure" },
    XT: { top: 4504 },
  });
  const links = S1.links.map(([a, b, n]) => {
    if (a === "g:4250" && b === "A1") return ["g:4450", "A1", 5];
    if (a === "g:4250" && b === "CV") return ["M", "CV", 6];
    if (a === "g:5040" && b === "E1") return ["g:4950", "E1", 5];
    return [a, b, n].filter((v) => v !== undefined);
  });
  BLUEPRINTS.g1_m1 = { sky: { ...S1, links }, flatWalk: 1 };
}

// ── g0_m1 「그린스텝」: 거점 바로 위 하늘 입문. 넓고 낮은 풀섬 계단, 큰 풀섬 속 작은 굴(보물), 동쪽은 돌다리 섬(첫 하늘 전투) ──
//   스톤브리지 설계를 좌우로 뒤집어 쓰되, 높은 섬 일부를 빼고 섬 모양을 계단밭(tiers)·넓적한 판으로 바꾼다 (쉽고 넓게)
{
  const S0 = moveSky(BLUEPRINTS.g1_m1.sky, { flip: true });
  BLUEPRINTS.g0_m1 = {
    flatWalk: 1,
    sky: editSky(S0, {
      W7: null, E7: null,
      A1: { shape: "slab", role: "rest", w: 640 },
      M: { shape: "slab", role: "vista" },
      W1: { form: "tiers" }, E2: { form: "tiers" },
      W5: { shape: "slab", role: "arena", w: 1100 },
      E6: { shape: "slab", role: "arena" },
    }, null),
  };
  BLUEPRINTS.g0_m1.sky.links = BLUEPRINTS.g0_m1.sky.links.filter(([a, b]) => ![a, b].some((k) => /^(W7|E7)/.test(k)));
}
// ── gm1_m1 「리프크라운」: 하늘에 뜬 거목 수관. 뿌리가 늘어진 수관 섬(roots), 새 둥지 섬(쉼터), 줄기 속 굴 ──
{
  const S0 = moveSky(BLUEPRINTS.g1_0.sky, { dy: 520 });
  const S1 = editSky(S0, {
    A1: { top: 4392, w: 600, t: 220, role: "rest", shape: "lumpy" },
    E1: { top: 4440, w: 420, t: 130, role: "rest", shape: "lumpy" },
    CV: { top: 4300, role: "treasure", shape: "lumpy" },
    XT: { top: 4504, shape: "lumpy" },
    M: { shape: "twin", role: "rest" },
    W1: { form: "roots" }, W3: { form: "roots" }, W4: { form: "roots" }, E2: { form: "roots" }, E4: { form: "roots" }, E5: { form: "roots" },
    W5: { shape: "lumpy" }, E6: { shape: "lumpy" }, W6: { shape: "twin", role: "treasure" }, W7: { shape: "lumpy", role: "vista" }, E7: { shape: "twin", role: "treasure" },
  });
  const links = S1.links.map(([a, b, n]) => {
    if (a === "g:4250" && b === "A1") return ["g:4450", "A1", 5];
    if (a === "g:4250" && b === "CV") return ["M", "CV", 6];
    if (a === "g:5040" && b === "E1") return ["g:4950", "E1", 5];
    return [a, b, n].filter((v) => v !== undefined);
  });
  BLUEPRINTS.gm1_m1 = { sky: { ...S1, links }, flatWalk: 1 };
}

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
