export const toonVertexShader = `
  varying float vShade;

  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec3 lightDir = normalize(vec3(0.45, 1.0, 0.65));

    vShade = max(dot(n, lightDir), 0.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const toonFragmentShader = `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uEmissive;
  uniform float uEmissiveIntensity;

  varying float vShade;

  void main() {
    float shade = 0.24;

    if (vShade > 0.82) {
      shade = 1.18;
    } else if (vShade > 0.55) {
      shade = 0.78;
    } else if (vShade > 0.28) {
      shade = 0.46;
    }

    vec3 color = uColor * shade;
    color += uEmissive * uEmissiveIntensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;