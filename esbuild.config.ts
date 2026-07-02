import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const options: esbuild.BuildOptions = {
  entryPoints: ["src/app.ts"],
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  outfile: "dist/app.js",
  sourcemap: true,
};

if (isWatch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching...");
} else {
  await esbuild.build(options);
  console.log("Build complete.");
}
