import * as THREE from 'three'
import { BaseObject } from './BaseObject';
import { Object3DOptions } from './object3d';
import { Scene } from '../Scene';
import { WaterEffect } from '../effects/water/WaterEffect';
import { Vector2 } from 'three';

/**
 * Box Geometry
 */
export class Water extends BaseObject {
    constructor(options:Object3DOptions,context:Scene){
        super(options,context)
        let appearance = options.appearance;
        let offset = appearance.offset || [];
        let offsetX = offset[0] || 0;
        let offsetY = offset[1] || 0;
        let offsetZ = offset[2] || 0;
        let color = appearance.color || 0x00ff00;
        //let light = appearance.light || false;4

        let position = options.position;
        let x = position[0] as number,
            y = position[1] as number;

        let geometry = new THREE.PlaneBufferGeometry( 10000, 10000, 1, 1 );


        let water = new WaterEffect(geometry,{
            color:color,
            flowDirection:new Vector2(1,1),
            repaint:()=>{
                this.context.map.triggerRepaint()
            }
        });

        this.mesh = water.mesh;
        this.mesh.position.set(x + offsetX,y + offsetY, offsetZ);

        this.mesh.castShadow = appearance.castShadow || false;
        this.mesh.receiveShadow = appearance.receiveShadow || false;
    }
} 