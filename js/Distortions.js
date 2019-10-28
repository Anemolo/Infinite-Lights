/**
    Distortion List:
     - mountainDistortion
     - 


    // ShaderShaping funcitns
    https://thebookofshaders.com/05/
     Steps 
     1. Write getDistortion in GLSL
     2. Write custom uniforms for tweak parameters. Put them outside the object.
     3. Re-create the GLSl funcion in javascript to get camera paning

     Notes: 
     LookAtAmp AND lookAtOffset are hand tuned to get a good camera panning.
 */

    let nsin = (val)=> Math.sin(val) *0.5+0.5;
let mountainUniforms = {
    uAmp: new THREE.Uniform(new THREE.Vector3(30,30,20)),
    uFreq: new THREE.Uniform(new THREE.Vector3(3,6,10))
}
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
    getJS: (progress, time)=>{
    let movementProgressFix = 0.02;

    let uFreq = mountainUniforms.uFreq.value;
    let uAmp = mountainUniforms.uAmp.value;

    let distortion =  new THREE.Vector3(
                Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
                nsin(progress * Math.PI * uFreq.y + time) * uAmp.y - nsin(movementProgressFix * Math.PI * uFreq.y + time) * uAmp.y,
                nsin(progress * Math.PI * uFreq.z + time) * uAmp.z - nsin(movementProgressFix * Math.PI * uFreq.z + time) * uAmp.z
    )

    let lookAtAmp = new THREE.Vector3(2.,2.,2.);
    let lookAtOffset = new THREE.Vector3(0.,0.,-5.);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
}
}




let xyUniforms = {
    uFreq: new THREE.Uniform(new THREE.Vector2(5,8.5)),
    uAmp: new THREE.Uniform(new THREE.Vector2(40,5)),
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
            getJS: (progress, time)=>{
    let movementProgressFix = 0.02;

    let uFreq = mountainUniforms.uFreq.value;
    let uAmp = mountainUniforms.uAmp.value;

    let distortion =  new THREE.Vector3(
                Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
                Math.sin(progress * Math.PI * uFreq.y + time + Math.PI/2.) * uAmp.y - Math.sin(movementProgressFix * Math.PI * uFreq.y + time + Math.PI/2.) * uAmp.y,
                0.
    )
    let lookAtAmp = new THREE.Vector3(2.,0.4,1.);
    let lookAtOffset = new THREE.Vector3(0.,0.,-3.);
    return distortion.multiply(lookAtAmp).add(lookAtOffset);
}
}



    let LongRaceUniforms ={
    uFreq: new THREE.Uniform(new THREE.Vector2(4,3.)),
    uAmp: new THREE.Uniform(new THREE.Vector2(120,40)),
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
        `   ,
        getJS:  (progress,time)=>{
            let camProgress = 0.0125;

    let uFreq = LongRaceUniforms.uFreq.value;
    let uAmp = LongRaceUniforms.uAmp.value;
            // Uniforms

            let distortion =  new THREE.Vector3(
                Math.sin(progress * Math.PI * uFreq.x +time) * uAmp.x - Math.sin(camProgress * Math.PI * uFreq.x +time) * uAmp.x,
                Math.sin(progress * Math.PI * uFreq.y +time) * uAmp.y - Math.sin(camProgress * Math.PI * uFreq.y +time) * uAmp.y,
                0.
            );
            
            let lookAtAmp = new THREE.Vector3(1.,1.,0.);
            let lookAtOffset = new THREE.Vector3(0.,0.,-5.);
            return distortion.multiply(lookAtAmp).add(lookAtOffset);      
        }

    }


 

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