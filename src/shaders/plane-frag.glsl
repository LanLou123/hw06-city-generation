#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
uniform sampler2D Density;
uniform sampler2D shadow;
out vec4 out_Col;

in vec4 shadowpos;

void main()
{

    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));
    vec4 col = vec4(1);
    if(den.z>0.5) col = vec4(vec3(0.f,0.f,1.f)*den.z,1.f);
    else{
        col = vec4(mix(vec3(0,1,0),vec3(0.8,0.8,0.2),den.x*2.f),1.f);
    }

    float shadowval = 1.f;

    vec3 shadowmaploc = shadowpos.xyz/shadowpos.w;
    shadowmaploc = shadowmaploc*0.5+0.5;
    vec4 t = texture(shadow,shadowmaploc.xy);
    if(t.x==0.f){
        shadowval = 1.f;
    }
    else if(t.x<shadowmaploc.z-0.003){
        shadowval = 0.f;
    }


    out_Col = vec4(col.xyz*shadowval+vec3(0.2,0.2,0.3),1.0);
}