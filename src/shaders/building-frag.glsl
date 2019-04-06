#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
in float maxh;
in vec4 shadowpos;

uniform sampler2D Density;
uniform sampler2D shadow;
uniform vec3 u_sun;

out vec4 out_Col;

void main()
{


    float shadowval = 1.f;

    vec3 shadowmaploc = shadowpos.xyz/shadowpos.w;
    shadowmaploc = shadowmaploc*0.5+0.5;
    vec4 t = texture(shadow,shadowmaploc.xy);
    //if(t.x<shadowmaploc.z-0.003){
    //    shadowval = 0.1f;
    //}
     float texsize = 1.0/4000.f;
    for(int x = -1; x <= 1; ++x)
    {
        for(int y = -1; y <= 1; ++y)
        {
            float pcfDepth = texture(shadow, shadowmaploc.xy + vec2(x, y) * texsize).r;
            shadowval += shadowmaploc.z - 0.0026 > pcfDepth ? .1 : 1.;
        }
    }
     shadowval/=9.0;


    vec3 ld = normalize(u_sun);
    float lamb = dot(ld,normalize(fs_Nor.xyz));
    vec2 uv ;
    uv.x = (fs_Pos.x+1.f)/2.f;
    uv.y = (fs_Pos.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));

    float curden = den.x;
    vec3 col;
    if(curden>0.0&&curden<0.2){
        col = vec3(0.1,0.1,0.1);
    }
    else if(curden>=0.2&&curden<0.4){
        col = vec3(0.3,0.3,0.3);
    }
    else if(curden>=0.4&&curden<0.6){
        col = vec3(0.5,0.5,0.5);
    }
    else if(curden>=0.6&&curden<0.8){
        col = vec3(0.8,0.8,0.8);
    }
    else{
        col = vec3(1.0,1.0,1.0);
    }

    col = vec3(1.);
    if(lamb<0.f) lamb = 0.f;
    col = col*lamb;

    bool xval = abs((int(fs_Pos.x*1500.0)))%6>2;
    bool yval = abs((int(fs_Pos.y*1500.0)))%6>2;
    bool zval = abs((int(fs_Pos.z*1500.0)))%6>2;

    //if(xval&&yval&&zval&&fs_Pos.y<maxh){
    //    col = vec3(0.6)*lamb;
    //}

    if(shadowval<0.f) shadowval = 0.f;

    vec4 fcol = vec4(col*shadowval+vec3(0.2,0.2,0.3),1.f);//vec4(vec3(gl_FragCoord.z),1.f);//vec4(fs_Nor.xyz,1.f);
    out_Col = fcol;
}
