import {MercatorCoordinate} from 'mapbox-gl'

import { WORLD_SIZE } from '../camera/CameraForMap';

export function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

export function defined(value:any,elsevalue:any){
    return typeof value !== "undefined" && value !== null ? value:elsevalue;
}

export function lngLatToMercator(coord:number[]){
    let mercatorCoordinate_normal = MercatorCoordinate.fromLngLat(coord as [number,number]);
    let mercatorCoordinate = [
        mercatorCoordinate_normal.x * WORLD_SIZE - WORLD_SIZE / 2,
        -mercatorCoordinate_normal.y * WORLD_SIZE + WORLD_SIZE / 2
    ];
    return mercatorCoordinate;
}

// export function lonLat2WebMercator(coord:number[]){
//     let mercator:number[] = [];
//     let x = coord[0] * 20037508.34/180;
//     let y = Math.log(Math.tan((90+coord[1])*Math.PI/360))/(Math.PI/180);
//     y = y *20037508.34/180;
//     mercator[0] = x;
//     mercator[1] = y;
//     return mercator;
// }