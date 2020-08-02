import { Evented } from "mapbox-gl";
import { Scene, mapProps } from "../Scene";
import {Raycaster,Vector2, Vector3} from 'three'
import { CameraForMap } from "../camera/CameraForMap";
import content from "*.svg";
 
var raycaster = new Raycaster();
var mouse = new Vector2();

var vec2 = new Vector2();

export class Pick extends Evented{
    map:mapProps;
    canvas:HTMLCanvasElement;
    camera:CameraForMap;
    scene:THREE.Scene;
    eventCount:{
        [key:string]:number
    } = {};
    constructor(context:Scene){
        super();
        
        this.map = context.map;
        this.camera = context.cameraForMap;
        this.scene = context.scene;
        this.canvas =this.map.getCanvas(); 

        this.canvas.addEventListener("click",(event)=>{
            this.intersect(event)
        });

        this.canvas.addEventListener("mousemove",(event)=>{
            this.intersect(event)
        });

        this.canvas.addEventListener("mousedown",(event)=>{
            this.intersect(event)
        });

        this.canvas.addEventListener("mouseup",(event)=>{
            this.intersect(event)
        });

    }

    on(type: string, listener: Function){
        if(typeof this.eventCount[type] === "undefined"){
            this.eventCount[type] = 0;
        }
        this.eventCount[type] += 1;
        return super.on(type,listener);
    }

    off(type: string, listener?: Function){
        if(typeof this.eventCount[type] !== "undefined"){
            this.eventCount[type] -=1;
        }
        if(this.eventCount[type] === 0){
            delete this.eventCount[type]
        }
        return super.off(type, listener)
    }

    /**
     * 事件碰撞
     * @param event 
     */
    intersect(event:MouseEvent){
        let eventType = event.type;
        
        if(!this.eventCount[eventType]) return [];

        mouse.x = ( event.offsetX / this.camera.width ) * 2 - 1;
	    mouse.y = - ( event.offsetY / this.camera.height ) * 2 + 1;
        //raycaster.setFromCamera( mouse, this.camera );
            
        raycaster.ray.origin.setFromMatrixPosition( this.camera.matrixWorld );
        
        let uprojectCoord = this.camera.unproject(new Vector3(mouse.x, mouse.y,0.9844053914789072));
        raycaster.ray.direction.copy(uprojectCoord).sub( raycaster.ray.origin ).normalize();

        var intersects = raycaster.intersectObjects(this.scene.children,true);
        
        this.fire(eventType,{
            intersects
        });
    }
}