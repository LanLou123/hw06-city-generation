import {mat4, quat, vec2, vec3} from 'gl-matrix';
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
import {Plane} from './geometry/Plane';
import {Cube} from './geometry/cube';
import {combReader} from './combReader';
// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Generate' : chagestate,
    mask : 'population',
    highwayLength : 30,
    NeighborhoodDensity : 18,
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let myl : Lsystem;
let tex: readtex;
let combreader : combReader;

let plane : Plane;
let building : Cube;

let isupdate : Boolean;

var frame_buffer : WebGLFramebuffer, Density:WebGLTexture, Rasterize:WebGLTexture, renderBuffer : WebGLRenderbuffer, combinedTexture:WebGLTexture;
let densbuf : Uint8Array;
let rasterizebuf : Uint8Array;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  isupdate = false;
    building = new Cube(vec3.fromValues(0,0,0));
    building.create();
}

function chagestate() {
    isupdate = true;
}

function setupLsys(renderer:OpenGLRenderer,gl:WebGL2RenderingContext,camera:Camera,flat:ShaderProgram,rasterizeshader:ShaderProgram){

    setUpDensRenderTexture(renderer,gl,camera,flat);
    myl= new Lsystem(tex);
    myl.setAngle(20);
    myl.setStepSize(50/window.innerHeight);
    myl.setHigwayLen(controls.highwayLength);
    myl.setblockdens(controls.NeighborhoodDensity);
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
        if(type==0) width = 3;
        else if(type==1) width = 1.2;
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

    Render2RasterizeTexture(renderer,gl,camera,rasterizeshader);
}


//set up global major textures for future use
function setupFramebufferandtextures(gl:WebGL2RenderingContext) {
    frame_buffer = gl.createFramebuffer();
    //Noise generated data from GPU texture, include population density, water distribution, terrain elevation...
    Density = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,Density);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,window.innerWidth,window.innerHeight,0,
        gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    //rasterized texture for instanced street map
    Rasterize = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,Rasterize);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,window.innerWidth,window.innerHeight,0,
        gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    //rasterized texture for the combination of street map and terrain noise information
    combinedTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,combinedTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,window.innerWidth,window.innerHeight,0,
        gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    //specify our render buffer here
    renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,
        window.innerWidth,window.innerHeight);

    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,null);
}

function setUpDensRenderTexture(renderer:OpenGLRenderer,gl:WebGL2RenderingContext, camera : Camera, flat:ShaderProgram) {


    //specify framebuffer to render to the population density, water, elevation data texture and read to CPU
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

    densbuf = new Uint8Array(window.innerWidth*window.innerHeight*4);
    gl.readPixels(0,0,window.innerWidth,window.innerHeight,gl.RGBA,gl.UNSIGNED_BYTE,densbuf);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);

    tex = new readtex(densbuf,window.innerWidth,window.innerHeight);
}



function sampleAround(reader:combReader, pos : vec2, step : number) {


    //for each random point in current grid, sample around itself to find if there are road within
    //certain range, if there is, return true
    let div = step/20.0;

    for(let i = 0;i<20;i++){
        let cur = -step+i*div;
        if(reader.read(vec2.fromValues(cur+pos[0],pos[1]))>0.5){
            return true;
        }
    }
    for(let i = 0;i<20;i++){
        let cur = -step+i*div;
        if(reader.read(vec2.fromValues(pos[0],pos[1]+cur))>0.5){
            return true;
        }
    }
    return false;

}

function Render2RasterizeTexture(renderer:OpenGLRenderer,gl:WebGL2RenderingContext,camera:Camera,rasterizeShader:ShaderProgram) {


    //specify the framebuffer information for instanced rendering of street for future rasterization
    gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,
        window.innerWidth,window.innerHeight);

    gl.bindFramebuffer(gl.FRAMEBUFFER,frame_buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,Rasterize,0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,renderBuffer);

    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,null);

    gl.viewport(0, 0, window.innerWidth,window.innerHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER,frame_buffer);
    renderer.clear();

    rasterizeShader.use();

    renderer.render(camera,rasterizeShader,[square]);

    const combShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/comb-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/comb-frag.glsl')),
    ]);



    //change framebuffer to render to combined texture of population density rasterized data and street rasterized data
    gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,combinedTexture,0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);


    //render to combined texture
    gl.viewport(0, 0, window.innerWidth,window.innerHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER,frame_buffer);
    combShader.use();
    renderer.clear();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,Density);
    var DensityUniform = gl.getUniformLocation(combShader.prog,"Density");
    gl.uniform1i(DensityUniform,0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,Rasterize);
    var RasterUniform = gl.getUniformLocation(combShader.prog,"Rasterize");
    gl.uniform1i(RasterUniform,1);


    renderer.render(camera,combShader,[screenQuad]);

    //write rasterized combined texture to cpu side
    rasterizebuf = new Uint8Array(window.innerWidth*window.innerHeight*4);
    gl.readPixels(0,0,window.innerWidth,window.innerHeight,gl.RGBA,gl.UNSIGNED_BYTE,rasterizebuf);
    combreader = new combReader(rasterizebuf,window.innerWidth,window.innerHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);


    //calculate random points for building generation in a grid structure
    let rasterizeGridSize = 70;
    let stepSize = 2/70.0;
    let buildingpos1 = [];
    let buildingpos2 = [];
    let buildingpos3 = [];
    let buildingpos4 = [];
    for(let i = -rasterizeGridSize/2;i<rasterizeGridSize/2;i++){
        for(let j = -rasterizeGridSize/2;j<rasterizeGridSize/2;j++){
            let rx = stepSize*Math.random();
            let ry = stepSize*Math.random();
            rx = i*stepSize+rx;
            ry = j*stepSize+ry;
            if(combreader.read(vec2.fromValues(rx,ry))==0&&sampleAround(combreader,vec2.fromValues(rx,ry),stepSize)){
                let tmpbrlist = myl.Branchgrid[Math.floor((rx+1)*myl.numCells/2.0)+Math.floor((ry+1)*myl.numCells/2.0)*myl.numCells];

                let rotdir = vec3.create();
                let tmpbr : Branch = myl.checksaroundforbranch(vec2.fromValues(rx,ry));
                if(tmpbr==null){
                    rotdir = vec3.fromValues(0,0,1);
                }
                else{
                    rotdir = vec3.subtract(rotdir,tmpbr.start,tmpbr.end);
                }

                let dis = myl.checksaroundWidthSensitiveDis(vec2.fromValues(rx,ry));
                vec3.normalize(rotdir,rotdir);

                let rotq = quat.create();
                quat.rotationTo(rotq,vec3.fromValues(0,0,1),rotdir);
                let rotmat = mat4.create();
                mat4.fromQuat(rotmat,rotq);
                let transmat = mat4.create();
                mat4.fromTranslation(transmat,vec3.fromValues(rx,0,ry));
                let model = mat4.fromValues(1,0,0,0,
                    0,1,0,0,
                    0,0,1,0,
                    0,0,0,1);
                if(dis>0.03){
                    dis = 0.03;
                }
                let curdens = tex.readdens(vec2.fromValues(rx,ry));
                curdens = Math.pow(curdens+0.3,5);
                mat4.scale(model,model,[dis/0.01,curdens,dis/0.01]);
                mat4.multiply(model,rotmat,model);
                mat4.multiply(model,transmat,model);
                for(let k = 0;k<4;k++){
                    buildingpos1.push(model[k]);
                    buildingpos2.push(model[k+4]);
                    buildingpos3.push(model[k+8]);
                    buildingpos4.push(model[k+12]);
                }
            }

        }
    }

    let b1 :Float32Array = new Float32Array(buildingpos1);
    let b2 :Float32Array = new Float32Array(buildingpos2);
    let b3 :Float32Array = new Float32Array(buildingpos3);
    let b4 :Float32Array = new Float32Array(buildingpos4);

    //upload building displacement into GPU
    building.setInstanceVBOs(b1,b2,b3,b4);
    building.setNumInstances(b1.length/4);




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
  gui.add(controls,'Generate');
  gui.add(controls,'mask',['population','heightField']);
  gui.add(controls,'highwayLength',10,100).step(1);
  gui.add(controls,'NeighborhoodDensity',5,50).step(1);

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

  const camera = new Camera(vec3.fromValues(1, 1, 1), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0, 0.0, 0.0, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Additive blending

    setupFramebufferandtextures(gl);

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

    const planeshader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/plane-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/plane-frag.glsl')),
    ]);
    const rasterizeshader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/rasterize-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/rasterize-frag.glsl')),
    ]);
    const buildingShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/building-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/building-frag.glsl')),
    ]);



  plane = new Plane(vec3.fromValues(0,-0.0001,0),vec2.fromValues(2,2),10);
  plane.create();
  plane.setNumInstances(1);

  setupLsys(renderer,gl,camera,flat,rasterizeshader);



  // This function will be called every frame
  function tick() {
    camera.update();

    if(isupdate){
        setupLsys(renderer,gl,camera,flat,rasterizeshader);
        isupdate = false;
    }

    stats.begin();
    instancedShader.setTime(time);
    post.setTime(time);
    flat.setTime(time++);



    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();




    if(controls.mask=='population'){
        post.setdtype(0);
    }
    else{
        post.setdtype(1);
    }

    post.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,Density);
    var DensityUniform = gl.getUniformLocation(post.prog,"Density");
    gl.uniform1i(DensityUniform,0);
    gl.disable(gl.DEPTH_TEST);
    renderer.render(camera,post,[screenQuad]);
    gl.enable(gl.DEPTH_TEST);

    //rasterizeshader.use();



    instancedShader.use();

    renderer.render(camera,instancedShader,[square]);



      buildingShader.use();

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,Density);
      var DensityUniform2 = gl.getUniformLocation(buildingShader.prog,"Density");
      gl.uniform1i(DensityUniform2,0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D,combinedTexture);
      var combUniform2 = gl.getUniformLocation(buildingShader.prog,"Comb");
      gl.uniform1i(combUniform2,1);
      
      renderer.render(camera,buildingShader,[building]);

      planeshader.use();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,Density);
      var DensityUniform3 = gl.getUniformLocation(planeshader.prog,"Density");
      gl.uniform1i(DensityUniform3,0);
    renderer.render(camera,planeshader,[plane]);

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
