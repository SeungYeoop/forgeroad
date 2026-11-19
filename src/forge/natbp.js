// 구역 설계도: 손으로 정한 배치(구간·섬·동굴 방·던전 방과 역할). 모양 세부(바위 가장자리·종유석·벽돌)는 생성기가 그린다
// 좌표: px (구역 왼쪽 위 기준). 지표 기준 높이 y=4800. 1칸(블록)=8px
// 역할(role): rest 쉼터(적 없음) · arena 전투(적 더) · treasure 보물(상자) · vista 전망 · sanctum 성소 · trap 함정

export const BLUEPRINTS = {
  // ── g1_0 「재의 들판」: 1번 지역 첫 지상 구역. 난이도 낮음 ──
  // ▲ 문 x≈4352 (거대 하늘섬 꼭대기), ▼ 문 x≈3330 (서쪽 동굴 맨 아래 심연 동굴)
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
    pads: [{ xa: 6300, xb: 6460 }, { xa: 2020, xb: 2120 }],
    // 지표 보물: 산 서쪽 중턱 작은 굴 (막다른 곳에 상자)
    spots: [{ xa: 4960, xb: 5160, role: "treasure" }, { xa: 6300, xb: 6900, role: "arena" }, { xa: 1000, xb: 1700, role: "arena" }],
    // 지표 굴 입구 (→ 입구 동굴): 골짜기 서쪽 비탈 (연못 옆)
    mouths: [{ x: 2140, to: "C1" }],
    // 하늘: 봉우리 섬(▲) + 오르는 길 둘 + 갈래 섬. 섬마다 역할
    //   주 길(서): 산 정상 → M1 → M2 → M3 → 턱 섬 T(되돌아 오름) → N1 → N2 → 봉우리 섬 왼쪽 어깨
    //   동쪽 길: 산 동쪽 어깨 → E1 → E2(고원 위) → E3 → 턱 섬 ET(구역 끝) → F1 → F2 → F3 → 봉우리 섬 오른쪽 어깨
    //   갈래: 전망·보물 섬 (막다른 곳), 땅에서 바로 오르는 낮은 섬
    //   step: 턱 섬 — hi 쪽이 dy 높다 (낮은 쪽으로 들어와 턱을 올라 되돌아 간다). "id^" = 높은 쪽 발판
    sky: {
      peakY: 2450,
      gate: { cx: 4350, w: 2200, sh: 420, tS: 900 },
      isles: [
        // 주 길
        { id: "M1", cx: 3700, top: 3992, w: 380, t: 150, role: "rest" }, // 산 위 쉼터: 봉우리 섬 밑이 올려다보인다
        { id: "M2", cx: 2900, top: 3864, w: 560, t: 220, role: "arena", shape: "twin" }, // 첫 하늘 전투 (나는 적)
        { id: "M3", cx: 2120, top: 3640, w: 380, t: 190, role: "rest", shape: "slab" },
        { id: "T", cx: 1364, top: 3520, w: 540, t: 240, role: "vista", shape: "tower", step: { at: 0.556, dy: 72, hi: "L" } }, // 되돌아 오르는 턱 섬: 서쪽 하늘이 다 보인다
        { id: "N1", cx: 1990, top: 3232, w: 520, t: 210, role: "arena", shape: "lumpy" },
        { id: "N2", cx: 2790, top: 3040, w: 400, t: 170, role: "rest" }, // 봉우리 앞 쉼터
        // 동쪽 길
        { id: "E1", cx: 5600, top: 4304, w: 380, t: 140, role: "rest", shape: "slab" },
        { id: "E2", cx: 6420, top: 4072, w: 600, t: 190, role: "arena", shape: "twin" }, // 고원 위 전투
        { id: "E3", cx: 7180, top: 3920, w: 420, t: 180, role: "arena", shape: "lumpy" },
        { id: "ET", cx: 7899, top: 3712, w: 330, t: 260, role: "vista", shape: "tower", step: { at: 0.4545, dy: 72, hi: "R" } }, // 구역 끝 바위 기둥: 되돌아 오른다
        { id: "F1", cx: 7368, top: 3408, w: 500, t: 200, role: "arena", step: { at: 0.5, dy: 72, hi: "L" } }, // 갈림 섬: 왼쪽 → 봉우리, 턱 위 → 동쪽 보물섬
        { id: "F2", cx: 6600, top: 3184, w: 520, t: 210, role: "treasure", shape: "slab" },
        { id: "F3", cx: 5900, top: 3040, w: 400, t: 170, role: "rest", shape: "spire" }, // 봉우리 앞 쉼터 (동)
        // 갈래 섬
        { id: "CV", cx: 4870, top: 3984, w: 340, t: 150, role: "treasure", shape: "spire" }, // 산 정상에서 오르는 보물섬
        { id: "WL", cx: 486, top: 4480, w: 440, t: 140, role: "arena", shape: "slab", step: { at: 0.5, dy: 72, hi: "L" } }, // 들판 위 낮은 섬 (첫 나는 적)
        { id: "WM", cx: 1060, top: 4176, w: 520, t: 200, role: "rest", shape: "lumpy" }, // 구릉 위 쉼터
        { id: "WT", cx: 555, top: 3280, w: 450, t: 190, role: "arena", step: { at: 0.511, dy: 72, hi: "L" } },
        { id: "UW", cx: 1080, top: 2992, w: 340, t: 170, role: "rest", shape: "spire" },
        { id: "HW", cx: 1700, top: 2780, w: 360, t: 170, role: "treasure" }, // 서쪽 하늘 끝 보물섬
        { id: "VP", cx: 2356, top: 4568, w: 400, t: 120, role: "rest", shape: "slab" }, // 연못 위 낮은 섬
        { id: "XT", cx: 7969, top: 4504, w: 190, t: 120, role: "treasure", shape: "spire" }, // 출구 들판 위 작은 보물 바위
        { id: "UE", cx: 7872, top: 3120, w: 380, t: 170, role: "treasure", shape: "lumpy" }, // 동쪽 하늘 끝 보물섬
        { id: "HE", cx: 7100, top: 2880, w: 500, t: 170, role: "vista", shape: "slab" }, // 동쪽 높은 전망섬
      ],
      // 이을 길 (아래 → 위). "g:x" = 땅 x 자리 평지
      links: [
        ["g:4250", "M1"], ["M1", "M2"], ["M2", "M3"], ["M3", "T"], ["T^", "N1"], ["N1", "N2"], ["N2", "G"],
        ["g:5040", "E1"], ["E1", "E2"], ["E2", "E3"], ["E3", "ET"], ["ET^", "F1"], ["F1^", "F2"], ["F2", "F3"], ["F3", "G"],
        ["g:4250", "CV"], ["T^", "WT"], ["WT^", "UW"], ["UW", "HW"], ["g:1060", "WL"], ["WL^", "WM"], ["g:2880", "VP"], ["g:7520", "XT"], ["F1^", "UE"], ["UE", "HE"],
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
      { id: "P2", x0: 1100, x1: 1700, fy: 7200, h: 230, kind: "pillared", floor: "flat", role: "arena" }, // 메아리 홀
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
    drops: [["C1", "N2"], ["N1", "C5"], ["C5", "P2"], ["P1", "C9"], ["N3", "C7"], ["P3", "C11"]],
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
        { id: "TA", col: 2, s: 0, up: "WE", down: "E", pat: "zig" },
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
        { id: "R10", c0: 0, c1: 0, s: 1, type: "vault", role: "treasure", cave: 1 }, // 보물실 1 (동굴 쪽에서만)
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
