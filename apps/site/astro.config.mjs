import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://selfknowledgebaseweb.example.com',
  // Astro 5.18 removed the old hybrid value; static now supports mixed
  // prerendered pages plus non-prerendered server endpoints.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), react(), tailwind({ applyBaseStyles: false }), pagefind()],
  build: {
    client: './',
    format: 'directory',
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Match BOTH @skb/block-X (workspace specifier) AND
          // /packages/block-X/ (resolved symlink path). Vite resolves
          // workspace deps to their realpath; without the second
          // pattern manualChunks misses post-resolution IDs.
          manualChunks: (id) => {
            if (id.includes('heavy-boundary-dimensions')) return 'heavy-boundary-dimensions';
            if (id.includes('@skb/block-jupyter') || id.includes('/packages/block-jupyter/')) return 'block-jupyter';
            if (id.includes('@skb/block-nn-viz') || id.includes('/packages/block-nn-viz/')) return 'block-nn-viz';
            if (id.includes('@skb/block-agent-flow') || id.includes('/packages/block-agent-flow/')) return 'block-agent-flow';
          },
        },
      },
    },
  },
});
