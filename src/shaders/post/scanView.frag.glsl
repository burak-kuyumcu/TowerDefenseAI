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

  vec4 sceneColor = texture2D(uScene, vUv);
  vec3 color = sceneColor.rgb;

  float center = getLuma(color);
  float right = getLuma(texture2D(uScene, vUv + vec2(texel.x, 0.0)).rgb);
  float left = getLuma(texture2D(uScene, vUv - vec2(texel.x, 0.0)).rgb);
  float up = getLuma(texture2D(uScene, vUv + vec2(0.0, texel.y)).rgb);
  float down = getLuma(texture2D(uScene, vUv - vec2(0.0, texel.y)).rgb);

  float edge = abs(center - right)
    + abs(center - left)
    + abs(center - up)
    + abs(center - down);

  float edgeMask = smoothstep(0.06, 0.24, edge);

  vec2 centered = vUv - 0.5;
  float distanceFromCenter = length(centered);

  float scanline =
    sin((vUv.y * uResolution.y * 0.9) + uTime * 11.0) * 0.055;

  float radialPulse =
    sin(distanceFromCenter * 34.0 - uTime * 3.2) * 0.08;

  float gridX = smoothstep(0.985, 1.0, sin(vUv.x * uResolution.x * 0.15));
  float gridY = smoothstep(0.985, 1.0, sin(vUv.y * uResolution.y * 0.15));
  float grid = (gridX + gridY) * 0.035;

  float inverted = 1.0 - center;

  vec3 scanColor = vec3(0.08, 0.95, 1.0);
  vec3 deepBlue = vec3(0.02, 0.11, 0.19);

  vec3 base = mix(deepBlue, scanColor * inverted * 1.35, 0.78);
  vec3 edgeGlow = scanColor * edgeMask * 1.85;

  float vignette = smoothstep(0.9, 0.24, distanceFromCenter);

  vec3 finalColor = base + edgeGlow;
  finalColor += scanline + radialPulse + grid;
  finalColor *= vignette;
  finalColor += scanColor * 0.055;

  gl_FragColor = vec4(finalColor, 1.0);
}