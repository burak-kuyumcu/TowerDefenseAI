precision mediump float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec4 sceneColor = texture2D(uScene, vUv);

  float gray = dot(sceneColor.rgb, vec3(0.299, 0.587, 0.114));

  vec2 centered = vUv - 0.5;
  float distanceFromCenter = length(centered);

  float scanline = sin((vUv.y * uResolution.y * 0.9) + uTime * 8.0) * 0.06;
  float pulse = sin(distanceFromCenter * 32.0 - uTime * 2.8) * 0.08;

  vec3 scanColor = vec3(0.08, 0.95, 1.0);
  vec3 base = mix(vec3(gray * 0.35), scanColor * gray * 1.8, 0.75);

  float vignette = smoothstep(0.85, 0.25, distanceFromCenter);
  vec3 finalColor = base + scanline + pulse;

  finalColor *= vignette;
  finalColor += scanColor * 0.08;

  gl_FragColor = vec4(finalColor, 1.0);
}