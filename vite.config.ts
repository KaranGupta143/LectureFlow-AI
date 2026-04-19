import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
	optimizeDeps: {
		exclude: ["@tanstack/start-server-core", "@tanstack/start-client-core"],
	},
	plugins: [tanstackStart(), react(), tailwindcss(), tsconfigPaths(), ...(command === "build" ? [cloudflare()] : [])],
}));
