import * as THREE from 'three'
import { clamp } from '../utils/util';
import { Matrix4, Vector2, Vector3 } from 'three';

import { mapProps } from '../Scene';
import { Point } from 'mapbox-gl';

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
    view = {
        enabled: false,
        fullWidth: 1,
        fullHeight: 1,
        offsetX: 0,
        offsetY: 0,
        width: 1,
        height: 1
    };
    nearZ:number = 0.1;
    farZ:number = 1;
    fov:number = 60 / 180 * Math.PI;
    aspect:number = 1;
    ObjectMatrixWorld = new Matrix4();
    cameraToCenterDistance:number = 0;
    pv = new Matrix4();
    ipv = new Matrix4();
    offset:Point = new Point(0,0);
    width:number = 0;
    height:number = 0;
    constructor(){
        super();
        this.matrixAutoUpdate = false;
    }
    updateCamera(transform:mapProps["transform"]){
        let height  = this.height = transform.height;
        let width = this.width = transform.width;

        if (!height) return;
        this.aspect = width / height;
        const fov = this.fov = transform._fov;
        const pitch = transform._pitch;
        const angle = transform.angle;
        const halfFov = fov / 2;
        const offset  = this.offset = transform.centerOffset;
        const cameraToCenterDistance = this.cameraToCenterDistance = 0.5 / Math.tan(halfFov) * height ;

        let groundAngle = Math.PI / 2 + pitch;
        let fovAboveCenter = fov * (0.5 + offset.y / height);
        let topHalfSurfaceDistance = Math.sin(fovAboveCenter) * cameraToCenterDistance / Math.sin(clamp(Math.PI - groundAngle - fovAboveCenter, 0.01, Math.PI - 0.01));

        let furthestDistance = Math.cos(Math.PI / 2 - pitch) * topHalfSurfaceDistance + cameraToCenterDistance;
        this.farZ = furthestDistance * 1.01;

        this.nearZ = height / 50;

        //投影矩阵
        this.updateProjectionMatrix();
        
        // let perspectiveArray = mat4.perspective(this.temps.perspectiveArray as any,this.fov,this.aspect,this.nearZ,this.farZ);
        // perspectiveArray[8] = -offset.x * 2 / width;
        // perspectiveArray[9] = offset.y * 2 / height;

        // this.projectionMatrix.fromArray(
        //     perspectiveArray
        // );  
        // this.projectionMatrixInverse.getInverse(this.projectionMatrix);

        /**
         * 相机矩阵
         */
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
    /**
     * 投影偏移
     * @param fullWidth 
     * @param fullHeight 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    setViewOffset( fullWidth:number, fullHeight:number, x:number, y:number, width:number, height:number ) {
		this.aspect = fullWidth / fullHeight;
		this.view.enabled = true;
		this.view.fullWidth = fullWidth;
		this.view.fullHeight = fullHeight;
		this.view.offsetX = x;
		this.view.offsetY = y;
		this.view.width = width;
		this.view.height = height;
		this.updateProjectionMatrix();
    }
    /**
     * 关闭投影偏移
     */
	clearViewOffset() {
		this.view.enabled = false;
		this.updateProjectionMatrix();
    }
    /**
     * 更新投影矩阵
     */
	updateProjectionMatrix () {
		let near = this.nearZ,
			top = near * Math.tan( 0.5 * this.fov ) / 1,
			height = 2 * top,
			width = this.aspect * height,
			left = - 0.5 * width,
			view = this.view;
		if ( this.view !== null && this.view.enabled ) {

			const fullWidth = view.fullWidth,
				fullHeight = view.fullHeight;

			left += view.offsetX * width / fullWidth;
			top -= view.offsetY * height / fullHeight;
			width *= view.width / fullWidth;
			height *= view.height / fullHeight;

        }
        
		// const skew = this.filmOffset;
		// if ( skew !== 0 ) left += near * skew / this.getFilmWidth();

        this.projectionMatrix.makePerspective( left, left + width, top, top - height, near, this.farZ );

        this.projectionMatrix.elements[8] = -this.offset.x * 2 / this.width;
        this.projectionMatrix.elements[9] = this.offset.y * 2 / this.height;

		this.projectionMatrixInverse.getInverse( this.projectionMatrix );

    }
    /**
     * 像素转gl coord
     * @param vec2
     */
    project(vec2:Vector2){
        return new Vector3(vec2.x,vec2.y,0).applyMatrix4(this.pv);
    }
    /**
     * gl coord 转像素
     * @param vec2 
     */
    unproject(vec3:Vector3){
        return new Vector3().copy(vec3).applyMatrix4(this.ipv);
    }
}