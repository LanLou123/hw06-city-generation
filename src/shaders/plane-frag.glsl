#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
uniform sampler2D Density;
out vec4 out_Col;

void main()
{
    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));
    vec4 col = vec4(1);
    if(den.z>0.5) col = vec4(0.f,0.f,1.f,1.f);
    out_Col = col;
}