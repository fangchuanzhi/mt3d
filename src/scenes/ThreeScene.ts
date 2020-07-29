import { mapProps } from "../Mapbox3DScene";
import { Evented } from "mapbox-gl";
import * as THREE from 'three'
import { defined } from "../utils/util";
import { Fog } from "./Fog";
import { BackGround } from "./background";
import { Object3DOptions } from "../objects/object3d";
import * as objects from '../objects'
import { CameraForMap } from "../camera/CameraForMap";
import { DirectionalLight, SpotLight, Vector2} from "three";

export interface ThreeSceneOptions {
    map:mapProps,
    gl:WebGLRenderingContext,
    showFog?:boolean
}

/**
 * three场景
 */
export class ThreeScene extends Evented {
    map:mapProps;
    gl:WebGLRenderingContext;
    renderer:THREE.WebGLRenderer;
    scene:THREE.Scene;
    sceneFront:THREE.Scene;
    originCamera:THREE.Camera;
    cameraForMap:CameraForMap;
    fog:Fog|null;
    _showFog:boolean = false;
    size = new Vector2();
    worldGroup = (function(){
        let group = new THREE.Group();
        group.matrixAutoUpdate = false;
        return group
    })();
    constructor(options:ThreeSceneOptions){

        super();

        this.map = options.map;
        this.gl = options.gl;

        this.showFog = defined(options.showFog,true);
        this.renderer = new THREE.WebGLRenderer({
            canvas:this.map.getCanvas(),
            context:this.gl,
            antialias:true,
            alpha:true
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
        this.renderer.shadowMap.enabled = true;
        this.fog = null;

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
        let object = new objects[object3DOptions.type](object3DOptions);
        this.worldGroup.add(object.mesh as THREE.Mesh);
    }
    /**
     * 渲染雾化效果
     */
    renderFog(){
        if(this.showFog){
            if(!this.fog){
                this.fog = new Fog(this);
            }
            this.sceneFront.add(this.fog.mesh as THREE.Mesh);
        }
        if(!this.showFog && this.fog){
            this.sceneFront.remove(this.fog.mesh as THREE.Mesh)
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
        // let depthRange =  this.gl.getParameter(this.gl.DEPTH_RANGE);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        // this.gl.enable(this.gl.DEPTH_TEST);
        // this.gl.depthRange(0.0, 1.0);
        this.renderer.state.reset();
        this.worldGroup.matrix.copy(this.cameraForMap.ObjectMatrixWorld);
        this.renderer.render( this.scene, this.cameraForMap );
        //this.gl.depthRange(depthRange[0],depthRange[1]);
    }
    /**
     * 最后渲染
     */
    renderFront(){
        this.gl.enable(this.gl.BLEND);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthRange(0.99, 1.0);
        this.renderer.state.reset();
        this.renderFog();
        this.renderer.render( this.sceneFront, this.originCamera );
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