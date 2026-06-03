precision mediump float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

float getLuma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 pixel = 1.0 / uResolution;

  vec4 sceneColor = texture2D(uScene, vUv);
  vec3 color = sceneColor.rgb;

  color = pow(color, vec3(0.72));

  float levels = 5.0;
  vec3 posterized = floor(color * levels + 0.5) / levels;

  vec3 left = texture2D(uScene, vUv - vec2(pixel.x, 0.0)).rgb;
  vec3 right = texture2D(uScene, vUv + vec2(pixel.x, 0.0)).rgb;
  vec3 up = texture2D(uScene, vUv + vec2(0.0, pixel.y)).rgb;
  vec3 down = texture2D(uScene, vUv - vec2(0.0, pixel.y)).rgb;

  float centerLum = getLuma(sceneColor.rgb);

  float edge =
    abs(centerLum - getLuma(left)) +
    abs(centerLum - getLuma(right)) +
    abs(centerLum - getLuma(up)) +
    abs(centerLum - getLuma(down));

  edge = smoothstep(0.08, 0.26, edge);

  vec3 outlineColor = vec3(0.025, 0.03, 0.04);
  vec3 warmTint = vec3(1.08, 1.02, 0.92);

  vec3 finalColor = posterized * warmTint;
  finalColor = mix(finalColor, outlineColor, edge * 0.78);

  float paperNoise =
    sin(vUv.x * uResolution.x * 0.08 + uTime) *
    sin(vUv.y * uResolution.y * 0.08 - uTime) *
    0.018;

  finalColor += paperNoise;
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}