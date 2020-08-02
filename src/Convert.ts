
import { calcMatrices } from './overwrites/calcMatrices'

import {Evented} from 'mapbox-gl';
import { coveringTiles } from './overwrites/coveringTiles';

import {SceneOptions, mapProps} from './Scene'


/**
 * 城市场景
 */
export default class Convert extends Evented {

    pitch:number = 85
    map:mapProps;
    gl:WebGLRenderingContext;

    constructor(options:SceneOptions){

        super();

        //Object.assign(this,options);
        this.map = options.map;
        this.gl = options.gl;

        if(!this.map){
            throw new Error("Missing map object");
        }
        if(!this.gl){
            throw new Error("Missing gl context");
        }

        let map = this.map;  

        map.transform.maxPitch = this.pitch;
        map.transform._calcMatrices = calcMatrices;
        map.transform.coveringTiles = coveringTiles;
        map.transform._calcMatrices();
    }
}