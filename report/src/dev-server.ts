import index from "../index.html";
import project from "../projects/smart-permission-tickets/index.html";

const port = parseInt(process.env.PORT || "3456");

Bun.serve({
  port,
  routes: {
    "/": index,
    "/smart-permission-tickets": project,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Dev server running at http://localhost:${port}`);
