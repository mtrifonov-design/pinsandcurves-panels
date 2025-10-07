in vec2 uv;
vec3  baseColor =  vec3(0.90, 0.92, 0.95);    // e.g. vec3(0.90, 0.92, 0.95)
vec3  lightDir = normalize(vec3(0.5, 0.6, 1.0));     // e.g. normalize(vec3(0.5, 0.6, 1.0))
vec3  viewDir = vec3(0.,0.,1.);      // e.g. vec3(0.0, 0.0, 1.0)
#define PI 3.141592653589793

// ---------------- noise / fbm for marble ----------------
float hash(vec2 p){          // quick & cheap
    p = fract(p*vec2(123.34, 345.45));
    p += dot(p, p+34.345);
    return fract(p.x*p.y);
}
float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1,0));
    float c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
    float a=0.5, s=0.0;
    for(int i=0;i<5;i++){
        s += a*noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return s;
}


// ---------------- marble albedo ----------------
vec3 marbleColor(vec2 p, vec3 baseCol){
    // Rotate coordinate to tilt veins
    float theta = radians(25.0);
    mat2 R = mat2(cos(theta), -sin(theta), sin(theta), cos(theta));
    vec2 q = R * (p * 6.0); // vein frequency

    // Turbulence drives sine veining
    float t = fbm(q*1.0) * 1.2 + 0.35*fbm(q*2.3) + 0.1*fbm(q*4.7);
    float veins = 0.5 + 0.5 * sin(6.0*q.x + 4.0*t);

    // Mix subtle warm/cool tones for depth
    vec3 tintA = baseCol * vec3(0.6, 0.98, 0.78) * 0.5;
    vec3 tintB = baseCol * vec3(0.99, 0.49, .69) * 0.5;
    vec3 veinsCol = mix(vec3(0.99,0.99,0.99), vec3(0.05,0.06,0.88), smoothstep(0.,1.,veins));

    // Marble is mostly base with thin dark veins
    float vMask = smoothstep(0.35, 0.65, veins);
    vec3 col = mix(veinsCol, mix(tintA, tintB, t), vMask);

    // Slight large-scale variation
    float macro = fbm(p*0.7);
    col *= mix(0.92, 1.05, macro);
    return col;
}


void main() {
    vec4 srcPx = texture(src,uv);
    float d = srcPx.r + 100.;          // negative inside
    // Smooth edge (anti-aliasing
    float alpha = smoothstep(0.01, 0.0, d);

    vec2 g = srcPx.gb;         // expected in pixel units or normalized; we'll normalize below
    // If your gradTex is already unit-length, you can scale it a bit to control curvature

    // Procedural marble base (use screen coords in “meters”: uv * min(res))
    vec2 p = (uv - 0.5) * min(canvas.x, canvas.y) / 200.0;
    vec3 albedo = marbleColor(p, baseColor);

    vec3 col = albedo;
    vec4 srcIm = texture(srcIm, uv);
    // premultiplied alpha compositing over srcIm
    col = mix(srcIm.rgb, col, alpha);
    outColor = vec4(col, alpha + srcIm.a * (1.0 - alpha));
}
