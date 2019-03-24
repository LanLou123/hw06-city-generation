import {mat4, quat, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {Lsystem,Branch,Node} from'./Lsystem'
import {readtex} from './readtex';
// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let myl : Lsystem;
let tex: readtex;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

}

function setupLsys(){
    myl= new Lsystem(tex);
    myl.setAngle(20);
    myl.setStepSize(50/window.innerHeight);
    myl.genLsys();

    let aa = myl.BranchList.length;

    let trans1 = [];
    let trans2 = [];
    let trans3 = [];
    let trans4 = [];


    // Set up instanced rendering data arrays here.
    // This example creates a set of positional
    // offsets and gradiated colors for a 100x100 grid
    // of squares, even though the VBO data for just
    // one square is actually passed to the GPU
    let offsetsArray = [0];
    let colorsArray = [0];

    for(let i = 0;i<myl.BranchList.length;i++){
        let rotq = quat.create();
        let dir = vec3.create();
        let type = myl.BranchList[i].type;
        vec3.subtract(dir,myl.BranchList[i].end,myl.BranchList[i].start);
        let len = vec3.length(dir);
        vec3.normalize(dir,dir);
        quat.rotationTo(rotq,vec3.fromValues(0,0,1),dir);
        let rotmat = mat4.create();
        mat4.fromQuat(rotmat,rotq);
        let transmat = mat4.create();
        mat4.fromTranslation(transmat,myl.BranchList[i].start);
        let model = mat4.fromValues(1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1);
        let width = 1;
        if(type==0) width = 5;
        else if(type==1) width = 1.7;
        let sc = len/(myl.StepSize*10);
        mat4.scale(model,model,[width/10,1,sc*11]);
        mat4.multiply(model,rotmat,model);
        mat4.multiply(model,transmat,model);
        for(let j = 0;j<4;j++){
            trans1.push(model[j]);
            trans2.push(model[j+4]);
            trans3.push(model[j+8]);
            trans4.push(model[j+12]);
        }
    }
    let T1 : Float32Array = new Float32Array(trans1);
    let T2 : Float32Array = new Float32Array(trans2);
    let T3 : Float32Array = new Float32Array(trans3);
    let T4 : Float32Array = new Float32Array(trans4);

    let offsets: Float32Array = new Float32Array(offsetsArray);
    let colors: Float32Array = new Float32Array(colorsArray);
    square.setInstanceVBOs(offsets, colors,T1,T2,T3,T4);
    square.setNumInstances(myl.BranchList.length); // grid of "particles"
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const post = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('./shaders/post-vert.glsl')),
      new Shader(gl.FRAGMENT_SHADER, require('./shaders/post-frag.glsl')),
  ]);


  var frame_buffer : WebGLFramebuffer, Density:WebGLTexture;
  frame_buffer = gl.createFramebuffer();
  Density = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,Density);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,window.innerWidth,window.innerHeight,0,
      gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


  var renderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,
      window.innerWidth,window.innerHeight);

  gl.bindFramebuffer(gl.FRAMEBUFFER,frame_buffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,Density,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,renderBuffer);

  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status!=gl.FRAMEBUFFER_COMPLETE){
    console.log("ERROR FRAMEBUFFER"+status.toString());
  }
  gl.bindTexture(gl.TEXTURE_2D,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.bindRenderbuffer(gl.RENDERBUFFER,null);


  gl.viewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.clear();
  gl.bindFramebuffer(gl.FRAMEBUFFER,frame_buffer);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  renderer.render(camera, flat, [screenQuad]);

  let densbuf = new Uint8Array(window.innerWidth*window.innerHeight*4);
  gl.readPixels(0,0,window.innerWidth,window.innerHeight,gl.RGBA,gl.UNSIGNED_BYTE,densbuf);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);

  tex = new readtex(densbuf,window.innerWidth,window.innerHeight);
  setupLsys();



  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    post.setTime(time)
    flat.setTime(time++);

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();





    post.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,Density);
    var DensityUniform = gl.getUniformLocation(post.prog,"Density");
    gl.uniform1i(DensityUniform,0);

    renderer.render(camera,post,[screenQuad]);

    instancedShader.use();

    renderer.render(camera,instancedShader,[square]);

      stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
