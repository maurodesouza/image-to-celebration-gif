import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	base: "/image-to-celebration-gif/",
	resolve: { tsconfigPaths: true },
	environments: {
		client: {
			build: {
				outDir: "dist",
			},
		},
		server: {
			build: {
				outDir: "dist/server",
			},
		},
	},
	plugins: [
		devtools({ removeDevtoolsOnBuild: true }),
		tailwindcss(),
		tanstackStart({
			prerender: {
				enabled: true,
			},
		}),
		viteReact(),
	],
});

export default config;
