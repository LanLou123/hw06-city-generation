#version 300 es
precision highp float;

uniform sampler2D Density;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;

out vec4 out_col;

void main(){
    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (1.f-fs_Pos.y)/2.f;
    vec4 den = texture(Density,uv);
    vec4 col = vec4(0);
    if(den.z>0.5){
        col = vec4(0,0,1,1);
    }
    else{
        vec4 landcol = vec4(vec3(1),1.0);
        vec4 mtncol = vec4(vec3(0),1.0);
        col = mix(mtncol,landcol,vec4(den.x));
    }
    out_col = col;
}