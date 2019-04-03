import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

export class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;

    b1:Float32Array;
    b2:Float32Array;
    b3:Float32Array;
    b4:Float32Array;

    constructor(center: vec3) {
        super(); // Call the constructor of the super class. This is required.
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    create() {

        let cubewidth = 0.007;
        let cubeheight = 0.08;

        this.indices = new Uint32Array([0, 1, 2,
            0, 2, 3,
            4, 5, 6,
            4, 6, 7,
            8, 9, 10,
            8, 10, 11,
            12, 13, 14,
            12, 14, 15,
            16, 17, 18,
            16, 18, 19,
            20, 21, 22,
            20, 22, 23]);
        this.positions = new Float32Array([
            //front face
            -cubewidth, 0, -cubewidth, 1,
            -cubewidth, cubeheight, -cubewidth, 1,
            cubewidth, cubeheight, -cubewidth, 1,
            cubewidth, 0, -cubewidth, 1,
            //back face
            -cubewidth, 0 ,cubewidth,1,
            cubewidth, 0, cubewidth,1,
            cubewidth,cubeheight,cubewidth,1,
            -cubewidth,cubeheight,cubewidth,1,
            //top face
            -cubewidth,cubeheight,-cubewidth,1,
            -cubewidth,cubeheight,cubewidth,1,
            cubewidth,cubeheight,cubewidth,1,
            cubewidth,cubeheight,-cubewidth,1,
            //bottom face
            -cubewidth,0,-cubewidth,1,
            cubewidth,0,-cubewidth,1,
            cubewidth,0,cubewidth,1,
            -cubewidth,0,cubewidth,1,
            //left face
            -cubewidth,0,cubewidth,1,
            -cubewidth,cubeheight,cubewidth,1,
            -cubewidth,cubeheight,-cubewidth,1,
            -cubewidth,0,-cubewidth,1,
            //right face
            cubewidth,0,-cubewidth,1,
            cubewidth,cubeheight,-cubewidth,1,
            cubewidth,cubeheight,cubewidth,1,
            cubewidth,0,cubewidth,1
        ]);
        this.normals = new Float32Array([
            //front
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            //back
            0,0,1,0,
            0,0,1,0,
            0,0,1,0,
            0,0,1,0,
            //top
            0,1,0,0,
            0,1,0,0,
            0,1,0,0,
            0,1,0,0,
            //bottom
            0,-1,0,0,
            0,-1,0,0,
            0,-1,0,0,
            0,-1,0,0,
            //left
            -1,0,0,0,
            -1,0,0,0,
            -1,0,0,0,
            -1,0,0,0,
            //right
            1,0,0,0,
            1,0,0,0,
            1,0,0,0,
            1,0,0,0
        ]);




        this.generateIdx();
        this.generatePos();
        this.generateNor();

        this.generateb1();
        this.generateb2();
        this.generateb3();
        this.generateb4();

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        console.log(`Created Cube`);
    }

    setInstanceVBOs(building1 : Float32Array, building2 : Float32Array, building3 : Float32Array, building4 : Float32Array){
        this.b1 = building1;
        this.b2 = building2;
        this.b3 = building3;
        this.b4 = building4;
        gl.bindBuffer(gl.ARRAY_BUFFER,this.bufb1);
        gl.bufferData(gl.ARRAY_BUFFER,this.b1,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,this.bufb2);
        gl.bufferData(gl.ARRAY_BUFFER,this.b2,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,this.bufb3);
        gl.bufferData(gl.ARRAY_BUFFER,this.b3,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,this.bufb4);
        gl.bufferData(gl.ARRAY_BUFFER,this.b4,gl.STATIC_DRAW);
    }
};

export default Cube;