#version 300 es
precision highp float;


in vec4 fs_Col;
in vec4 fs_Pos;


layout (location = 0) out vec4 Rasterize;


void main()
{
    Rasterize = vec4(vec3(1,1,1),1);
}