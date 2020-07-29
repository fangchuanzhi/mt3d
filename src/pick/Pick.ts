import { Evented } from "mapbox-gl";
import { ThreeScene } from "../scenes/ThreeScene";
import { mapProps } from "../Mapbox3DScene";

export class Pick extends Evented{
    map:mapProps;
    canvas:HTMLCanvasElement;
    constructor(context:ThreeScene){
        super();
        this.map = context.map;
        this.canvas =this.map.getCanvas(); 

        this.canvas.addEventListener("click",()=>{
            
        })

    }
}