export default {
  base: "./",
  server: { port: 5173 },
  // 게임 + 지형 실험실(여러 시드 비교 디버그 페이지)
  build: { rollupOptions: { input: { main: "index.html", lab: "terrain-lab.html" } } },
};
