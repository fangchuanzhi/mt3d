import { AmbientLight, Object3D , DirectionalLight,PointLight,SpotLight} from "three";
import { Object3DOptions } from "./object3d";
import { BaseObject } from "./BaseObject";
import { lngLatToRealMercatorCoordinate } from "../utils/util";

const lightConstructors = {
    "directional":DirectionalLight,
    "point":PointLight,
    "spot":SpotLight,
    "ambient":AmbientLight
}


export class LightEffect extends BaseObject{
    constructor(options:Object3DOptions){

        super();
        
        let appearance = options.appearance;
        let color = appearance.color;
        let type = appearance.lightType as keyof (typeof lightConstructors);
        let castShadow = appearance.castShadow;
        let target = appearance.target || [];
        
        let position = options.position;
        let x = position[0] as number,
            y = position[1] as number;

        let offset = appearance.offset || [];
        let offsetX = offset[0] || 0;
        let offsetY = offset[1] || 0;
        let offsetZ = offset[2] || 0;

        let targetObject:Object3D | undefined;
        if(target){
            let targetCoord = lngLatToRealMercatorCoordinate(target);
            targetObject = new Object3D();
            targetObject.position.set(targetCoord[0],targetCoord[1],0);
        }

        let coord = lngLatToRealMercatorCoordinate([x,y]);

        let light = new lightConstructors[type](color);
        light.position.set(coord[0] + offsetX,coord[1] + offsetY, offsetZ);
        light.matrixAutoUpdate = true;
        light.castShadow = castShadow || false;
        if(targetObject && light instanceof DirectionalLight){
            light.target = targetObject;
        }
        this.mesh = light;
        
    }
}