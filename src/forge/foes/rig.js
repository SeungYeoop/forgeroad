// 3D 몬스터 공용 뼈대·재질·동작 도우미
import { mat, noise3, chain, add, rot2, ease, lerp, hash } from "./r3d.js";
export { mat, noise3, chain, add, rot2, ease, lerp, hash };
export const PI = Math.PI, TAU = Math.PI * 2;

// ── 자주 쓰는 재질 ──
// 빛나는 균열: 지역 좌표 잡음이 좁은 띠에 들면 빛남
export const veins = (k, col = 0xff8a30, hot = 0xffe080, rough = 1) => (u, v, w, s) => {
  const n = noise3(u * k + s * 3.1, v * k, w * k);
  const d = Math.abs(n - 0.5);
  if (d < 0.028) return { emit: d < 0.012 ? hot : col };
  return (noise3(u * 0.5, v * 0.5, w * 0.5 + s) - 0.5) * rough;
};
// 천 자락: 어깨에서 늘어지는 망토 (얇은 타원체를 이어 붙임). 위 → 아래로 넓어지고 끝은 너덜너덜
export function cape(M, top, len, w, ang, m, k = 0, z = -8) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), sw = Math.sin(k * 0.9 + t * 2) * t * 2;
    const c = [top[0] + Math.cos(ang) * len * t * 0.25 - t * 6 + sw, top[1] + len * t, top[2] + z * (0.6 + t * 0.4)];
    M.ell(c, [w * (0.55 + t * 0.6), len / n * 0.9, 1.6], m, ang * 0.3 + t * 0.15);
  }
  for (let i = 0; i < 3; i++) M.ell([top[0] - 6 - w * 0.3 + i * w * 0.45 + Math.sin(k + i), top[1] + len + 1 + (i % 2) * 2, top[2] + z], [w * 0.22, 2.5, 1.2], m, 0.2);
}
export const rough = (k = 0.5, a = 1) => (u, v, w, s) => (noise3(u * k + s, v * k, w * k) - 0.5) * a + (noise3(u * k * 3, v * k * 3, w * k * 3 + s) - 0.5) * a * 0.5;
export const plates = (k = 0.25) => (u, v, w, s) => {
  const f = (v * k + s * 0.37) % 1;
  return f < 0.08 ? -0.7 : f < 0.16 ? 0.4 : 0;
};
export const cloth = (k = 0.6) => (u, v, w, s) => Math.sin(u * k * 2 + s) * 0.5 + (noise3(u * 0.3, v * 0.3, w * 0.3 + s) - 0.5) * 0.8;
export const EYE = (c) => mat(c, { emit: c });

// ── 두 다리 걷기 위상 → 허벅지·무릎 각도 ──
// ph: 0~TAU, 반환 [[허벅지, 무릎], [허벅지, 무릎]] (앞다리, 뒷다리). 각도 0=오른쪽, PI/2=아래
export function gait(ph, stride = 0.5, lift = 0.9) {
  const leg = (p) => [PI / 2 - Math.sin(p) * stride, Math.max(0, Math.sin(p + PI / 2)) * lift * -1 + 0.05];
  return [leg(ph), leg(ph + PI)];
}
// 두 발 짐승용 (무릎이 뒤로)
export function gaitBack(ph, stride = 0.5, lift = 0.9) {
  const leg = (p) => [PI / 2 - Math.sin(p) * stride, Math.max(0, Math.sin(p + PI / 2)) * lift + 0.05];
  return [leg(ph), leg(ph + PI)];
}
// 다리 하나 그리기
export function leg(M, hip, a1, l1, a2, l2, w1, w2, m, footM, foot = 4) {
  const [kn, ft] = chain(hip, a1, l1, a2, l2);
  M.cap(hip, kn, w1, w2 * 0.9, m);
  M.cap(kn, ft, w2 * 0.9, w2 * 0.75, m);
  footM && M.ell([ft[0] + foot * 0.5, ft[1], ft[2]], [foot, w2 * 0.6, w2 * 0.9], footM, 0);
  return [kn, ft];
}
// 팔 하나
export function arm(M, sh, a1, l1, a2, l2, w1, w2, m) {
  const [el, hd] = chain(sh, a1, l1, a2, l2);
  M.cap(sh, el, w1, w2, m);
  M.cap(el, hd, w2, w2 * 0.85, m);
  return [el, hd];
}
// 동작 곡선 도우미: 예고(뒤로 당김) → 순간 타격 → 여운
export const windT = (k, n) => ease((k + 1) / n);
export const atkT = (k, n) => [0.0, 0.75, 1.0, 1.0, 1.0, 1.0][Math.min(5, Math.round((k / Math.max(1, n - 1)) * 3))];
