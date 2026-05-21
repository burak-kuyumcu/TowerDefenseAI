export const toonVertexShader = `
  varying float vShade;

  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec3 lightDir = normalize(vec3(0.4, 1.0, 0.6));
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
    float s = 0.22;

    if (vShade > 0.78) {
      s = 1.15;
    } else if (vShade > 0.48) {
      s = 0.72;
    } else if (vShade > 0.22) {
      s = 0.42;
    }

    vec3 color = uColor * s;
    color += uEmissive * uEmissiveIntensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;