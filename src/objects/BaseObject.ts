import * as THREE from 'three'
import {v5} from 'uuid'
import { Object3D } from 'three';
import { Object3DOptions } from './object3d';
import { Scene } from '../Scene';

export class BaseObject {
    mesh:THREE.Mesh | Object3D | undefined;
    material:THREE.Material |undefined;
    geometry:THREE.BufferGeometry | undefined;
    id:string;
    context:Scene;
    constructor(options:Object3DOptions,context:Scene){
        this.id = options.id || v5("object",v5.URL);
        this.context = context;
    }
}