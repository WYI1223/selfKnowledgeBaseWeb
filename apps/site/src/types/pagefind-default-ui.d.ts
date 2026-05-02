declare module '@pagefind/default-ui' {
  export interface PagefindUIOptions {
    [key: string]: unknown;
    baseUrl?: string;
    bundlePath?: string;
    element?: HTMLElement | string;
    resetStyles?: boolean;
  }

  export class PagefindUI {
    constructor(options: PagefindUIOptions);
    triggerFilters(filters: Record<string, string | string[]>): void;
    triggerSearch(term: string): void;
  }
}
