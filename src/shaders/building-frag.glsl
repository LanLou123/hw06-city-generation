#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

uniform sampler2D Density;

out vec4 out_Col;

void main()
{


    vec3 ld = vec3(1.f,2.f,3.f);
    ld = normalize(ld);
    float lamb = dot(ld,normalize(fs_Nor.xyz));
    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));



    out_Col = vec4(vec3(1)*lamb,1.f);//vec4(fs_Nor.xyz,1.f);
}
