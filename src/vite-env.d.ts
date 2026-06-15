/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONER_STORE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_STORAGE_UPLOADS?: string;
}

declare namespace JSX {
  interface IntrinsicElements {
    'befly-widget': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      language?: string;
      'new-tab'?: string | boolean;
    };
  }
}
