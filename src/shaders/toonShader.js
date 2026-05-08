export const toonVertexShader = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const toonFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uEmissive;
  uniform float uEmissiveIntensity;
  uniform vec3 uLightDirection;

  varying vec3 vNormal;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 l = normalize(uLightDirection);

    float d = max(dot(n, l), 0.0);

    float shade;
    if (d > 0.75) shade = 1.0;
    else if (d > 0.45) shade = 0.72;
    else if (d > 0.22) shade = 0.48;
    else shade = 0.28;

    vec3 finalColor = uColor * shade;
    finalColor += uEmissive * uEmissiveIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;