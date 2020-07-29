import * as THREE from 'three'
import { ThreeScene } from './ThreeScene';
import { BaseObject } from '../objects/BaseObject';

const vertexShaderSource = `
    void main(){
        gl_Position = vec4(position.xy,1.0,1.0);
    }
`;
const fragmentShaderSource = `
    void main(){
        gl_FragColor = vec4(0.0,0.0,0.0,0.0);
    }
`;

/**
 * 背景
 * 用于解决three在渲染的时候vao没有变化导致一个mesh无法渲染的问题
 */
export class BackGround extends BaseObject {
    context:ThreeScene;
    constructor(context:ThreeScene){

        super();

        this.context = context;

        let material = this.material = new THREE.ShaderMaterial({
            vertexShader:vertexShaderSource,
            fragmentShader:fragmentShaderSource,
            transparent:true
        });

        let geometry = this.geometry = new THREE.BufferGeometry();

        let positions = new Float32Array([
            -1,1,0, 1,1,0, 1,-1,0, -1,-1,0
        ]);
        
        let indices = [
            0,3,1, 1,3,2
        ];

        geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
        geometry.setIndex(indices);

        this.mesh = new THREE.Mesh( geometry, material);

    }
}