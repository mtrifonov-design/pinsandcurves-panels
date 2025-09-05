vec2 example(float blurScale, vec2 screenSize) {
    return vec2(0.0, blurScale / screenSize.y);
}