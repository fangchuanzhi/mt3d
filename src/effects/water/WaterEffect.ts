
import * as THREE from 'three'
import { CameraForMap } from "../../camera/CameraForMap";

import { Camera } from "three";
import { Reflector } from "./Reflector";
import { Refractor } from "./Refractor";

import texture1 from '../../assets/textures/Water_1_M_Normal.jpg'
import texture2 from '../../assets/textures/Water_2_M_Normal.jpg'

const WaterShader = {

    uniforms: {

        'color': {
            type: 'c',
            value: null
        },

        'reflectivity': {
            type: 'f',
            value: 0
        },

        'tReflectionMap': {
            type: 't',
            value: null
        },

        'tRefractionMap': {
            type: 't',
            value: null
        },

        'tNormalMap0': {
            type: 't',
            value: null
        },

        'tNormalMap1': {
            type: 't',
            value: null
        },

        'textureMatrix': {
            type: 'm4',
            value: null
        },
        'objectModelMatrix': {
            type: 'm4',
            value: null
        },
        'config': {
            type: 'v4',
            value: new THREE.Vector4()
        }

    },

    vertexShader: [

        '#include <common>',
        '#include <fog_pars_vertex>',
        '#include <logdepthbuf_pars_vertex>',
        'uniform mat4 objectModelMatrix;',
        'uniform mat4 textureMatrix;',

        'varying vec4 vCoord;',
        'varying vec2 vUv;',
        'varying vec3 vToEye;',

        'void main() {',

        '	vUv = uv;',
        '	vCoord = textureMatrix * vec4( position, 1.0 );',

        '	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        '	vToEye = cameraPosition - ( objectModelMatrix * vec4( position, 1.0 ) ).xyz;',

        '	vec4 mvPosition =  viewMatrix * worldPosition;', // used in fog_vertex
        '	gl_Position = projectionMatrix * mvPosition;',

        '	#include <logdepthbuf_vertex>',
        '	#include <fog_vertex>',

        '}'

    ].join('\n'),

    fragmentShader: [

        '#include <common>',
        '#include <fog_pars_fragment>',
        '#include <logdepthbuf_pars_fragment>',

        'uniform sampler2D tReflectionMap;',
        'uniform sampler2D tRefractionMap;',
        'uniform sampler2D tNormalMap0;',
        'uniform sampler2D tNormalMap1;',

        '#ifdef USE_FLOWMAP',
        '	uniform sampler2D tFlowMap;',
        '#else',
        '	uniform vec2 flowDirection;',
        '#endif',

        'uniform vec3 color;',
        'uniform float reflectivity;',
        'uniform vec4 config;',

        'varying vec4 vCoord;',
        'varying vec2 vUv;',
        'varying vec3 vToEye;',

        'void main() {',

        '	#include <logdepthbuf_fragment>',

        '	float flowMapOffset0 = config.x;',
        '	float flowMapOffset1 = config.y;',
        '	float halfCycle = config.z;',
        '	float scale = config.w;',

        '	vec3 toEye = normalize( vToEye );',

        // determine flow direction
        '	vec2 flow;',
        '	#ifdef USE_FLOWMAP',
        '		flow = texture2D( tFlowMap, vUv ).rg * 2.0 - 1.0;',
        '	#else',
        '		flow = flowDirection;',
        '	#endif',
        '	flow.x *= - 1.0;',

        // sample normal maps (distort uvs with flowdata)
        '	vec4 normalColor0 = texture2D( tNormalMap0, ( vUv * scale ) + flow * flowMapOffset0 );',
        '	vec4 normalColor1 = texture2D( tNormalMap1, ( vUv * scale ) + flow * flowMapOffset1 );',

        // linear interpolate to get the final normal color
        '	float flowLerp = abs( halfCycle - flowMapOffset0 ) / halfCycle;',
        '	vec4 normalColor = mix( normalColor0, normalColor1, flowLerp );',

        // calculate normal vector
        '	vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );',

        // calculate the fresnel term to blend reflection and refraction maps
        '	float theta = max( dot( toEye, normal ), 0.0 );',
        '	float reflectance = reflectivity + ( 1.0 - reflectivity ) * pow( ( 1.0 - theta ), 5.0 );',

        // calculate final uv coords
        '	vec3 coord = vCoord.xyz / vCoord.w;',
        '	vec2 uv = coord.xy + coord.z * normal.xz * 0.05;',

        '	vec4 reflectColor = texture2D( tReflectionMap, vec2( 1.0 - uv.x, uv.y ) );',
        '	vec4 refractColor = texture2D( tRefractionMap, uv );',

        // multiply water color with the mix of both textures
        '	gl_FragColor = vec4( color* reflectance , 1.0 )  + mix( refractColor, reflectColor, reflectance );',

        '	#include <tonemapping_fragment>',
        '	#include <encodings_fragment>',
        '	#include <fog_fragment>',

        '}'

    ].join('\n')
};

export class WaterEffect {
    type:string;
    material:THREE.ShaderMaterial;
    mesh:THREE.Mesh;
    constructor(geometry:THREE.BufferGeometry, options:any) {

        this.type = 'Water';

        options = options || {};

        var color = (options.color !== undefined) ? new THREE.Color(options.color) : new THREE.Color(0xFFFFFF);
        var textureWidth = options.textureWidth || 512;
        var textureHeight = options.textureHeight || 512;
        var clipBias = options.clipBias || 0;
        var flowDirection = options.flowDirection || new THREE.Vector2(1, 0);
        var flowSpeed = options.flowSpeed || 0.03;
        var reflectivity = options.reflectivity || 0.02;
        var scale = options.scale || 1;
        var shader = options.shader || WaterShader;
        var encoding = options.encoding !== undefined ? options.encoding : THREE.LinearEncoding;
        var repaint = options.repaint !== undefined ? options.repaint : undefined;

        var textureLoader = new THREE.TextureLoader();

        var flowMap = options.flowMap || undefined;
        var normalMap0 = options.normalMap0 || textureLoader.load(texture1);
        var normalMap1 = options.normalMap1 || textureLoader.load(texture2);

        var cycle = 0.15; // a cycle of a flow map phase
        var halfCycle = cycle * 0.5;
        var textureMatrix = new THREE.Matrix4();
        var clock = new THREE.Clock();

        var reflector = new Reflector(geometry, {
            textureWidth: textureWidth,
            textureHeight: textureHeight,
            clipBias: clipBias,
            encoding: encoding
        });

        var refractor = new Refractor(geometry, {
            textureWidth: textureWidth,
            textureHeight: textureHeight,
            clipBias: clipBias,
            encoding: encoding
        });

        reflector.mesh.matrixAutoUpdate = false;
        refractor.mesh.matrixAutoUpdate = false;

        // material

        this.material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['fog'],
                shader.uniforms
            ]),
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            transparent: true,
            fog: false
        });

        if (flowMap !== undefined) {

            this.material.defines.USE_FLOWMAP = '';
            this.material.uniforms["tFlowMap"] = {
                type: 't',
                value: flowMap
            } as any;

        } else {

            this.material.uniforms["flowDirection"] = {
                type: 'v2',
                value: flowDirection
            } as any;

        }

        // maps

        normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
        normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;

        this.material.uniforms["tReflectionMap"].value = reflector.getRenderTarget().texture;
        this.material.uniforms["tRefractionMap"].value = refractor.getRenderTarget().texture;
        this.material.uniforms["tNormalMap0"].value = normalMap0;
        this.material.uniforms["tNormalMap1"].value = normalMap1;

        // water

        this.material.uniforms["color"].value = color;
        this.material.uniforms["reflectivity"].value = reflectivity;
        this.material.uniforms["textureMatrix"].value = textureMatrix;
        this.material.uniforms["objectModelMatrix"].value = null;

        // inital values

        this.material.uniforms["config"].value.x = 0; // flowMapOffset0
        this.material.uniforms["config"].value.y = halfCycle; // flowMapOffset1
        this.material.uniforms["config"].value.z = halfCycle; // halfCycle
        this.material.uniforms["config"].value.w = scale; // scale

        // functions

        var mesh = this.mesh = new THREE.Mesh(geometry,this.material);

        function updateTextureMatrix(camera:CameraForMap) {

            textureMatrix.set(
                0.5, 0.0, 0.0, 0.5,
                0.0, 0.5, 0.0, 0.5,
                0.0, 0.0, 0.5, 0.5,
                0.0, 0.0, 0.0, 1.0
            );

            textureMatrix.multiply(camera.projectionMatrix);
            textureMatrix.multiply(camera.matrixWorldInverse);
            textureMatrix.multiply(mesh.matrixWorld);

        }

        function updateFlow() {

            var delta = clock.getDelta();
            var config = mesh.material.uniforms["config"];

            config.value.x += flowSpeed * delta; // flowMapOffset0
            config.value.y = config.value.x + halfCycle; // flowMapOffset1

            // Important: The distance between offsets should be always the value of "halfCycle".
            // Moreover, both offsets should be in the range of [ 0, cycle ].
            // This approach ensures a smooth water flow and avoids "reset" effects.

            if (config.value.x >= cycle) {

                config.value.x = 0;
                config.value.y = halfCycle;

            } else if (config.value.y >= cycle) {

                config.value.y = config.value.y - cycle;

            }

        }

        this.mesh.onBeforeRender = (renderer:THREE.WebGLRenderer, scene:THREE.Scene, camera:Camera) => {

            this.material.uniforms["objectModelMatrix"].value = (camera as CameraForMap).ObjectMatrixWorld;
            updateTextureMatrix(camera as CameraForMap);
            updateFlow();

            mesh.visible = false;

            reflector.mesh.matrixWorld.copy(mesh.matrixWorld);
            refractor.mesh.matrixWorld.copy(mesh.matrixWorld);

            (reflector.mesh as any).onBeforeRender(renderer, scene, camera);
            (refractor.mesh as any).onBeforeRender(renderer, scene, camera);

            mesh.visible = true;

            if(repaint){
                repaint();
            }

        };
    }
};

