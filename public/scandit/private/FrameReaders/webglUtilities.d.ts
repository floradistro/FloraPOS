/// <reference types="emscripten" />
declare function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null;
declare function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null;

export { createProgram, createShader };
