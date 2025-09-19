import {a}from'./chunk-MW5PTAU7.js';import {a as a$1}from'./chunk-QHBIT2WY.js';import {b,a as a$2}from'./chunk-SK6L34IF.js';var m=`
attribute vec2 a_position;
varying vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texcoord = a_position * 0.5 + 0.5;
}
`,w=`
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float x_spacing; // Uniform for x-spacing between pixels

// Function to calculate grayscale
float toGray(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

void main() {
  // Sample adjacent pixels with spacing of 1/width
  vec4 a = texture2D(u_texture, v_texcoord + vec2(0.0 * x_spacing, 0.0));
  vec4 b = texture2D(u_texture, v_texcoord + vec2(1.0 * x_spacing, 0.0));
  vec4 c = texture2D(u_texture, v_texcoord + vec2(2.0 * x_spacing, 0.0));
  vec4 d = texture2D(u_texture, v_texcoord + vec2(3.0 * x_spacing, 0.0));

  // Calculate grayscale values
  float grayscaleA = toGray(a);
  float grayscaleB = toGray(b);
  float grayscaleC = toGray(c);
  float grayscaleD = toGray(d);

  // Set the final color with grayscale values
  gl_FragColor = vec4(grayscaleA, grayscaleB, grayscaleC, grayscaleD);
}`,x=class extends a{constructor(t,e){super(t,e);this.colorType="GRAYSCALE";this._positions=new Float32Array([-1,-1,-1,1,1,-1,1,-1,-1,1,1,1]);this._canvas=document.createElement("canvas");}get _webglContext(){var t;if(!this._ctx){if(this._ctx=(t=this._canvas)==null?void 0:t.getContext("webgl",{antialias:false}),!this._ctx)throw new Error("Cannot get WebGL context");this.setup();}return this._ctx}readFromSource(t){var _,h;this.updateCanvasSizeIfNeeded(),this.updateFrameSizeIfNeeded();let e=(_=t==null?void 0:t.videoWidth)!=null?_:this._contextWebGL.drawingBufferWidth,{drawingBufferWidth:r,drawingBufferHeight:i,TEXTURE_2D:f,RGBA:o,UNSIGNED_BYTE:s,TRIANGLES:d}=this._webglContext;this._webglContext.viewport(0,0,r,i);let p=this._webglContext.getUniformLocation(this._shaderProgram,"x_spacing"),u=1/e;this._webglContext.uniform1f(p,u),this._webglContext.texImage2D(f,0,o,o,s,t),this._webglContext.drawArrays(d,0,6);let a=(h=this._framePool)==null?void 0:h.pop();if(!a)throw new Error("Frame pool found empty!");this._webglContext.readPixels(0,0,r,i,o,s,a);let b=new Uint8ClampedArray(a.buffer,0,e*i);return {width:e,height:i,data:b,colorType:"GRAYSCALE"}}setup(){this.initShaderProgram(),this.initBuffers(),this.initTexture();}dispose(){var t;this._shaderProgram&&(this._webglContext.deleteProgram(this._shaderProgram),this._shaderProgram=null),this._positionBuffer&&(this._webglContext.deleteBuffer(this._positionBuffer),this._positionBuffer=null),this._texture&&(this._webglContext.deleteTexture(this._texture),this._texture=null),this._ctx=null,(t=this._framePool)==null||t.empty(),this._canvas=void 0;}updateCanvasSizeIfNeeded(){this._canvas&&(this._canvas.width!==this._contextWebGL.drawingBufferWidth/4||this._canvas.height!==this._contextWebGL.drawingBufferHeight)&&(this._canvas.width=this._contextWebGL.drawingBufferWidth/4,this._canvas.height=this._contextWebGL.drawingBufferHeight);}updateFrameSizeIfNeeded(){var i;let{drawingBufferWidth:t,drawingBufferHeight:e}=this._webglContext,r=t*e*4;this._frameSize!==r&&(this._frameSize=t*e*4,(i=this._framePool)==null||i.empty(),this._framePool=new a$1({capacity:this._maxPoolCapacity,lowWaterMark:this._minPoolCapacity,createItem:()=>new Uint8ClampedArray(this._frameSize)}));}initShaderProgram(){let t=b(this._webglContext,this._webglContext.VERTEX_SHADER,m),e=b(this._webglContext,this._webglContext.FRAGMENT_SHADER,w);if(!t||!e)throw new Error("Shaders cannot be created");this._shaderProgram=a$2(this._webglContext,t,e),this._webglContext.useProgram(this._shaderProgram);}initBuffers(){this._positionBuffer=this._webglContext.createBuffer(),this._webglContext.bindBuffer(this._webglContext.ARRAY_BUFFER,this._positionBuffer),this._webglContext.bufferData(this._webglContext.ARRAY_BUFFER,this._positions,this._webglContext.STATIC_DRAW);let t=this._webglContext.getAttribLocation(this._shaderProgram,"a_position");this._webglContext.enableVertexAttribArray(t),this._webglContext.bindBuffer(this._webglContext.ARRAY_BUFFER,this._positionBuffer),this._webglContext.vertexAttribPointer(t,2,this._webglContext.FLOAT,false,0,0);}initTexture(){this._texture=this._webglContext.createTexture(),this._webglContext.bindTexture(this._webglContext.TEXTURE_2D,this._texture),this._webglContext.texParameteri(this._webglContext.TEXTURE_2D,this._webglContext.TEXTURE_WRAP_S,this._webglContext.CLAMP_TO_EDGE),this._webglContext.texParameteri(this._webglContext.TEXTURE_2D,this._webglContext.TEXTURE_WRAP_T,this._webglContext.CLAMP_TO_EDGE),this._webglContext.texParameteri(this._webglContext.TEXTURE_2D,this._webglContext.TEXTURE_MIN_FILTER,this._webglContext.LINEAR),this._webglContext.texParameteri(this._webglContext.TEXTURE_2D,this._webglContext.TEXTURE_MAG_FILTER,this._webglContext.LINEAR);let t=this._webglContext.getUniformLocation(this._shaderProgram,"u_texture");this._webglContext.uniform1i(t,0);}};export{x as a};