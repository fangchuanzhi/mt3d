import * as THREE from 'three'
import {v5} from 'uuid'
import { Object3D } from 'three';

export class BaseObject {
    mesh:THREE.Mesh | Object3D | undefined;
    material:THREE.Material |undefined;
    geometry:THREE.BufferGeometry | undefined;
    id:string;
    constructor(){
        this.id = v5("object",v5.URL);
    }
}