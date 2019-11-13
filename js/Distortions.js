/**

    Here on top you can find the uniforms for each distortion. 

    // ShaderShaping funcitns
    https://thebookofshaders.com/05/
     Steps 
     1. Write getDistortion in GLSL
     2. Write custom uniforms for tweak parameters. Put them outside the object.
     3. Re-create the GLSl funcion in javascript to get camera paning

     Notes: 
     LookAtAmp AND lookAtOffset are hand tuned to get a good camera panning.
 */

const mountainUniforms = {
  // x, y, z
  uFreq: new THREE.Uniform(new THREE.Vector3(3, 6, 10)),
  uAmp: new THREE.Uniform(new THREE.Vector3(30, 30, 20))
};

const xyUniforms = {
  // x,y
  uFreq: new THREE.Uniform(new THREE.Vector2(5, 2)),
  uAmp: new THREE.Uniform(new THREE.Vector2(25, 15))
};

const LongRaceUniforms = {
  // x, y
  uFreq: new THREE.Uniform(new THREE.Vector2(2, 3)),
  uAmp: new THREE.Uniform(new THREE.Vector2(35, 10))
};

const turbulentUniforms = {
  // x,x, y,y
  uFreq: new THREE.Uniform(new THREE.Vector4(4, 8, 8, 1)),
  uAmp: new THREE.Uniform(new THREE.Vector4(25, 5, 10, 10))
};

const deepUniforms = {
  // x, y
  uFreq: new THREE.Uniform(new THREE.Vector2(4, 8)),
  uAmp: new THREE.Uniform(new THREE.Vector2(10, 20)),
  uPowY: new THREE.Uniform(new THREE.Vector2(20, 2))
};

let nsin = val => Math.sin(val) * 0.5 + 0.5;

let mountainDistortion = {
  uniforms: mountainUniforms,
  getDistortion: `

    uniform vec3 uAmp;
    uniform vec3 uFreq;

    #define PI 3.14159265358979
    
        float nsin(float val){
        return sin(val) * 0.5+0.5;
        }
    
    vec3 getDistortion(float progress){

            float movementProgressFix = 0.02;
            return vec3( 
                cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
                nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
                nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z
            );
        }
`,
  getJS: (progress, time) => {
    let movementProgressFix = 0.02;

    let uFreq = mountainUniforms.uFreq.value;
    let uAmp = mountainUniforms.uAmp.value;

    let distortion = new THREE.Vector3(
      Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
        Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
      nsin(progress * Math.PI * uFreq.y + time) * uAmp.y -
        nsin(movementProgressFix * Math.PI * uFreq.y + time) * uAmp.y,
      nsin(progress * Math.PI * uFreq.z + time) * uAmp.z -
        nsin(movementProgressFix * Math.PI * uFreq.z + time) * uAmp.z
    );

    let lookAtAmp = new THREE.Vector3(2, 2, 2);
    let lookAtOffset = new THREE.Vector3(0, 0, -5);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
  }
};

let xyDistortion = {
  uniforms: xyUniforms,
  getDistortion: `
    uniform vec2 uFreq;
    uniform vec2 uAmp;
	
				#define PI 3.14159265358979

				
				vec3 getDistortion(float progress){

						float movementProgressFix = 0.02;
						return vec3( 
							cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) *uAmp.x,
							sin(progress * PI * uFreq.y + PI/2. + uTime) * uAmp.y - sin(movementProgressFix * PI * uFreq.y + PI/2. + uTime) * uAmp.y,
							0.
						);
					}
			`,
  getJS: (progress, time) => {
    let movementProgressFix = 0.02;

    let uFreq = xyUniforms.uFreq.value;
    let uAmp = xyUniforms.uAmp.value;

    let distortion = new THREE.Vector3(
      Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
        Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
      Math.sin(progress * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y -
        Math.sin(movementProgressFix * Math.PI * uFreq.y + time + Math.PI / 2) *
          uAmp.y,
      0
    );
    let lookAtAmp = new THREE.Vector3(2, 0.4, 1);
    let lookAtOffset = new THREE.Vector3(0, 0, -3);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
  }
};

let LongRaceDistortion = {
  uniforms: LongRaceUniforms,
  getDistortion: `

    uniform vec2 uFreq;
    uniform vec2 uAmp;
				#define PI 3.14159265358979
				
				vec3 getDistortion(float progress){

						float camProgress = 0.0125;
						return vec3( 
							sin(progress * PI * uFreq.x +uTime) * uAmp.x - sin(camProgress * PI * uFreq.x+uTime ) * uAmp.x,
							sin(progress * PI * uFreq.y +uTime) * uAmp.y - sin(camProgress * PI * uFreq.y+uTime ) * uAmp.y,
							0.
						);
					}
        `,
  getJS: (progress, time) => {
    let camProgress = 0.0125;

    let uFreq = LongRaceUniforms.uFreq.value;
    let uAmp = LongRaceUniforms.uAmp.value;
    // Uniforms

    let distortion = new THREE.Vector3(
      Math.sin(progress * Math.PI * uFreq.x + time) * uAmp.x -
        Math.sin(camProgress * Math.PI * uFreq.x + time) * uAmp.x,
      Math.sin(progress * Math.PI * uFreq.y + time) * uAmp.y -
        Math.sin(camProgress * Math.PI * uFreq.y + time) * uAmp.y,
      0
    );

    let lookAtAmp = new THREE.Vector3(1, 1, 0);
    let lookAtOffset = new THREE.Vector3(0, 0, -5);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
  }
};

const turbulentDistortion = {
  uniforms: turbulentUniforms,
  getDistortion: `
        uniform vec4 uFreq;
        uniform vec4 uAmp;
        float nsin(float val){
        return sin(val) * 0.5+0.5;
        }
    
				#define PI 3.14159265358979
        float getDistortionX(float progress){
            return 
                    (
                        cos( PI * progress * uFreq.r + uTime) * uAmp.r +
                        pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)),2. )* uAmp.g
                    
                    );
        }
        float getDistortionY(float progress){
            return 
                    (
                        -nsin( PI * progress * uFreq.b + uTime) * uAmp.b +
                        -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a) ),5.) * uAmp.a
                    
                    );
        }
        vec3 getDistortion(float progress){
            return vec3(
                getDistortionX(progress)-getDistortionX(0.0125) ,
                getDistortionY(progress)- getDistortionY(0.0125),
                0.
            );
        }
    `,
  getJS: (progress, time) => {
    const uFreq = turbulentUniforms.uFreq.value;
    const uAmp = turbulentUniforms.uAmp.value;

    const getX = p =>
      Math.cos(Math.PI * p * uFreq.x + time) * uAmp.x +
      Math.pow(
        Math.cos(Math.PI * p * uFreq.y + time * (uFreq.y / uFreq.x)),
        2
      ) *
        uAmp.y;
    const getY = p =>
      -nsin(Math.PI * p * uFreq.z + time) * uAmp.z -
      Math.pow(nsin(Math.PI * p * uFreq.w + time / (uFreq.z / uFreq.w)), 5) *
        uAmp.w;

    let distortion = new THREE.Vector3(
      getX(progress) - getX(progress + 0.007),
      getY(progress) - getY(progress + 0.007),
      0
    );
    let lookAtAmp = new THREE.Vector3(-2, -5, 0);
    let lookAtOffset = new THREE.Vector3(0, 0, -10);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
  }
};

const turbulentDistortionStill = {
  uniforms: turbulentUniforms,
  getDistortion: `
        uniform vec4 uFreq;
        uniform vec4 uAmp;
        float nsin(float val){
        return sin(val) * 0.5+0.5;
        }
    
				#define PI 3.14159265358979
        float getDistortionX(float progress){
            return 
                    (
                        cos( PI * progress * uFreq.r ) * uAmp.r +
                        pow(cos(PI * progress * uFreq.g  * (uFreq.g / uFreq.r)),2. )* uAmp.g
                    
                    );
        }
        float getDistortionY(float progress){
            return 
                    (
                        -nsin( PI * progress * uFreq.b ) * uAmp.b +
                        -pow(nsin(PI * progress * uFreq.a  / (uFreq.b / uFreq.a) ),5.) * uAmp.a
                    
                    );
        }
        vec3 getDistortion(float progress){
            return vec3(
                getDistortionX(progress)-getDistortionX(0.02) ,
                getDistortionY(progress)- getDistortionY(0.02),
                0.
            );
        }
    `
};

const deepDistortion = {
  uniforms: deepUniforms,
  getDistortion: `
        uniform vec4 uFreq;
        uniform vec4 uAmp;
        uniform vec2 uPowY;
        float nsin(float val){
        return sin(val) * 0.5+0.5;
        }
    
				#define PI 3.14159265358979
        float getDistortionX(float progress){
            return 
                    (
                        sin(progress * PI * uFreq.x + uTime) * uAmp.x
                    
                    );
        }
        float getDistortionY(float progress){
            return 
                    (
                        pow(abs(progress * uPowY.x),uPowY.y) + sin(progress * PI * uFreq.y + uTime) * uAmp.y
                    );
        }
        vec3 getDistortion(float progress){
            return vec3(
                getDistortionX(progress)-getDistortionX(0.02) ,
                getDistortionY(progress)- getDistortionY(0.02),
                0.
            );
        }
    `,
  getJS: (progress, time) => {
    const uFreq = deepUniforms.uFreq.value;
    const uAmp = deepUniforms.uAmp.value;
    const uPowY = deepUniforms.uPowY.value;

    const getX = p => Math.sin(p * Math.PI * uFreq.x + time) * uAmp.x;
    const getY = p =>
      Math.pow(p * uPowY.x, uPowY.y) +
      Math.sin(p * Math.PI * uFreq.y + time) * uAmp.y;

    let distortion = new THREE.Vector3(
      getX(progress) - getX(progress + 0.01),
      getY(progress) - getY(progress + 0.01),
      0
    );
    let lookAtAmp = new THREE.Vector3(-2, -4, 0);
    let lookAtOffset = new THREE.Vector3(0, 0, -10);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
  }
};

const deepDistortionStill = {
  uniforms: deepUniforms,
  getDistortion: `
        uniform vec4 uFreq;
        uniform vec4 uAmp;
        uniform vec2 uPowY;
        float nsin(float val){
        return sin(val) * 0.5+0.5;
        }
    
				#define PI 3.14159265358979
        float getDistortionX(float progress){
            return 
                    (
                        sin(progress * PI * uFreq.x ) * uAmp.x * 2.
                    
                    );
        }
        float getDistortionY(float progress){
            return 
                    (
                        pow(abs(progress * uPowY.x),uPowY.y) + sin(progress * PI * uFreq.y ) * uAmp.y
                    );
        }
        vec3 getDistortion(float progress){
            return vec3(
                getDistortionX(progress)-getDistortionX(0.02) ,
                getDistortionY(progress)- getDistortionY(0.05),
                0.
            );
        }
    `
};
/**

    let tempUniforms ={};
    LongRacetempDistortion = {
        uniforms: tempUniforms,
        getDistortion: `

				#define PI 3.14159265358979
				
				vec3 getDistortion(float progress){

						float movementProgressFix = 0.02;
						return vec3( 
							sin(progress * PI * 4.),
							0.,
							0.
						);
					}
        `   ,
        getJS:  (progress,time)=>{
            let movementProgressFix = 0.02;

            // Uniforms

            let distortion =  new THREE.Vector3(
                Math.sin(progress * Math.PI * 4.),
               0.,
                0.
            );
            
            let lookAtAmp = new THREE.Vector3(0.,0.,0.);
            let lookAtOffset = new THREE.Vector3(0.,0.,0.);
            return distortion.multiply(lookAtAmp).add(lookAtOffset);      
        }

    }


 */
