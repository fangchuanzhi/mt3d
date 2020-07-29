import * as THREE from 'three'
import { mapProps } from '../Mapbox3DScene';
import { clamp } from '../utils/util';
import { Matrix4, Vector2, Vector3 } from 'three';

import {mat4} from 'gl-matrix'

/**
 * 地球周长
 */
export const WORLD_SIZE = 6378137.0 * Math.PI * 2;

/**
 * 构建地图场景相机和几何体世界坐标变换
 */
export class CameraForMap extends THREE.Camera{
    temps = {
        cameraWorldMatrixTemp: new Matrix4(),
        cameraTranslateZTemp:new Matrix4(),
        rotatePitchTemp: new Matrix4(),
        rotateBearingTemp: new Matrix4(),
        translateToMapCenterTemp: new Matrix4(),
        translateToPointTemp :new Matrix4(),
        mapScaleTemp:new Matrix4(),
        rotateMapTemp:new Matrix4(),
        perspectiveArray:[],
        reversalScale:new Matrix4()
    };
    nearZ:number = 0.1;
    farZ:number = 1;
    fov:number = 60 / 180 * Math.PI;
    aspect:number = 1;
    ObjectMatrixWorld = new Matrix4();
    cameraToCenterDistance:number = 0;
    pv = new Matrix4();
    ipv = new Matrix4();
    constructor(){
        super();
        this.matrixAutoUpdate = false;
    }
    updateCamera(transform:mapProps["transform"]){
        let height = transform.height;
        let width = transform.width;

        if (!height) return;
        this.aspect = width / height;
        const fov = this.fov = transform._fov;
        const pitch = transform._pitch;
        const angle = transform.angle;
        const halfFov = fov / 2;
        const offset = transform.centerOffset;
        const cameraToCenterDistance = this.cameraToCenterDistance = 0.5 / Math.tan(halfFov) * height ;

        let groundAngle = Math.PI / 2 + pitch;
        let fovAboveCenter = fov * (0.5 + offset.y / height);
        let topHalfSurfaceDistance = Math.sin(fovAboveCenter) * cameraToCenterDistance / Math.sin(clamp(Math.PI - groundAngle - fovAboveCenter, 0.01, Math.PI - 0.01));

        let furthestDistance = Math.cos(Math.PI / 2 - pitch) * topHalfSurfaceDistance + cameraToCenterDistance;
        this.farZ = furthestDistance * 1.01;

        this.nearZ = height / 50;

        //投影矩阵
        let perspectiveArray = mat4.perspective(this.temps.perspectiveArray as any,this.fov,this.aspect,this.nearZ,this.farZ);

        perspectiveArray[8] = -offset.x * 2 / width;
        perspectiveArray[9] = offset.y * 2 / height;

        this.projectionMatrix.fromArray(
            perspectiveArray
        );  

        this.projectionMatrixInverse.getInverse(this.projectionMatrix);

        let cameraWorldMatrix = this.temps.cameraWorldMatrixTemp.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);

        let cameraTranslateZ = this.temps.cameraTranslateZTemp.makeTranslation(0,0,cameraToCenterDistance);
        let rotatePitch = this.temps.rotatePitchTemp.makeRotationX(pitch);
        let rotateBearing = this.temps.rotateBearingTemp.makeRotationZ(angle);
            
        /**
         * 视图矩阵
         */
        cameraWorldMatrix
            .premultiply(cameraTranslateZ)
            .premultiply(rotatePitch)
            .premultiply(rotateBearing);  

        this.matrixWorld.copy(cameraWorldMatrix);
        this.matrixWorldInverse.getInverse(this.matrixWorld);

        this.pv.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1)
            .premultiply(this.matrixWorldInverse)
            .premultiply(this.projectionMatrix);

        this.ipv.getInverse(this.pv);
        
        /**
         * 物体旋转变换矩阵
         */
        const scale = transform.scale;
        const zoom = scale * 512 / WORLD_SIZE;
        const point = transform.point;
        const translateToMapCenter = this.temps.translateToMapCenterTemp.makeTranslation(WORLD_SIZE / 2, -WORLD_SIZE / 2 ,0);
        const translateToPoint = this.temps.translateToPointTemp.makeTranslation(-point.x, -point.y, 0);
        const mapScale = this.temps.mapScaleTemp.makeScale(zoom,-zoom,zoom);
        const reversalScale = this.temps.reversalScale.makeScale(1,-1,1);

        this.ObjectMatrixWorld.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1) 
        .premultiply(translateToMapCenter)
        .premultiply(mapScale)
        .premultiply(translateToPoint)
        .premultiply(reversalScale);

    }

    project(vec2:Vector2){
        return new Vector3(vec2.x,vec2.y,0).applyMatrix4(this.pv);
    }
    unproject(vec2:Vector2){
        return new Vector3(vec2.x,vec2.y,0).applyMatrix4(this.ipv);
    }
}