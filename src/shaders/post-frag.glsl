#version 300 es
precision highp float;
#define FOV 45.f

uniform sampler2D Density;

uniform int u_dtype;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;

out vec4 out_col;

vec3 sky(in vec3 rd){
    return mix(vec3(0.8,0.7,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));
}

void main(){

        vec2 uv;
        uv.x = (fs_Pos.x+1.f)/2.f;
        uv.y = (fs_Pos.y+1.f)/2.f;
        vec4 den = texture(Density,vec2(uv));

    vec2 u_dim =vec2(1000.f,1000.f);
  float sx = (2.f*gl_FragCoord.x/u_dim.x)-1.f;
  float sy = 1.f-(2.f*gl_FragCoord.y/u_dim.y);
  float len = length(u_Ref - u_Eye);
  vec3 forward = normalize(u_Ref - u_Eye);
  vec3 right = cross(forward,u_Up);
  vec3 V = u_Up * len * tan(FOV/2.f);
  vec3 H = right * len * (u_dim.x/u_dim.y) * tan(FOV/2.f);
  vec3 p = u_Ref + sx * H - sy * V;

  vec3 rd = normalize(p - u_Eye);
  vec3 ro = u_Eye;



  out_col = vec4(sky(rd),1.f);//vec4(vec3(den.x),1.0);
}