float minRadius(float nearAbs, float fovDeg, float aspect) {
    float halfH = nearAbs * tan(radians(fovDeg) * 0.5);
    float halfW = halfH * aspect;
    return length(vec2(halfW, halfH)); // sqrt(halfW^2 + halfH^2)
}
