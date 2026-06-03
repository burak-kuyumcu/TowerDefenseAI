precision mediump float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

float getLuma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 texel = 1.0 / uResolution;

  vec3 color = texture2D(uScene, vUv).rgb;

  vec3 right = texture2D(uScene, vUv + vec2(texel.x, 0.0)).rgb;
  vec3 left = texture2D(uScene, vUv - vec2(texel.x, 0.0)).rgb;
  vec3 up = texture2D(uScene, vUv + vec2(0.0, texel.y)).rgb;
  vec3 down = texture2D(uScene, vUv - vec2(0.0, texel.y)).rgb;

  float edge =
    length(color - right) +
    length(color - left) +
    length(color - up) +
    length(color - down);

  float glow = smoothstep(0.12, 0.55, edge);

  vec2 centered = vUv - 0.5;
  float vignette = smoothstep(0.92, 0.22, length(centered));

  float scanline =
    sin((vUv.y * uResolution.y + uTime * 70.0) * 0.12) * 0.045;

  vec3 neonBlue = vec3(0.0, 0.88, 1.0);
  vec3 neonPink = vec3(1.0, 0.08, 0.72);
  vec3 neonGreen = vec3(0.18, 1.0, 0.45);

  vec3 neonMix = mix(neonBlue, neonPink, smoothstep(0.08, 0.92, vUv.x));
  neonMix = mix(neonMix, neonGreen, glow * 0.55);

  float luma = getLuma(color);

  vec3 finalColor = color * 0.36;
  finalColor += neonMix * (0.16 + glow * 1.55);
  finalColor += neonBlue * pow(luma, 2.0) * 0.18;
  finalColor += scanline;

  finalColor *= vignette;
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}