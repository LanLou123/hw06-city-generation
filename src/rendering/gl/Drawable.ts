import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;
  bufTranslate: WebGLBuffer;
  bufCol: WebGLBuffer;
  bufUV: WebGLBuffer;
  buft1: WebGLBuffer;
  buft2: WebGLBuffer;
  buft3: WebGLBuffer;
  buft4: WebGLBuffer;

  idxGenerated: boolean = false;
  posGenerated: boolean = false;
  norGenerated: boolean = false;
  colGenerated: boolean = false;
  translateGenerated: boolean = false;
  uvGenerated: boolean = false;
  t1generated: boolean = false;
  t2generated: boolean = false;
  t3generated: boolean = false;
  t4generated: boolean = false;

  numInstances: number = 0; // How many instances of this Drawable the shader program should draw

  abstract create() : void;

  destory() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufPos);
    gl.deleteBuffer(this.bufNor);
    gl.deleteBuffer(this.bufCol);
    gl.deleteBuffer(this.bufTranslate);
    gl.deleteBuffer(this.bufUV);
    gl.deleteBuffer(this.buft1);
    gl.deleteBuffer(this.buft2);
    gl.deleteBuffer(this.buft3);
    gl.deleteBuffer(this.buft4);
  }

  generateIdx() {
    this.idxGenerated = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posGenerated = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norGenerated = true;
    this.bufNor = gl.createBuffer();
  }

  generateCol() {
    this.colGenerated = true;
    this.bufCol = gl.createBuffer();
  }

  generateTranslate() {
    this.translateGenerated = true;
    this.bufTranslate = gl.createBuffer();
  }

  generateUV() {
    this.uvGenerated = true;
    this.bufUV = gl.createBuffer();
  }

  generatet1(){
    this.t1generated = true;
    this.buft1 = gl.createBuffer();
  }

  generatet2(){
      this.t2generated = true;
      this.buft2 = gl.createBuffer();
  }
  generatet3(){
      this.t3generated = true;
      this.buft3 = gl.createBuffer();
  }
  generatet4(){
      this.t4generated = true;
      this.buft4 = gl.createBuffer();
  }


  bindIdx(): boolean {
    if (this.idxGenerated) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxGenerated;
  }

  bindPos(): boolean {
    if (this.posGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posGenerated;
  }

  bindNor(): boolean {
    if (this.norGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norGenerated;
  }

  bindCol(): boolean {
    if (this.colGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    }
    return this.colGenerated;
  }

  bindTranslate(): boolean {
    if (this.translateGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    }
    return this.translateGenerated;
  }

  bindUV(): boolean {
    if (this.uvGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    }
    return this.uvGenerated;
  }

  bindt1(): boolean{
    if(this.t1generated){
      gl.bindBuffer(gl.ARRAY_BUFFER,this.buft1);
    }
    return this.t1generated;
  }

  bindt2(): boolean{
      if(this.t2generated){
          gl.bindBuffer(gl.ARRAY_BUFFER,this.buft2);
      }
      return this.t2generated;
  }

  bindt3(): boolean{
      if(this.t3generated){
          gl.bindBuffer(gl.ARRAY_BUFFER,this.buft3);
      }
      return this.t3generated;
  }

  bindt4(): boolean{
      if(this.t4generated){
          gl.bindBuffer(gl.ARRAY_BUFFER,this.buft4);
      }
      return this.t4generated;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }

  setNumInstances(num: number) {
    this.numInstances = num;
  }
};

export default Drawable;
