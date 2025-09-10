in vec2 uv;
in float texture_sample_factor;
in float progress_factor;

float gaussian(float x, float sigma) {
    return exp(-pow(x - 0.5, 2.0) / (2.0 * pow(sigma, 2.0)));
}

void main() {

    float color_variance_factor = colorVarianceFactor;
    float final_color_factor = progress_factor + color_variance_factor * (texture_sample_factor - color_variance_factor / 2.);
    final_color_factor = clamp(final_color_factor, 0.0, 1.0);

    vec4 color = texture(colorTex, vec2(final_color_factor, 0.0));


    // gaussian function for y
    float gaussian_hor_1 = gaussian(uv.x, 0.1);
    float gaussian_ver_1 = gaussian(uv.y, 0.2);
    float col_intensity = gaussian_hor_1 * gaussian_ver_1;
    float gaussian_hor_2 = gaussian(uv.x, 0.05);
    float gaussian_ver_2 = gaussian(uv.y, 0.1);
    float light_intensity = gaussian_hor_2 * gaussian_ver_2;
    float col_brightness = dot(color.rgb,vec3(1.)) / 3.0;
    bool use_light = col_brightness > 0.3;
    light_intensity = use_light ? light_intensity : 0.0;
    vec3 col = color.rgb * col_intensity + vec3(1.0) * light_intensity;
    outColor = vec4(col, 1.0);
}