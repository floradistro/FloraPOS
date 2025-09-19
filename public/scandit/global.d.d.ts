/// <reference types="emscripten" />
import { C as ContextBridgeApi } from './common-4FJYEFaM.js';

declare const K: string;

/* eslint-disable no-var,vars-on-top */
// var declarations needed to define global properties


declare global {
  var VERSION: string;
  var PACKAGE_NAME: string;
  var SDC_WASM_CORE_FILE_NAME: string;
  var SDC_WASM_CORE_SIMD_FILE_NAME: string;
  var SDC_WASM_CORE_HASH: string;
  var SDC_WASM_CORE_SIMD_HASH: string;
  var SDC_WASM_CORE_MT_FILE_NAME: string;
  var SDC_WASM_CORE_MT_SIMD_FILE_NAME: string;
  var SDC_WASM_CORE_MT_HASH: string;
  var SDC_WASM_CORE_MT_SIMD_HASH: string;
  var SDC_WASM_JS_VERSION: string;
  var WASM_METADATA: Record<string, { bytes: number }>;
  var DEBUG_PERFORMANCE: boolean;
  var WEBASSEMBLY_SKIP_CUSTOM_LOADER: boolean;
  var path: string;

  interface Navigator {
    mozVibrate?: Navigator["vibrate"];
    msVibrate?: Navigator["vibrate"];
    webkitVibrate?: Navigator["vibrate"];
    enumerateDevices?: () => Promise<MediaDeviceInfo[]>;
    msPointerEnabled?: boolean;
    msMaxTouchPoints?: Navigator["maxTouchPoints"];
  }

  interface Window {
    orientation?: number;
    [K]?: ContextBridgeApi;
  }
  interface FinalizationRegistry<Target = object, HeldValue = any> {
    register(target: Target, heldValue: HeldValue, unregisterToken?: object): void;
    unregister(unregisterToken: object): boolean;
  }

}
