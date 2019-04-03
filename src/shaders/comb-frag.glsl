#version 300 es
precision highp float;


layout (location = 0) out vec4 comb;
uniform sampler2D Density;
uniform sampler2D Rasterize;

uniform int u_dtype;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;





void main(){
    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.y+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));
    vec4 rr = texture(Rasterize,uv);
    vec4 col = vec4(vec3(0),1);

    if(rr.x>0.f){
        col = vec4(1,1,1,1);
    }
    if(den.z>0.5f){
        col = vec4(0.0,0.0,0.5,1.f);
    }

    comb = col;
}