import {vec3,vec2 , mat4} from 'gl-matrix';


export class combReader{
    buf:Uint8Array;
    scrw:number;
    scrh:number;
    constructor (b:Uint8Array,w:number,h:number){
        this.buf = b;
        this.scrw = w;
        this.scrh = h;
    }


    read(p:vec2){
        let texpos = vec2.fromValues((p[0]+1)*this.scrw/2,(p[1]+1)*this.scrh/2);
        vec2.floor(texpos,texpos);
        let idx = texpos[1]*this.scrw*4+texpos[0]*4 + 2;
        let col = this.buf[idx]/255;
        return col;
    }
}