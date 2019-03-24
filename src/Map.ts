import {Noises} from './Noises'
import {vec3,vec2 , mat4} from 'gl-matrix';

export class RoadMap{
     n : Noises = new Noises();
     constructor(){

     }
     getterrain(st:vec2){

         return this.n.fbm(vec2.fromValues(st[0]+20,st[1]+10));
     }

     getdens(st:vec2){
         return this.n.fbm(vec2.fromValues(st[0]*2,st[1]*2));
     }
     getwater(st:vec2){
         return this.n.fbm(vec2.fromValues(st[0]*0.5,st[1]*0.5));
     }
}