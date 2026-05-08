export const neonVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const neonFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uEmissive;
  uniform float uEmissiveIntensity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPosition);

    float rim = 1.0 - max(dot(n, v), 0.0);
    rim = pow(rim, 2.2);

    vec3 finalColor = uColor * 0.55;
    finalColor += uColor * rim * 1.4;
    finalColor += uEmissive * uEmissiveIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;