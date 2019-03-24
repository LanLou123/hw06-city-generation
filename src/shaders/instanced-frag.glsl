#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col;

void main()
{

    out_Col = vec4(vec3(0,0,0),1.f);
}
