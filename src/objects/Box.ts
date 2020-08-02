import * as THREE from 'three'
import { BaseObject } from './BaseObject';
import { Object3DOptions } from './object3d';
import { lngLatToMercator } from '../utils/util';
import { Scene } from '../Scene';

/**
 * Box Geometry
 */
export class Box extends BaseObject {
    constructor(options:Object3DOptions,context:Scene){
        super(options,context)
        let appearance = options.appearance;
        let width = appearance.width || 0;
        let height = appearance.height || 0;
        let depth = appearance.depth;
        let offset = appearance.offset || [];
        let offsetX = offset[0] || 0;
        let offsetY = offset[1] || 0;
        let offsetZ = offset[2] || 0;
        let color = appearance.color || 0x00ff00;
        let light = appearance.light || false;

        let position = options.position;
        let x = position[0] as number,
            y = position[1] as number;

        let geometry = new THREE.BoxGeometry( width, height, depth );
        let material = new THREE[!light ? "MeshBasicMaterial": "MeshLambertMaterial"]( {
            color: color
        });

        this.mesh = new THREE.Mesh( geometry, material );
        this.mesh.position.set(x + offsetX,y + offsetY, offsetZ);

        this.mesh.castShadow = appearance.castShadow || false;
        this.mesh.receiveShadow = appearance.receiveShadow || false;
    }
} 