// Ambient declarations for the CSS imports used by the Expo web template
// (Expo's web bundler understands these; TypeScript needs the module shapes).
declare module '*.css';

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
