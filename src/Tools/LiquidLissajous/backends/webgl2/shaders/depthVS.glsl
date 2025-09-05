#version 300 es
in  vec2 a_pos;
in float particleCount;  
in float width;         
in float height;        

in float slice;
out vec2 v_uv;
out float v_particleCount;
// out vec3 v_backgroundColor;
out float v_width;      
out float v_height;      

out float v_slice;

void main() {
    v_uv = a_pos;          
    v_particleCount = particleCount;   
    gl_Position = vec4(a_pos, 0.0, 1.0);
    v_width = width;      
    v_height = height;   
    v_slice = slice;      
}