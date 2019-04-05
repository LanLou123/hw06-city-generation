#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;
uniform sampler2D Density;
uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;


uniform mat4 uPmat;
uniform mat4 uMVmat;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 shadowpos;

void main()
{
    vec2 uv ;
    uv.x = (vs_Pos.x+1.f)/2.f;
    uv.y = (vs_Pos.z+1.f)/2.f;
    vec4 den = texture(Density,vec2(uv));
    vec4 pos = vs_Pos;
    if(den.z>0.5){
        pos.y = 0.5-den.z;
    }
    fs_Col = vs_Col;
    fs_Pos = pos;

    shadowpos = uPmat*uMVmat*pos;

    gl_Position = u_ViewProj * pos;
}