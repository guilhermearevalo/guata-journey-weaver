/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONER_STORE_URL?: string;
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
