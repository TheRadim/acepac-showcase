import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const textFiles = {
  "/": "index.html",
  "/index.html": "index.html",
  "/overview.html": "overview.html",
  "/product.html": "product.html",
  "/about.html": "about.html",
  "/styles.css": "styles.css",
  "/script.js": "script.js"
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};

const assets = Object.fromEntries(
  Object.entries(textFiles).map(([route, file]) => {
    const ext = file.slice(file.lastIndexOf("."));
    return [
      route,
      {
        body: readFileSync(file, "utf8"),
        contentType: contentTypes[ext] || "text/plain; charset=utf-8"
      }
    ];
  })
);

mkdirSync("dist/server", { recursive: true });
writeFileSync(
  "dist/server/index.js",
  `const assets = ${JSON.stringify(assets)};\n\nfunction resolveRoute(pathname) {\n  if (assets[pathname]) return pathname;\n  if (pathname.endsWith("/") && pathname !== "/") return pathname.slice(0, -1) + ".html";\n  if (!pathname.split("/").pop().includes(".")) return pathname + ".html";\n  return pathname;\n}\n\nexport default {\n  async fetch(request) {\n    const url = new URL(request.url);\n    const route = resolveRoute(url.pathname);\n    const asset = assets[route] || assets["/"];\n    const status = assets[route] ? 200 : 404;\n    return new Response(asset.body, {\n      status,\n      headers: {\n        "content-type": asset.contentType,\n        "cache-control": "public, max-age=120"\n      }\n    });\n  }\n};\n`
);

console.log("Built dist/server/index.js");
