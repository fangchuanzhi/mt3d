import * as THREE from 'three'
import { Scene } from '../Scene';
import { BaseObject } from '../objects/BaseObject';

const vertexShaderSource = `
    void main(){
        gl_Position = vec4(position.xy,0.995,1.0);
    }
`;
const fragmentShaderSource = `
    uniform vec2 resolution;
    uniform float shadowHeight;
    void main(){

        vec2 coord = gl_FragCoord.xy / resolution.xy;

        float shadowY = shadowHeight / resolution.y;
        
        float shadowFlipY = 1.0 - shadowY;

        vec4 color = vec4(0.792156862745098,0.8666666666666667,0.984313725490196,0.0);
        
        if(coord.y > shadowFlipY){

            color.a = smoothstep(shadowFlipY, shadowFlipY + 0.1 ,coord.y);

        }else{

            color.a =  0.0;
        }

        gl_FragColor = color;
    }
`;

/**
 * 雾化效果
 */
export class Fog  {
    context:Scene;
    material:THREE.ShaderMaterial
    geometry:THREE.BufferGeometry;
    mesh:THREE.Mesh;
    constructor(context:Scene){

        this.context = context;

        let material = this.material = new THREE.ShaderMaterial({
            vertexShader:vertexShaderSource,
            fragmentShader:fragmentShaderSource,
            transparent:true,
            uniforms:{
                "resolution":{
                    value:new THREE.Vector2(
                        this.context.gl.drawingBufferWidth,
                        this.context.gl.drawingBufferHeight)
                },
                "shadowHeight":{
                    value: 0
                }
            }
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
        this.mesh.onBeforeRender = ()=>{
            this.onBeforeRender();
        }
    }
    onBeforeRender(){
        
        //计算雾的裁剪高度
        let transform = this.context.map.transform;
        let pitch = transform._pitch;
        let fov = transform._fov;
        let halfFov = fov / 2;
        let cameraToCenterDistance = 0.5 / Math.tan(halfFov) * transform.height;
        let elevationAngle = (Math.PI -  Math.PI / 2 + pitch) / 2;
        let clipHeight = cameraToCenterDistance * Math.cos(elevationAngle);
        let shadowHeight = transform.height / 2 - clipHeight;

        if(shadowHeight < 0 && pitch > 57){
            shadowHeight = 0;
        }

        if(this.material){
            let material = this.material as any;
            material.uniforms.resolution.value = new THREE.Vector2(
                this.context.gl.drawingBufferWidth,
                this.context.gl.drawingBufferHeight);
            material.uniforms.shadowHeight.value = shadowHeight;
        }
    }
}