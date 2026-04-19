import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => {
	const deployTarget = (process.env.DEPLOY_TARGET ?? "").toLowerCase();
	const isVercel = process.env.VERCEL === "1" || deployTarget === "vercel";
	const isCloudflare = deployTarget === "cloudflare";

	return {
		optimizeDeps: {
			exclude: ["@tanstack/start-server-core", "@tanstack/start-client-core"],
		},
		plugins: [
			tanstackStart(),
			react(),
			tailwindcss(),
			tsconfigPaths(),
			...(command === "build" && isVercel ? [nitro({ preset: "vercel" })] : []),
			...(command === "build" && isCloudflare ? [cloudflare()] : []),
		],
	};
});
