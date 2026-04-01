import index from "../index.html";

Bun.serve({
  port: parseInt(process.env.PORT || "3456"),
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Dev server running at http://localhost:${parseInt(process.env.PORT || "3456")}`);
