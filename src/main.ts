import {glMatrix, mat4, quat, vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {readTextFile, setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {Lsystem,Branch,Node} from'./Lsystem'
import {readtex} from './readtex';
import {Plane} from './geometry/Plane';
import {Cube} from './geometry/cube';
import {combReader} from './combReader';
import Mesh from "./geometry/Mesh";
// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Generate' : chagestate,
    mask : 'population',
    highwayLength : 30,
    NeighborhoodDensity : 18,
    shadowposx : 1,
    shadowposy : 0.6,
    shadowposz : 0.2,
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let myl : Lsystem;
let tex: readtex;
let combreader : combReader;

let plane : Plane;
let building : Cube;

let low1location : string = readTextFile('./obj/low1.obj')
let low1 : Mesh;
let low2location : string = readTextFile('./obj/low2.obj')
let low2 : Mesh;
let mid1location : string = readTextFile('./obj/mid1.obj')
let mid1 : Mesh;
let mid2location : string = readTextFile('./obj/mid2.obj')
let mid2 : Mesh;
let high1location : string = readTextFile('./obj/high1.obj')
let high1 : Mesh;
let high2location : string = readTextFile('./obj/high2.obj')
let high2 : Mesh;


let isupdate : Boolean;

var frame_buffer : WebGLFramebuffer, Density:WebGLTexture, Rasterize:WebGLTexture, renderBuffer : WebGLRenderbuffer, combinedTexture:WebGLTexture, shadowtex : WebGLTexture;



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
    low1 = new Mesh(low1location,vec3.fromValues(0,0,0));
    low1.create();
    low2 = new Mesh(low2location,vec3.fromValues(0,0,0));
    low2.create();
    mid1 = new Mesh(mid1location,vec3.fromValues(0,0,0));
    mid1.create();
    mid2 = new Mesh(mid2location,vec3.fromValues(0,0,0));
    mid2.create();
    high1 = new Mesh(high1location,vec3.fromValues(0,0,0));
    high1.create();
    high2 = new Mesh(high2location,vec3.fromValues(0,0,0));
    high2.create();

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

    shadowtex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,shadowtex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,window.innerWidth*5.0,window.innerHeight*5.0,0,
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

function CheckAroundForRasterize(pos:vec2, radius:number){
    for(let i = -1;i<=1;i++){
        for(let j = -1;j<=1;j++){
            let curx = i*radius+pos[0];
            let cury = j*radius+pos[1];
            if(curx<0||cury<0){
                continue;
            }
            let val = combreader.read(vec2.fromValues(curx,cury));
            if(val>0.1) {
                return false;
            }
        }
    }
    return true;

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
    let rasterizeGridSize = 100;
    let stepSize = 2/100.0;
    let low1buildingpos1 = [];
    let low1buildingpos2 = [];
    let low1buildingpos3 = [];
    let low1buildingpos4 = [];

    let low2buildingpos1 = [];
    let low2buildingpos2 = [];
    let low2buildingpos3 = [];
    let low2buildingpos4 = [];

    let mid1buildingpos1 = [];
    let mid1buildingpos2 = [];
    let mid1buildingpos3 = [];
    let mid1buildingpos4 = [];

    let mid2buildingpos1 = [];
    let mid2buildingpos2 = [];
    let mid2buildingpos3 = [];
    let mid2buildingpos4 = [];

    let high1buildingpos1 = [];
    let high1buildingpos2 = [];
    let high1buildingpos3 = [];
    let high1buildingpos4 = [];

    let high2buildingpos1 = [];
    let high2buildingpos2 = [];
    let high2buildingpos3 = [];
    let high2buildingpos4 = [];

    for(let i = -rasterizeGridSize/2;i<rasterizeGridSize/2;i++){
        for(let j = -rasterizeGridSize/2;j<rasterizeGridSize/2;j++){
            let rx = stepSize*Math.random();
            let ry = stepSize*Math.random();
            rx = i*stepSize+rx;
            ry = j*stepSize+ry;
            if(CheckAroundForRasterize(vec2.fromValues(rx,ry),0.003)&&sampleAround(combreader,vec2.fromValues(rx,ry),stepSize)){
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
                let dens =curdens;
                curdens = Math.pow(curdens+0.6,2);

                let mutation = Math.random();

                if(dens<0.5||(dens>0.5&&dens<0.8)&&(mutation>0.8)||(dens>0.8)&&mutation<0.1) {
                    mat4.scale(model,model,[dis/0.015,curdens+0.0,dis/0.015]);
                    mat4.multiply(model,rotmat,model);
                    mat4.multiply(model,transmat,model);
                    let r = Math.random();
                    if(r>0.5){
                        for (let k = 0; k < 4; k++) {
                            low1buildingpos1.push(model[k]);
                            low1buildingpos2.push(model[k + 4]);
                            low1buildingpos3.push(model[k + 8]);
                            low1buildingpos4.push(model[k + 12]);
                        }
                    }
                    else{
                        for (let k = 0; k < 4; k++) {
                            low2buildingpos1.push(model[k]);
                            low2buildingpos2.push(model[k + 4]);
                            low2buildingpos3.push(model[k + 8]);
                            low2buildingpos4.push(model[k + 12]);
                        }
                    }
                }
                else if(dens>0.5&&dens<0.8&&mutation<0.8||(dens>0.8&&mutation>0.1&&mutation<0.2)){
                    let r = Math.random();
                    if(dis>0.01) dis = 0.01;
                    if(dis<0.005) continue;
                    curdens = Math.pow(curdens-0.4,3);
                    mat4.scale(model,model,[dis/0.015,curdens/1.1,dis/0.015]);
                    mat4.multiply(model,rotmat,model);
                    mat4.multiply(model,transmat,model);
                    if(r>0.5){

                        for (let k = 0; k < 4; k++) {
                            mid1buildingpos1.push(model[k]);
                            mid1buildingpos2.push(model[k + 4]);
                            mid1buildingpos3.push(model[k + 8]);
                            mid1buildingpos4.push(model[k + 12]);
                        }
                    }
                    else{
                        for (let k = 0; k < 4; k++) {
                            mid2buildingpos1.push(model[k]);
                            mid2buildingpos2.push(model[k + 4]);
                            mid2buildingpos3.push(model[k + 8]);
                            mid2buildingpos4.push(model[k + 12]);
                        }
                    }
                }
                else if(mutation>0.2){
                    let r = Math.random();
                    if(dis>0.02) dis = 0.02;
                    if(dis<0.005) continue;

                    if(r>0.5){
                        mat4.scale(model,model,[dis/0.015,curdens/2.0,dis/0.015]);
                        mat4.multiply(model,rotmat,model);
                        mat4.multiply(model,transmat,model);
                        for (let k = 0; k < 4; k++) {
                            high1buildingpos1.push(model[k]);
                            high1buildingpos2.push(model[k + 4]);
                            high1buildingpos3.push(model[k + 8]);
                            high1buildingpos4.push(model[k + 12]);
                        }
                    }
                    else{
                        mat4.scale(model,model,[dis/0.015,curdens/1.,dis/0.015]);
                        mat4.multiply(model,rotmat,model);
                        mat4.multiply(model,transmat,model);
                        for (let k = 0; k < 4; k++) {
                            high2buildingpos1.push(model[k]);
                            high2buildingpos2.push(model[k + 4]);
                            high2buildingpos3.push(model[k + 8]);
                            high2buildingpos4.push(model[k + 12]);
                        }
                    }
                }
            }

        }
    }

    let low1b1 :Float32Array = new Float32Array(low1buildingpos1);
    let low1b2 :Float32Array = new Float32Array(low1buildingpos2);
    let low1b3 :Float32Array = new Float32Array(low1buildingpos3);
    let low1b4 :Float32Array = new Float32Array(low1buildingpos4);

    let low2b1 :Float32Array = new Float32Array(low2buildingpos1);
    let low2b2 :Float32Array = new Float32Array(low2buildingpos2);
    let low2b3 :Float32Array = new Float32Array(low2buildingpos3);
    let low2b4 :Float32Array = new Float32Array(low2buildingpos4);

    let mid1b1 :Float32Array = new Float32Array(mid1buildingpos1);
    let mid1b2 :Float32Array = new Float32Array(mid1buildingpos2);
    let mid1b3 :Float32Array = new Float32Array(mid1buildingpos3);
    let mid1b4 :Float32Array = new Float32Array(mid1buildingpos4);

    let mid2b1 :Float32Array = new Float32Array(mid2buildingpos1);
    let mid2b2 :Float32Array = new Float32Array(mid2buildingpos2);
    let mid2b3 :Float32Array = new Float32Array(mid2buildingpos3);
    let mid2b4 :Float32Array = new Float32Array(mid2buildingpos4);

    let high1b1 :Float32Array = new Float32Array(high1buildingpos1);
    let high1b2 :Float32Array = new Float32Array(high1buildingpos2);
    let high1b3 :Float32Array = new Float32Array(high1buildingpos3);
    let high1b4 :Float32Array = new Float32Array(high1buildingpos4);

    let high2b1 :Float32Array = new Float32Array(high2buildingpos1);
    let high2b2 :Float32Array = new Float32Array(high2buildingpos2);
    let high2b3 :Float32Array = new Float32Array(high2buildingpos3);
    let high2b4 :Float32Array = new Float32Array(high2buildingpos4);

    //upload building displacement into GPU
    low1.setInstanceVBOs(low1b1,low1b2,low1b3,low1b4);
    low1.setNumInstances(low1b1.length/4);


    low2.setInstanceVBOs(low2b1,low2b2,low2b3,low2b4);
    low2.setNumInstances(low2b1.length/4);

    mid1.setInstanceVBOs(mid1b1,mid1b2,mid1b3,mid1b4);
    mid1.setNumInstances(mid1b1.length/4);

    mid2.setInstanceVBOs(mid2b1,mid2b2,mid2b3,mid2b4);
    mid2.setNumInstances(mid2b1.length/4);

    high1.setInstanceVBOs(high1b1,high1b2,high1b3,high1b4);
    high1.setNumInstances(high1b1.length/4);

    high2.setInstanceVBOs(high2b1,high2b2,high2b3,high2b4);
    high2.setNumInstances(high2b1.length/4);

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
  gui.add(controls,'shadowposx',0.2,1).step(0.01);
    gui.add(controls,'shadowposy',0.6,1).step(0.01);
    gui.add(controls,'shadowposz',0.2,1).step(0.01);

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

  const camera = new Camera(vec3.fromValues(0.4, 0.4, 0.4), vec3.fromValues(0, 0, 0));

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
    const shadowShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/shadow-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/shadow-frag.glsl')),
    ]);



  plane = new Plane(vec3.fromValues(0,-0.0001,0),vec2.fromValues(2,2),20);
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


      gl.viewport(0, 0, window.innerWidth*5, window.innerHeight*5);
      gl.bindFramebuffer(gl.FRAMEBUFFER,frame_buffer);
      gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,
          window.innerWidth*5.0,window.innerHeight*5.0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowtex,0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindRenderbuffer(gl.RENDERBUFFER, null)
      shadowShader.use();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,Density);
      var DensityUniform2 = gl.getUniformLocation(shadowShader.prog,"Density");
      gl.uniform1i(DensityUniform2,0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D,combinedTexture);
      var combUniform2 = gl.getUniformLocation(shadowShader.prog,"Comb");
      gl.uniform1i(combUniform2,1);


      let lightProjectionMat:mat4 = mat4.create(), lightViewMat: mat4 = mat4.create();
      lightProjectionMat = mat4.ortho(lightProjectionMat,-1.2,1.2,-1.2,1.2,-1.0,3.0);
      lightViewMat = mat4.lookAt(lightViewMat,[controls.shadowposx,controls.shadowposy,controls.shadowposz],[0,0,0],[0,1,0]);
      let shadowPmat = gl.getUniformLocation(shadowShader.prog,'uPmat');
      let shadowMVmat = gl.getUniformLocation(shadowShader.prog,'uMVmat');

      gl.uniformMatrix4fv(shadowPmat,false,lightProjectionMat);
      gl.uniformMatrix4fv(shadowMVmat,false,lightViewMat);
      renderer.clear();
      renderer.render(camera,shadowShader,[low1,low2,mid1,mid2,high1,high2]);


      gl.bindFramebuffer(gl.FRAMEBUFFER,null);

      gl.viewport(0, 0, window.innerWidth, window.innerHeight);
      gl.bindRenderbuffer(gl.RENDERBUFFER,renderBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,
          window.innerWidth*1.0,window.innerHeight*1.0);
      gl.bindRenderbuffer(gl.RENDERBUFFER,null);
      renderer.clear();


      post.setDimensions(window.innerWidth, window.innerHeight);
    post.use();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,shadowtex);
    var DensityUniform = gl.getUniformLocation(post.prog,"Density");
    gl.uniform1i(DensityUniform,0);
    gl.disable(gl.DEPTH_TEST);
    renderer.render(camera,post,[screenQuad]);
    gl.enable(gl.DEPTH_TEST);

    //rasterizeshader.use();



    instancedShader.use();

    renderer.render(camera,instancedShader,[square]);













      buildingShader.use();
      buildingShader.setsun(vec3.fromValues(controls.shadowposx,controls.shadowposy,controls.shadowposz));
      let shadowPmatb = gl.getUniformLocation(buildingShader.prog,'uPmat');
      let shadowMVmatb = gl.getUniformLocation(buildingShader.prog,'uMVmat');

      gl.uniformMatrix4fv(shadowPmatb,false,lightProjectionMat);
      gl.uniformMatrix4fv(shadowMVmatb,false,lightViewMat);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,Density);
      var DensityUniform2 = gl.getUniformLocation(buildingShader.prog,"Density");
      gl.uniform1i(DensityUniform2,0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D,combinedTexture);
      var combUniform2 = gl.getUniformLocation(buildingShader.prog,"Comb");
      gl.uniform1i(combUniform2,1);


      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D,shadowtex);
      var combUniform3 = gl.getUniformLocation(buildingShader.prog,"shadow");
      gl.uniform1i(combUniform3,2);

      renderer.render(camera,buildingShader,[low1,low2,mid1,mid2,high1,high2]);

      planeshader.use();

      let shadowPmatp = gl.getUniformLocation(planeshader.prog,'uPmat');
      let shadowMVmatp = gl.getUniformLocation(planeshader.prog,'uMVmat');

      gl.uniformMatrix4fv(shadowPmatp,false,lightProjectionMat);
      gl.uniformMatrix4fv(shadowMVmatp,false,lightViewMat);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,Density);
      var DensityUniform3 = gl.getUniformLocation(planeshader.prog,"Density");
      gl.uniform1i(DensityUniform3,0);


      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D,shadowtex);
      var combUniform4 = gl.getUniformLocation(planeshader.prog,"shadow");
      gl.uniform1i(combUniform4,1);

      planeshader.setsun(vec3.fromValues(controls.shadowposx,controls.shadowposy,controls.shadowposz));

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
    post.setDimensions(window.innerWidth, window.innerHeight);
  // Start the render loop
  tick();
}

main();
