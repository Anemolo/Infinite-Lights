class App {
  constructor(container, options = {}) {
    // Init ThreeJS Basics
    this.options = options;
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    });
    this.renderer.setSize(container.offsetWidth, container.offsetHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    container.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      90,
      container.offsetWidth / container.offsetHeight,
      0.1,
      10000
    );
    this.camera.position.z = -5;
    this.camera.position.y = 7;
    this.camera.position.x = 0;
    this.scene = new THREE.Scene();

    let fog = new THREE.Fog(
      options.colors.background,
      options.length * 0.2,
      options.length * 0.98
    );
    this.scene.fog = fog;
    this.fogUniforms = {
      fogColor: { type: "c", value: fog.color },
      fogNear: { type: "f", value: fog.near },
      fogFar: { type: "f", value: fog.far }
    };
    this.clock = new THREE.Clock();
    this.assets = {};
    this.disposed = false;

    // Create Objects
    this.road = new Road(this, options);
    this.leftCarLights = new CarLights(
      this,
      options,
      options.colors.leftCars,
      options.movingAwaySpeed
    );
    this.rightCarLights = new CarLights(
      this,
      options,
      options.colors.rightCars,
      options.movingCloserSpeed
    );
    this.leftSticks = new LightsSticks(this, options);
    // Binds
    this.tick = this.tick.bind(this);
    this.init = this.init.bind(this);
    this.setSize = this.setSize.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }
  loadAssets() {
    return new Promise((resolve, reject) => {
      // const manager = new THREE.LoadingManager(resolve);
      // this.text.load(manager);
    });
  }
  init() {
    const options = this.options;
    this.road.init();
    this.leftCarLights.init();

    this.leftCarLights.mesh.position.setX(
      -options.roadWidth / 2 - options.islandWidth / 2
    );
    this.rightCarLights.init();
    this.rightCarLights.mesh.position.setX(
      options.roadWidth / 2 + options.islandWidth / 2
    );
    this.leftSticks.init();
    this.leftSticks.mesh.position.setX(
      -(
        options.roadWidth +
        options.islandWidth / 2 +
        options.lightStickWidth / 2
      )
    );

    this.container.addEventListener("mousedown", this.onMouseDown);
    this.container.addEventListener("mouseup", this.onMouseUp);
    this.container.addEventListener("mouseout", this.onMouseUp);

    this.tick();
  }
  onMouseDown(ev) {
    if (this.options.onSpeedUp) this.options.onSpeedUp(ev);
    // this.fovTarget = 140;
    // this.speedupTarget = 2;
    // this.speedupLerp = 0.05;
    // camera.fov
  }
  onMouseUp(ev) {
    if (this.options.onSlowDown) this.options.onSlowDown(ev);
    // this.fovTarget = 90;
    // this.speedupTarget = 0;
    // this.speedupLerp = 0.1;
  }
  update(delta) {
    let time = this.clock.elapsedTime;

    this.rightCarLights.update(time);
    this.leftCarLights.update(time);
    this.leftSticks.update(time);
    this.road.update(time);
  }
  render(delta) {
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.disposed = true;
  }
  setSize(width, height, updateStyles) {
    this.renderer.setSize(width, height, updateStyles);
  }
  tick() {
    if (this.disposed || !this) return;
    if (resizeRendererToDisplaySize(this.renderer, this.setSize)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    const delta = this.clock.getDelta();
    this.render(delta);
    this.update(delta);
    requestAnimationFrame(this.tick);
  }
}

const distortion_uniforms = {
  uDistortionX: new THREE.Uniform(new THREE.Vector2(80, 3)),
  uDistortionY: new THREE.Uniform(new THREE.Vector2(-40, 2.5))
};

const distortion_vertex = `
#define PI 3.14159265358979
  uniform vec2 uDistortionX;
  uniform vec2 uDistortionY;

    float nsin(float val){
    return sin(val) * 0.5+0.5;
    }
  vec2 getDistortion(float progress){
        progress = clamp(progress, 0.,1.);
        float xAmp = uDistortionX.r;
        float xFreq = uDistortionX.g;
        float yAmp = uDistortionY.r;
        float yFreq = uDistortionY.g;
        return vec2( 
            xAmp * nsin(progress* PI * xFreq   - PI / 2. ) ,
            yAmp * nsin(progress * PI *yFreq - PI / 2.  ) 
        );
    }
`;

const random = base => {
  if (Array.isArray(base)) return Math.random() * (base[1] - base[0]) + base[0];
  return Math.random() * base;
};
const pickRandom = arr => {
  if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
  return arr;
};
class CarLights {
  constructor(webgl, options, colors, speed) {
    this.webgl = webgl;
    this.options = options;
    this.colors = colors;
    this.speed = speed;
  }
  init() {
    const options = this.options;
    // Curve with length 1
    let curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    );
    // Tube with radius = 1
    let geometry = new THREE.TubeBufferGeometry(curve, 25, 1, 8, false);

    let instanced = new THREE.InstancedBufferGeometry().copy(geometry);
    instanced.maxInstancedCount = options.lightPairsPerRoadWay * 2;

    let laneWidth = options.roadWidth / options.lanesPerRoad;

    let aOffset = [];
    let aMetrics = [];
    let aColor = [];

    let colors = this.colors;
    if (Array.isArray(colors)) {
      colors = colors.map(c => new THREE.Color(c));
    } else {
      colors = new THREE.Color(colors);
    }

    for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
      let radius = random(options.carLightsRadius);
      let length = random(options.carLightsLength);
      let speed = random(this.speed);

      let carLane = i % 3;
      let laneX = carLane * laneWidth - options.roadWidth / 2 + laneWidth / 2;

      let carWidth = random(options.carWidthPercentage) * laneWidth;
      // Drunk Driving
      let carShiftX = random(options.carShiftX) * laneWidth;
      // Both lights share same shiftX and lane;
      laneX += carShiftX;

      let offsetY = random(options.carFloorSeparation) + radius * 1.3;

      let offsetZ = -random(options.length);

      aOffset.push(laneX - carWidth / 2);
      aOffset.push(offsetY);
      aOffset.push(offsetZ);

      aOffset.push(laneX + carWidth / 2);
      aOffset.push(offsetY);
      aOffset.push(offsetZ);

      aMetrics.push(radius);
      aMetrics.push(length);
      aMetrics.push(speed);

      aMetrics.push(radius);
      aMetrics.push(length);
      aMetrics.push(speed);

      let color = pickRandom(colors);
      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);

      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);
    }
    instanced.addAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false)
    );
    instanced.addAttribute(
      "aMetrics",
      new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3, false)
    );
    instanced.addAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
    );

    let material = new THREE.ShaderMaterial({
      fragmentShader: carLightsFragment,
      vertexShader: carLightsVertex,
      uniforms: {
        // uColor: new THREE.Uniform(new THREE.Color(this.color)),
        uTime: new THREE.Uniform(0),
        uTravelLength: new THREE.Uniform(options.length),
        ...this.webgl.fogUniforms,
        ...distortion_uniforms
      }
    });
    let mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    this.webgl.scene.add(mesh);
    this.mesh = mesh;
  }
  update(time) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

const carLightsFragment = `

  #define USE_FOG;
  ${THREE.ShaderChunk["fog_pars_fragment"]}
  varying vec3 vColor;
  varying vec2 vUv; 
  void main() {
  vec3 color = vec3(vColor);
  float fadeStart = 0.4;
  float maxFade = 0.;
  float alpha = 1.;
  
  
  gl_FragColor = vec4(color,alpha);
  if (gl_FragColor.a < 0.0001) discard;
  ${THREE.ShaderChunk["fog_fragment"]}
  }
`;

const carLightsVertex = `
  #define USE_FOG;
  ${THREE.ShaderChunk["fog_pars_vertex"]}
  attribute vec3 aOffset;
  attribute vec3 aMetrics;
  attribute vec3 aColor;

  ${distortion_vertex}

  uniform float uTravelLength;
  uniform float uTime;
  uniform float uSpeed;

  varying vec2 vUv; 
  varying vec3 vColor; 

  void main() {
    vec3 transformed = position.xyz;
    float radius = aMetrics.r;
    float myLength = aMetrics.g;
    float speed = aMetrics.b;

    transformed.xy *= radius ;
    transformed.z *= myLength;
  
    // Add my length to make sure it loops after the lights hits the end
    transformed.z += myLength-mod( uTime *speed + aOffset.z, uTravelLength);
    transformed.xy += aOffset.xy;


    float progress = abs(transformed.z / uTravelLength);
    transformed.xy += getDistortion(progress);

    vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    vColor = aColor;
    ${THREE.ShaderChunk["fog_vertex"]}
  }`;

class LightsSticks {
  constructor(webgl, options) {
    this.webgl = webgl;
    this.options = options;
  }
  init() {
    const options = this.options;
    const geometry = new THREE.PlaneBufferGeometry(
      options.lightStickWidth,
      options.lightStickHeight
    );
    let instanced = new THREE.InstancedBufferGeometry().copy(geometry);
    let totalSticks = options.totalSideLightSticks;
    instanced.maxInstancedCount = totalSticks;

    let stickoffset = options.length / (totalSticks - 1);
    const aOffset = [];
    const aColor = [];

    let colors = options.colors.sticks;
    if (Array.isArray(colors)) {
      colors = colors.map(c => new THREE.Color(c));
    } else {
      colors = new THREE.Color(colors);
    }

    for (let i = 0; i < totalSticks; i++) {
      aOffset.push((i - 1) * stickoffset * 2 + stickoffset * Math.random());

      let color = pickRandom(colors);
      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);

      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);
    }
    instanced.addAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 1, false)
    );
    instanced.addAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false)
    );
    const material = new THREE.ShaderMaterial({
      fragmentShader: sideSticksFragment,
      vertexShader: sideSticksVertex,
      // This ones actually need double side
      side: THREE.DoubleSide,
      uniforms: {
        uTravelLength: new THREE.Uniform(options.length),
        uTime: new THREE.Uniform(0),
        ...this.webgl.fogUniforms,
        ...distortion_uniforms
      }
    });

    const mesh = new THREE.Mesh(instanced, material);
    // The object is behind the camera before the vertex shader
    mesh.frustumCulled = false;
    mesh.position.y = options.lightStickHeight / 2;
    this.webgl.scene.add(mesh);
    this.mesh = mesh;
  }
  update(time) {
    this.mesh.material.uniforms.uTime.value = time;
  }
}

const sideSticksVertex = `
#define USE_FOG;
${THREE.ShaderChunk["fog_pars_vertex"]}
attribute float aOffset;
attribute vec3 aColor;

uniform float uTravelLength;
uniform float uTime;

varying vec3 vColor;
mat4 rotationY( in float angle ) {
	return mat4(	cos(angle),		0,		sin(angle),	0,
			 				0,		1.0,			 0,	0,
					-sin(angle),	0,		cos(angle),	0,
							0, 		0,				0,	1);
}


${distortion_vertex}
  void main(){
    vec3 transformed = position.xyz;
    float time = mod(uTime  * 60. *2. + aOffset , uTravelLength);

    transformed = (rotationY(3.14/2.) * vec4(transformed,1.)).xyz;

    transformed.z +=  - uTravelLength + time;


    float progress = abs(transformed.z / uTravelLength);
    transformed.xy += getDistortion(progress);
    vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
    ${THREE.ShaderChunk["fog_vertex"]}
  }
`;
const sideSticksFragment = `
#define USE_FOG;
${THREE.ShaderChunk["fog_pars_fragment"]}
varying vec3 vColor;
  void main(){
    vec3 color = vec3(vColor);
    gl_FragColor = vec4(color,1.);
    ${THREE.ShaderChunk["fog_fragment"]}
  }
`;

class Road {
  constructor(webgl, options) {
    this.webgl = webgl;
    this.options = options;
  }
  createIsland() {
    const options = this.options;
    let segments = 100;
  }
  // Side  = 0 center, = 1 right = -1 left
  createPlane(side, width, isRoad) {
    const options = this.options;
    let segments = 100;
    const geometry = new THREE.PlaneBufferGeometry(
      isRoad ? options.roadWidth : options.islandWidth,
      options.length,
      20,
      segments
    );
    const material = new THREE.ShaderMaterial({
      fragmentShader: roadFragment,
      vertexShader: roadVertex,
      uniforms: {
        uTravelLength: new THREE.Uniform(options.length),
        uColor: new THREE.Uniform(
          new THREE.Color(
            isRoad ? options.colors.roadColor : options.colors.islandColor
          )
        ),
        ...this.webgl.fogUniforms,
        ...distortion_uniforms
      }
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    // Push it half further away
    mesh.position.z = -options.length / 2;
    mesh.position.x +=
      (this.options.islandWidth / 2 + options.roadWidth / 2) * side;
    this.webgl.scene.add(mesh);

    return mesh;
  }
  init() {
    this.leftRoadWay = this.createPlane(-1, this.options.roadWidth, true);
    this.rightRoadWay = this.createPlane(1, this.options.roadWidth, true);
    this.island = this.createPlane(0, this.options.islandWidth, false);
  }
  update(delta) {}
}

const roadFragment = `
    #define USE_FOG;
    varying vec2 vUv; 
    uniform vec3 uColor;
    ${THREE.ShaderChunk["fog_pars_fragment"]}
    void main() {
        vec3 color = vec3(uColor);
        gl_FragColor = vec4(uColor,1.);
        ${THREE.ShaderChunk["fog_fragment"]}
    }
`;

const roadVertex = `
#define USE_FOG;
${THREE.ShaderChunk["fog_pars_vertex"]}
${distortion_vertex}
uniform float uTravelLength;

varying vec2 vUv; 
void main() {
  vec3 transformed = position.xyz;

    
  transformed.xz += getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
  vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;

  ${THREE.ShaderChunk["fog_vertex"]}
}`;

function resizeRendererToDisplaySize(renderer, setSize) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    setSize(width, height, false);
  }
  return needResize;
}
