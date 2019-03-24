import {vec3, vec4, mat4, vec2} from 'gl-matrix'
import {Turtle} from './Turtle'
import {RoadMap} from './Map'
import {readtex} from './readtex'

export class Branch{
    start : vec3;
    end : vec3;
    depth : number;
    type:number;
    constructor(start:vec3,
                end:vec3,
                dp:number,
                t:number){

        this.start = start;
        this.end = end;
        this.depth=dp;
        this.type = t;
    }
}

export class Node{
    pos : vec3;
    type : string;
    constructor(pos:vec3,type:string){
        this.pos = pos;
        this.type = type;
    }
}


export class edge{
    start :vec2;
    end : vec2;
    constructor(s:vec2,e:vec2){
        this.start = vec2.fromValues(s[0],s[1]);
        this.end = vec2.fromValues(e[0],e[1]);
    }
}





export class Lsystem{
    BranchList : Array<Branch> = [];
    EdgeLis :edge[][];
    Angle : number = 18;
    StepSize : number = 0.2;
    maxdp:number = 0;
    length:number = 500;
    texture:readtex;
    numCells:number = 20;
    constructor(tex:readtex){
        this.texture = new readtex(tex.buf,tex.scrw,tex.scrh);
        this.EdgeLis = new Array<Array<edge>>(this.numCells*this.numCells);

    }

    genLsys(){

        this.doThings(vec2.fromValues(-0.7,-0.5),vec3.fromValues(0,0,1));
        this.doThings(vec2.fromValues(-0.7,-0.5),vec3.fromValues(0,0,-1));
        this.doThings(vec2.fromValues(1,0.),vec3.fromValues(-1,0,1));
        this.doThings(vec2.fromValues(0,1.),vec3.fromValues(1,0,-1));
        this.doThings(vec2.fromValues(0,1.),vec3.fromValues(0,0,-1));
    }


    map201(pos:vec2){
        return vec2.fromValues((pos[0]+1)/2,(pos[1]+1)/2);
    }

    formedgelist(start:vec2,end:vec2){
        let mappeds = this.map201(start);
        let mappede = this.map201(end);
        let sx = Math.floor(mappeds[0]*this.numCells);
        let sy = Math.floor(mappeds[1]*this.numCells);
        let ex = Math.floor(mappede[0]*this.numCells);
        let ey = Math.floor(mappede[1]*this.numCells);
        this.EdgeLis[sx+sy*this.numCells].push(new edge(start,end));
    }

    checkintersections(start:vec2,end:vec2){
        let p0x :number = start[0];
        let p0y :number = start[1];
        let p1x :number = end[0];
        let p1y :number = end[1];
    }

    checksaround(pos:vec2){
        let mindis = 10.0;
        let nearpos = vec2.create();
        for(let i = 0;i<this.BranchList.length;i++){
            let curdiss = vec2.distance(vec2.clone(pos),vec2.fromValues(this.BranchList[i].start[0],this.BranchList[i].start[2]));
            let curdise = vec2.distance(vec2.clone(pos),vec2.fromValues(this.BranchList[i].end[0],this.BranchList[i].end[2]));
            if(curdiss<mindis){
                mindis = curdiss;
                nearpos = vec2.fromValues(this.BranchList[i].start[0],this.BranchList[i].start[2]);
            }
            if(curdise<mindis){
                mindis = curdise;
                nearpos = vec2.fromValues(this.BranchList[i].end[0],this.BranchList[i].end[2]);
            }
        }
        return nearpos;
    }

    pushNeighborhood(br:Branch){
        let waters = this.texture.readwater(vec2.fromValues(br.start[0],br.start[2]));
        let watere = this.texture.readwater(vec2.fromValues(br.start[0],br.start[2]));
        if(waters>0.5||watere>0.5) return;
        this.BranchList.push(br);
    }

    drawgrid(t:Turtle,iterations:number){
        let stack = new Array();
        let curt = t.clone();
        curt.depth = 0;
        stack.push(curt);
        let first:boolean = true;
        let snapradius = 2  ;
        let stepdivsize = 2;
        while(curt.depth<iterations&&stack.length!=0) {
            if(curt.pos[0]<-1||curt.pos[0]>1||
                curt.pos[2]<-1||curt.pos[2]>1)
                return ;
            let ret = Math.random();
            if(ret>0.3){
                let curti = curt.clone();
                stack.push(curti);
            }
            let dir = Math.random();
            if(first){
                dir=0;
                first = false;
            }
            if(dir>0.5&&dir<=1) {
                let oldpos = vec3.clone(curt.pos);
                curt.moveforward(this.StepSize/stepdivsize);
                let npos = this.checksaround(vec2.fromValues(curt.pos[0],curt.pos[2]));
                if(vec2.distance(npos,vec2.fromValues(curt.pos[0],curt.pos[2]))<this.StepSize/snapradius){
                    curt.pos = vec3.fromValues(npos[0],curt.pos[1],npos[1]);
                    this.pushNeighborhood(new Branch(oldpos,vec3.clone(curt.pos), curt.depth,1));
                    curt = stack.pop();
                }
                else {
                    this.pushNeighborhood(new Branch(oldpos, vec3.clone(curt.pos), curt.depth,1));
                }
            }
            else if(dir>0.25&&dir<=0.5) {
                let oldpos = vec3.clone(curt.pos);
                curt.rotateAroundUp(270);
                curt.moveforward(this.StepSize/stepdivsize);
                let npos = this.checksaround(vec2.fromValues(curt.pos[0],curt.pos[2]));
                if(vec2.distance(npos,vec2.fromValues(curt.pos[0],curt.pos[2]))<this.StepSize/snapradius){
                    curt.pos = vec3.fromValues(npos[0],curt.pos[1],npos[1]);
                    this.pushNeighborhood(new Branch(oldpos,vec3.clone(curt.pos), curt.depth,1));
                    curt = stack.pop();
                }
                else {
                    this.pushNeighborhood(new Branch(oldpos, vec3.clone(curt.pos), curt.depth,1));
                }
            }
            else if(dir>0.0&&dir<=0.25) {
                let oldpos = vec3.clone(curt.pos);
                curt.rotateAroundUp(90);
                curt.moveforward(this.StepSize/stepdivsize);
                let npos = this.checksaround(vec2.fromValues(curt.pos[0],curt.pos[2]));
                if(vec2.distance(npos,vec2.fromValues(curt.pos[0],curt.pos[2]))<this.StepSize/snapradius){
                    curt.pos = vec3.fromValues(npos[0],curt.pos[1],npos[1]);
                    this.pushNeighborhood(new Branch(oldpos,vec3.clone(curt.pos), curt.depth,1));
                    curt = stack.pop();
                }
                else {
                    this.pushNeighborhood(new Branch(oldpos, vec3.clone(curt.pos), curt.depth,1));
                }
            }

        }

    }

    setAngle(deg:number){
        this.Angle = deg;
    }

    setStepSize(dis:number){
        this.StepSize = dis;
    }

    getrndAngle(){
        let p = Math.random();
        if(p>0&&p<0.2){return this.Angle/1.6;}
        else if(p>0.2&&p<0.4){return this.Angle/1.3;}
        else if(p>0.4&&p<0.6){return this.Angle;}
        else if(p>0.6&&p<0.8){return this.Angle*1.3;}
        return this.Angle*1.6;
    }
    detectdirnei(t:Turtle){
        let maxa = 0;
        let outangle = 0;
        for(let i = 1;i<20;i++){
            let cura = 0;
            let curt = t.clone();
            t.rotateAroundUp(i*18);
            for(let j = 0;j<8;j++){
                cura+=this.texture.readdens(vec2.fromValues(curt.pos[0],curt.pos[2]));
                curt.moveforward(this.StepSize);
            }
            if(cura>maxa){
                maxa = cura;
                outangle = i*18;
            }
        }
        let rnd = Math.random();
        if(outangle>180){
            outangle = 180+(outangle-180)/(40-rnd*10);
        }
        else if(outangle<180){
            outangle = 180-(outangle)/(40-rnd*10);
        }
        return outangle;
    }
    detectdir(t:Turtle){
        let maxa = 0;
        let outangle = 0;
        for(let i = 1;i<20;i++){
            let cura = 0;
            let curt = new Turtle();
            vec3.copy(curt.pos,t.pos);
            vec3.copy(curt.up,t.up);
            vec3.copy(curt.look,t.look);
            vec3.copy(curt.right,t.right);
            mat4.copy(curt.transform,t.transform);
            t.rotateAroundUp(i*18);
            for(let j = 0;j<8;j++){
                cura+=this.texture.readdens(vec2.fromValues(curt.pos[0],curt.pos[2]));
                curt.moveforward(this.StepSize);
            }
            if(cura>maxa){
                maxa = cura;
                outangle = i*18;
            }
        }
        let rnd = Math.random();
        if(outangle>180){
            outangle = 180+(outangle-180)/(40-rnd*10);
        }
        else if(outangle<180){
            outangle = 180-(outangle)/(40-rnd*10);
        }
        return outangle;
    }



    doThings(startpos:vec2,heading:vec3): void {
        vec3.normalize(heading,heading);

        let turtle = new Turtle(vec3.fromValues(startpos[0],0,startpos[1]),
            vec3.fromValues(0,1,0),heading,
            vec3.fromValues(1,0,0));
        for(let i = 0;i<this.length;i++){
            if((turtle.pos[0]<-1||turtle.pos[0]>1||
                turtle.pos[2]<-1||turtle.pos[2]>1)){
                break;
            }
           let r = Math.random();
            if(1){
                let start = vec3.fromValues(turtle.pos[0],turtle.pos[1],turtle.pos[2]);
                turtle.moveforward(this.StepSize);
                let end = vec3.create();
                vec3.copy(end,turtle.pos);
                let waters = this.texture.readwater(vec2.fromValues(start[0],start[2]));
                let watere =  this.texture.readwater(vec2.fromValues(end[0],end[2]));
                //if(waters<0.5&&watere<0.5)
                this.BranchList.push(new Branch(start,end, turtle.depth,0));
                this.maxdp = Math.max(this.maxdp,turtle.depth);
            }

            let angle = this.detectdir(turtle);
            turtle.rotateAroundUp(angle);

            if(1){
                let curt1 = turtle.clone();
                let curt2 = turtle.clone();
                curt1.rotateAroundUp(90);
                let pop = this.texture.readdens(vec2.fromValues(curt1.pos[0],curt1.pos[2]));
                this.drawgrid(curt1,15*(Math.pow(1+pop,2)));
                curt2.rotateAroundUp(270);
                this.drawgrid(curt2,15*(Math.pow(1+pop,2)));

            }
        }
    }






}