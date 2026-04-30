import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://selfknowledgebaseweb.example.com',
  integrations: [mdx(), react(), tailwind({ applyBaseStyles: false })],
  build: {
    format: 'directory',
  },
});
