import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GITHUB_PAGES is set only by the deploy workflow (.github/workflows/deploy-pages.yml)
// — a project Pages site is served from /<repo-name>/, not /, so every asset
// path needs that prefix baked in at build time. Local dev/build stay at '/'.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/RobotRacers/' : '/',
  plugins: [react()],
});
