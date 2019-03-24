import {vec3,vec2 , mat4} from 'gl-matrix';
export class Noises{

    NumOctaves : number;
    constructor(){


    };

random (st:vec2) {
    return (Math.sin(vec2.dot(st,
        vec2.fromValues(12.9898,78.233)))*
        43758.5453123)%1;
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd

mix(a:number,b:number,r:number){
    return a*(1-r)+b*r;
}

noise (st:vec2) {
    let i = vec2.create();
    vec2.floor(i,st);
    let f=vec2.fromValues(st[0]%1,st[1]%1);

    // Four corners in 2D of a tile
    let a = this.random(i);
    let b = this.random(vec2.fromValues(i[0]+1,i[1]));
    let c = this.random(vec2.fromValues(i[0],i[1]+1));
    let d = this.random(vec2.fromValues(i[0]+1,i[1]+1));

    let u = vec2.fromValues(f[0] * f[0] * (3.0 - 2.0 * f[0]),
        f[1] * f[1] * (3.0 - 2.0 * f[1]));

    return this.mix(a, b, u[0]) +
        (c - a)* u[1] * (1.0 - u[0]) +
        (d - b) * u[0] * u[1];
}


 fbm(st:vec2) {
    // Initial values
    let value = 0.0;
    let amplitude = .5;
    let frequency = 0.;
    //
    // Loop of octaves
    for (let i = 0; i < 6; i++) {
        value += amplitude * this.noise(vec2.fromValues(st[0],st[1]));
        st = vec2.fromValues(st[0]*2,st[1]*2);
        amplitude *= .5;
    }
    return value;
}
};