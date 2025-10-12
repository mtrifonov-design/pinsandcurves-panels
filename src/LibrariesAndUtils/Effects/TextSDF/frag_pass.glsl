in vec2 uv;
bool outOfBounds(vec2 coord) {
    return coord.x < 0. || coord.x > 1. || coord.y < 0. || coord.y > 1.;
}

void main() {
    float stepSize = pow(2., float(10. - passNum)); 
    float relStep = stepSize / 1024.;


    vec2 topLeft = texture(src, uv + vec2(-relStep, -relStep)).rg;
    if (outOfBounds(uv + vec2(-relStep, -relStep))) topLeft = vec2(1./0.);
    vec2 topCenter = texture(src, uv + vec2(0., -relStep)).rg;
    if (outOfBounds(uv + vec2(0., -relStep))) topCenter = vec2(1./0.);
    vec2 topRight = texture(src, uv + vec2(relStep, -relStep)).rg;
    if (outOfBounds(uv + vec2(relStep, -relStep))) topRight = vec2(1./0.);
    vec2 midLeft = texture(src, uv + vec2(-relStep, 0.)).rg;
    if (outOfBounds(uv + vec2(-relStep, 0.))) midLeft = vec2(1./0.);
    vec2 midRight = texture(src, uv + vec2(relStep, 0.)).rg;
    if (outOfBounds(uv + vec2(relStep, 0.))) midRight = vec2(1./0.);
    vec2 botLeft = texture(src, uv + vec2(-relStep, relStep)).rg;
    if (outOfBounds(uv + vec2(-relStep, relStep))) botLeft = vec2(1./0.);
    vec2 botCenter = texture(src, uv + vec2(0., relStep)).rg;
    if (outOfBounds(uv + vec2(0., relStep))) botCenter = vec2(1./0.);
    vec2 botRight = texture(src, uv + vec2(relStep, relStep)).rg;
    if (outOfBounds(uv + vec2(relStep, relStep))) botRight = vec2(1./0.);

    float posInf = 1.0 / 0.0;
    vec2 winner = vec2(posInf, posInf);
    if (length(topLeft - uv) < length(winner - uv)) winner = topLeft;
    if (length(topCenter - uv) < length(winner - uv)) winner = topCenter;
    if (length(topRight - uv) < length(winner - uv)) winner = topRight;
    if (length(midLeft - uv) < length(winner - uv)) winner = midLeft;
    if (length(midRight - uv) < length(winner - uv)) winner = midRight;
    if (length(botLeft - uv) < length(winner - uv)) winner = botLeft;
    if (length(botCenter - uv) < length(winner - uv )) winner = botCenter;
    if (length(botRight - uv) < length(winner- uv)) winner = botRight;
    outColor = vec4(winner, 0., 1.);
}