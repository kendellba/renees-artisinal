declare module 'vuetify/components' {
  const components: any;
  export * from 'vuetify/components';
}

declare module 'vuetify/directives' {
  const directives: any;
  export * from 'vuetify/directives';
}

declare module 'vuetify/styles' {
  // This module has no exports, it's just for side effects
}

declare module 'vuetify' {
  export function createVuetify(options?: any): any;
} 