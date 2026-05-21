precision mediump float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec4 sceneColor = texture2D(uScene, vUv);

  vec3 color = sceneColor.rgb;


  color = pow(color, vec3(0.72));

 
  float levels = 6.0;
  vec3 posterized = floor(color * levels + 0.5) / levels;

  vec2 pixel = 1.0 / uResolution;

  vec3 left = texture2D(uScene, vUv - vec2(pixel.x, 0.0)).rgb;
  vec3 right = texture2D(uScene, vUv + vec2(pixel.x, 0.0)).rgb;
  vec3 up = texture2D(uScene, vUv + vec2(0.0, pixel.y)).rgb;
  vec3 down = texture2D(uScene, vUv - vec2(0.0, pixel.y)).rgb;

  float edge =
    length(sceneColor.rgb - left) +
    length(sceneColor.rgb - right) +
    length(sceneColor.rgb - up) +
    length(sceneColor.rgb - down);

  edge = smoothstep(0.28, 0.75, edge);


  vec3 outlineColor = vec3(0.04, 0.05, 0.06);
  vec3 finalColor = mix(posterized, outlineColor, edge * 0.28);

  
  finalColor = finalColor * 1.12 + vec3(0.035);

  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}