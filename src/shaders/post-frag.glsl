#version 300 es
precision highp float;

uniform sampler2D Density;

uniform int u_dtype;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;

out vec4 out_col;

void main(){
    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.y+1.f)/2.f;
    vec4 den = texture(Density,uv);
    vec4 col = vec4(0);
    if(den.z>.5){
        col = vec4(0,0,1,1);
    }
    else{
        if(u_dtype==0){
            col = mix(vec4(0.0,1.0,0.0,1.0),vec4(1.0,0.0,0.0,1.0),den.x);
        }
        else{
            col = mix(vec4(1.0,1.0,1.0,1.0),vec4(0.0,1.0,0.0,1.0),den.z);
        }

    }

    out_col = den;
}