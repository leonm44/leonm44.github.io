import { defineConfig } from 'astro/config';

// On GitHub Pages the workflow sets SITE_URL (https://<user>.github.io) and
// BASE_PATH ("/" for a <user>.github.io repo, "/<repo>" otherwise).
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
});
