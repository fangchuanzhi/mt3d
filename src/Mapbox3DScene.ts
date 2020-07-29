
import { calcMatrices } from './overwrites/calcMatrices'

import {Map,Evented, Point,LngLat} from 'mapbox-gl';
import { coveringTiles } from './overwrites/coveringTiles';

import {ThreeScene} from './scenes/ThreeScene'

import { Object3DOptions } from './objects/object3d';

export type mapProps = Map & {
    transform:{
        maxPitch:number,
        _calcMatrices():void,
        coveringTiles(options:any):any,
        _pitch:number,
        _fov:number,
        angle:number,
        width:number,
        height:number,
        centerOffset:Point,
        point:Point,
        scale:number,
        center:LngLat
    }
}

export interface SceneOptions {
    map:mapProps,
    gl:WebGLRenderingContext
}

/**
 * 城市场景
 */
export default class Mapbox3DScene extends Evented {

    pitch:number = 85
    map:mapProps;
    gl:WebGLRenderingContext;
    threeScene:ThreeScene;

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

        this.threeScene = new ThreeScene({
            map:this.map,
            gl:this.gl,
            showFog:true
        });
    }

    update(matrix:Float64Array){
        this.threeScene.update(matrix);
    }

    addEntity(options:Object3DOptions){
        return this.threeScene.addObject(options);
    }
    
}