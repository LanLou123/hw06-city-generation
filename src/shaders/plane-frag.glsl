#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
uniform sampler2D Density;
uniform sampler2D shadow;
uniform vec3 u_sun;
out vec4 out_Col;
in vec4 fs_Nor;
in vec4 shadowpos;

void main()
{

    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));
    vec4 col = vec4(1);
    col = vec4(mix(vec3(0,0.7,0),vec3(0.6,0.6,0.1),den.x*2.f),1.f);
    if(den.z>0.5) col = vec4(mix(col.xyz,vec3(0.f,0.f,.6f),(den.z-0.5)*10.f),1.f);

    float lamb = dot(normalize(u_sun),fs_Nor.xyz);

    col*=lamb;
    float shadowval = 1.f;

    float texsize = 1.0/4000.f;

    vec3 shadowmaploc = shadowpos.xyz/shadowpos.w;
    shadowmaploc = shadowmaploc*0.5+0.5;
    vec4 t = texture(shadow,shadowmaploc.xy);
    if(t.x==0.f){
        shadowval = 1.f;
    }

    else {
            for(int x = -1; x <= 1; ++x)
            {
                for(int y = -1; y <= 1; ++y)
                {
                    float pcfDepth = texture(shadow, shadowmaploc.xy + vec2(x, y) * texsize).r;
                    if(pcfDepth==0.0) pcfDepth = 1.0;
                    shadowval += shadowmaploc.z - 0.001 > pcfDepth ? .1 : 1.;
                }
            }
            shadowval/=9.0;

    }

    //else if(t.x<shadowmaploc.z-0.001){
     //   shadowval = 0.1f;
    //}


    out_Col = vec4(col.xyz*shadowval+vec3(0.2,0.2,0.3),1.0);
}