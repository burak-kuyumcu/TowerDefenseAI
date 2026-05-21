export const neonVertexShader = `
  varying float vGlow;

  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewDir = normalize(-mvPosition.xyz);

    vGlow = 1.0 - max(dot(n, viewDir), 0.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const neonFragmentShader = `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uEmissive;
  uniform float uEmissiveIntensity;

  varying float vGlow;

  void main() {
    float glow = pow(vGlow, 1.55);

    vec3 color = uColor * 0.55;
    color += uColor * glow * 3.4;
    color += uColor * 0.25;
    color += uEmissive * uEmissiveIntensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;