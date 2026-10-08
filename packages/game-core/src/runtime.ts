/** Injected runtime ports; no gameplay probability or balance defaults. */
export interface Runtime {
  now(): number;
  random(): number;
}
