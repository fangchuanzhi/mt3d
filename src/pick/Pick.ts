import { Evented } from "mapbox-gl";
import { Scene, mapProps } from "../Scene";

export class Pick extends Evented{
    map:mapProps;
    canvas:HTMLCanvasElement;
    constructor(context:Scene){
        super();
        this.map = context.map;
        this.canvas =this.map.getCanvas(); 

        this.canvas.addEventListener("click",()=>{
            
        })

    }
}