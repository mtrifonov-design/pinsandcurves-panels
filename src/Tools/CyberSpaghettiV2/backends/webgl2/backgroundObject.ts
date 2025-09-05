const backgroundVS = `#version 300 es
in vec2 a_pos;
in vec3 fillColor;
out vec3 v_color;
void main() {
  v_color = fillColor;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const backgroundFS = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;
void main() {
  outColor = vec4(v_color, 1.0);
}`;

const backgroundObject = {
  name: "background",
  instanceAttributes: [
    { name: "fillColor", size: 3 },
  ],
  vertexShader: backgroundVS,
  fragmentShader: backgroundFS,
};

export function backgroundDraw(particleSystem) {
  const { CONFIG } = particleSystem;
  const { backgroundColor } = CONFIG;
  const fillColor = backgroundColor.map(c => c / 255);
  return {
    count: 1,
    attributes: {
      fillColor: new Float32Array(fillColor),
    },
  };
}

export default backgroundObject;