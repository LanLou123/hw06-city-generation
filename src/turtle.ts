import {vec3,vec4,mat4} from 'gl-matrix'

export class Turtle{
    pos : vec3;
    up : vec3;
    look : vec3;
    right : vec3;
    depth : number = 0;
    transform : mat4;
    fixsteps : number = 1.3;
    steps:number = 1.3;

    constructor(pos:vec3 = vec3.fromValues(0.5,0,-0.5),
                up:vec3 = vec3.fromValues(0,1,0),
                look :vec3 = vec3.fromValues(0,0,1),
                right : vec3 = vec3.fromValues(1,0,0)){
        this.pos = pos;
        this.up = up;
        this.look = look;
        this.right = right;
        this.transform = mat4.fromValues(1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1)
    }

    clone(){
        let curt = new Turtle();
        vec3.copy(curt.pos,this.pos);
        vec3.copy(curt.up,this.up);
        vec3.copy(curt.look,this.look);
        vec3.copy(curt.right,this.right);
        mat4.copy(curt.transform,this.transform);
        return curt;
    }

    moveforward(dis:number){
        let oldpos:vec3 = vec3.create();
        vec3.copy(oldpos,this.pos);
        vec3.scaleAndAdd(this.pos,this.pos,this.look,dis);
        let trans:vec3 = vec3.create();
        vec3.sub(trans,oldpos,this.pos);
        let transmat : mat4 = mat4.create();
        mat4.translate(this.transform,this.transform,trans);

        this.depth++;
    }

    rotateAroundUp(deg:number){
        let radian = deg * Math.PI / 180;
        let rot = mat4.create();
        let di = vec3.fromValues(-this.up[0],-this.up[1],-this.up[2]);
        mat4.rotate(rot,rot,radian,this.up);
        mat4.rotate(this.transform,this.transform,radian,this.up);
        vec3.transformMat4(this.look,this.look,rot);
        vec3.transformMat4(this.right,this.right,rot);
    }


}