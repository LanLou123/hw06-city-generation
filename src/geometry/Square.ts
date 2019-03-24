import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Square extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  offsets: Float32Array; // Data for bufTranslate

  t1:Float32Array;
  t2:Float32Array;
  t3:Float32Array;
  t4:Float32Array;


  constructor() {
    super(); // Call the constructor of the super class. This is required.
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2,
                                  0, 2, 3]);
  this.positions = new Float32Array([-0.02, 0, 0, 1,
                                     0.02, 0, 0, 1,
                                     0.02, 0, 0.05, 1,
                                     -0.02, 0, 0.05, 1]);

    this.generateIdx();
    this.generatePos();

    this.generateTranslate();
    this.generatet1();
    this.generatet2();
    this.generatet3();
    this.generatet4();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created square`);
  }

  setInstanceVBOs(offsets: Float32Array, colors: Float32Array, trans1:Float32Array,
                  trans2:Float32Array,trans3:Float32Array,trans4:Float32Array) {
    this.colors = colors;
    this.offsets = offsets;
    this.t1 = trans1;
    this.t2 = trans2;
    this.t3 = trans3;
    this.t4 = trans4;


    gl.bindBuffer(gl.ARRAY_BUFFER, this.buft1);
    gl.bufferData(gl.ARRAY_BUFFER,this.t1,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buft2);
    gl.bufferData(gl.ARRAY_BUFFER,this.t2,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buft3);
    gl.bufferData(gl.ARRAY_BUFFER,this.t3,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buft4);
    gl.bufferData(gl.ARRAY_BUFFER,this.t4,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    gl.bufferData(gl.ARRAY_BUFFER, this.offsets, gl.STATIC_DRAW);
  }
};

export default Square;
