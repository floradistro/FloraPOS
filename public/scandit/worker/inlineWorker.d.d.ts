/// <reference types="emscripten" />
declare module "*.inlineWorker.js$" {
  function InlineWorker(options?: WorkerOptions): Worker;
  export { InlineWorker };
}
