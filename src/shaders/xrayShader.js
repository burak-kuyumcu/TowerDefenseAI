export const xrayVertexShader = `
  varying float vRim;

  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewDir = normalize(-mvPosition.xyz);

    vRim = 1.0 - max(dot(n, viewDir), 0.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const xrayFragmentShader = `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uEmissive;
  uniform float uEmissiveIntensity;

  varying float vRim;

  void main() {
    float rim = pow(vRim, 1.05);

    vec3 xray = vec3(0.2, 0.95, 1.0);
    vec3 color = xray * (0.18 + rim * 1.65);
    color += uEmissive * uEmissiveIntensity;

    gl_FragColor = vec4(color, 0.68);
  }
`;