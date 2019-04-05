#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

layout (location = 0) out vec4 comb;



void main()
{

    comb = vec4(vec3(gl_FragCoord.z),1.f);//vec4(vec3(gl_FragCoord.z),1.f);//vec4(fs_Nor.xyz,1.f);
}
