#version 300 es

uniform mat4 u_ViewProj;
uniform mat4 u_ModelInvTr;
uniform float u_Time;

uniform mat4 uPmat;
uniform mat4 uMVmat;

uniform sampler2D Density;
uniform sampler2D Comb;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused

in vec4 b1;
in vec4 b2;
in vec4 b3;
in vec4 b4;

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Nor;
out float maxh;

void main()
{

     mat4 rot;
     rot[0] = b1;
     rot[1] = b2;
     rot[2] = b3;
     rot[3] = b4;

    vec4 pnotrans = vec4(mat3(rot)*vs_Pos.xyz,1.0);

    vec4 h = vec4(0.f,0.08,0.f,1.f);
    h = rot*h;
    maxh = h.y;

    vec4 pp = rot*vs_Pos;
    vec2 uv ;
    uv.x = (pp.x+1.f)/2.f;
    uv.y = (pp.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));
    vec4 com = texture(Comb,vec2(uv));




    fs_Pos = pp;

    fs_Nor =  vec4(mat3(transpose(inverse(rot)))*vs_Nor.xyz,1.0);

    gl_Position = uPmat*uMVmat*pp;
}
