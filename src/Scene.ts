
import * as THREE from 'three'
import { defined } from "./utils/util";
import { Fog } from "./env/Fog";
import { BackGround } from "./env/background";
import { Object3DOptions } from "./objects/object3d";
import * as objects from './objects'
import { CameraForMap } from "./camera/CameraForMap";
import {  Vector2} from "three";
import Convert from "./convert";
import {Map,Point,LngLat} from 'mapbox-gl'
import { Pick } from './pick/Pick';


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
    gl:WebGLRenderingContext,
    showFog?:boolean
}

/**
 * three场景
 */
export class Scene extends Convert {
    renderer:THREE.WebGLRenderer;
    scene:THREE.Scene;
    sceneFront:THREE.Scene;
    originCamera:THREE.Camera;
    cameraForMap:CameraForMap;
    fog:Fog|null;
    _showFog:boolean = false;
    size = new Vector2();
    pick:Pick;
    worldGroup = (function(){
        let group = new THREE.Group();
        group.matrixAutoUpdate = false;
        return group
    })();
    constructor(options:SceneOptions){

        super(options);

        this.showFog = defined(options.showFog,true);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas:this.map.getCanvas(),
            context:this.gl,
            antialias:true,
            alpha:true,
        
        });
        //原始相机
        this.originCamera = new THREE.Camera();
        //地图相机
        this.cameraForMap =  new CameraForMap();
        //场景
        this.scene = new THREE.Scene();
        //前置场景
        this.sceneFront = new THREE.Scene();
        let background = new BackGround(this);

        this.scene.add(background.mesh as THREE.Mesh);
        this.sceneFront.add(background.mesh as THREE.Mesh);
        /**
         * 放置场景几何体的分组
         */
        this.scene.add(this.worldGroup);

        this.renderer.autoClear = false;
        this.renderer.info.autoReset = false;
        this.renderer.shadowMap.enabled = true;
        this.fog = null;

        /**
         * 事件拾取
         */
        this.pick = new Pick(this);

        this.map.on("render",()=>{
            this.renderFront();
        });

    }
    /**
     * 是否限制雾化
     */
    get showFog(){
        return this._showFog;
    }
    set showFog(value){
        let showFog = defined(value,false);
        if(showFog != this._showFog){
            this._showFog = showFog;
            this.map.triggerRepaint();
        }
    }
    /**
     * 
     * @param entityOptions 
     */
    addObject(object3DOptions:Object3DOptions){
        let object = new objects[object3DOptions.type](object3DOptions,this);
        this.worldGroup.add(object.mesh as THREE.Mesh);
    }
    /**
     * 渲染雾化效果
     */
    renderFog(){
        if(this.showFog){
            if(!this.fog){
                this.fog = new Fog(this);
                this.sceneFront.add(this.fog.mesh as THREE.Mesh);
            }
        }
        if(!this.showFog && this.fog){
            this.sceneFront.remove(this.fog.mesh as THREE.Mesh)
            this.fog = null;
        }
    }
    /**
     * 更新场景元素
     * @param matrix 
     */
    update(matrix:Float64Array){
        
        this.updateSize();

        this.cameraForMap.updateCamera(this.map.transform);

        this.render();
    }
    /**
     * 在renderList中顺序渲染
     */
    render(){
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.renderer.state.reset();
        this.worldGroup.matrix.copy(this.cameraForMap.ObjectMatrixWorld);
        this.renderer.render( this.scene, this.cameraForMap );
    }
    /**
     * 最后渲染
     */
    renderFront(){
        this.gl.enable(this.gl.BLEND);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthMask(true);
        this.gl.depthFunc(515)
        //this.gl.depthRange(0.0,1.0);
        //this.renderer.state.reset();
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.depthRange(0, 0.9991455078125);
        // func: 515
        // mask: true
        // range: (2) [0, 0.9991455078125]
        this.renderFog();
        if(this.fog){
            this.renderer.render( this.fog.mesh, this.originCamera );
        }
        
    }
    /**
     * 更新渲染器的大小
     */
    updateSize(){
        let size = this.renderer.getSize(this.size);
        if(this.gl.drawingBufferWidth != size.x || 
           this.gl.drawingBufferHeight != size.y){
            this.renderer.setSize(this.gl.drawingBufferWidth,this.gl.drawingBufferHeight);
            this.size.set(this.gl.drawingBufferWidth,this.gl.drawingBufferHeight)
        }
    }
}