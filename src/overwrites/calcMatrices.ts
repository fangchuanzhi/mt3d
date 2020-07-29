import {mat4} from 'gl-matrix';

import {clamp} from '../utils/util'
import { mercatorZfromAltitude } from './mercator_coordinate';

export function calcMatrices(this: any){
    if (!this.height) return;
        const halfFov = this._fov / 2;
        const offset = this.centerOffset;
        this.cameraToCenterDistance = 0.5 / Math.tan(halfFov) * this.height;

        // Find the distance from the center point [width/2 + offset.x, height/2 + offset.y] to the
        // center top point [width/2 + offset.x, 0] in Z units, using the law of sines.
        // 1 Z unit is equivalent to 1 horizontal px at the center of the map
        // (the distance between[width/2, height/2] and [width/2 + 1, height/2])
        let groundAngle = Math.PI / 2 + this._pitch;
        let fovAboveCenter = this._fov * (0.5 + offset.y / this.height);
        let topHalfSurfaceDistance = Math.sin(fovAboveCenter) * this.cameraToCenterDistance / Math.sin(clamp(Math.PI - groundAngle - fovAboveCenter, 0.01, Math.PI - 0.01));
        const point = this.point;
        const x = point.x, y = point.y;

        // Calculate z distance of the farthest fragment that should be rendered.
        let furthestDistance = Math.cos(Math.PI / 2 - this._pitch) * topHalfSurfaceDistance + this.cameraToCenterDistance;
        // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
        let farZ = furthestDistance * 1.01;

        // The larger the value of nearZ is
        // - the more depth precision is available for features (good)
        // - clipping starts appearing sooner when the camera is close to 3d features (bad)
        //
        // Smaller values worked well for mapbox-gl-js but deckgl was encountering precision issues
        // when rendering it's layers using custom layers. This value was experimentally chosen and
        // seems to solve z-fighting issues in deckgl while not clipping buildings too close to the camera.
        const nearZ = this.height / 50;

        // matrix for conversion from location to GL coordinates (-1 .. 1)
        let m = new Float64Array(16) as any;
        mat4.perspective(m, this._fov, this.width / this.height, nearZ, farZ);

        //Apply center of perspective offset
        m[8] = -offset.x * 2 / this.width;
        m[9] = offset.y * 2 / this.height;

        //console.log(this._pitch);

        mat4.scale(m, m, [1, -1, 1]);
        mat4.translate(m, m, [0, 0, -this.cameraToCenterDistance]);
        mat4.rotateX(m, m, this._pitch);
        mat4.rotateZ(m, m, this.angle);
        mat4.translate(m, m, [-x, -y, 0]);

        // The mercatorMatrix can be used to transform points from mercator coordinates
        // ([0, 0] nw, [1, 1] se) to GL coordinates.
        this.mercatorMatrix = mat4.scale([] as any, m, [this.worldSize, this.worldSize, this.worldSize]);

        // scale vertically to meters per pixel (inverse of ground resolution):
        mat4.scale(m, m, [1, 1, mercatorZfromAltitude(1, this.center.lat) * this.worldSize, 1] as any);

        this.projMatrix = m;

        this.invProjMatrix = mat4.invert([] as any, this.projMatrix);

        //处理pitch大于60度的情况瓦片加载数据量过大的问题
        let p = clamp(this._pitch,0,65 / 180 * Math.PI);
        groundAngle = Math.PI / 2 + p;
        topHalfSurfaceDistance = Math.sin(fovAboveCenter) * this.cameraToCenterDistance / Math.sin(clamp(Math.PI - groundAngle - fovAboveCenter, 0.01, Math.PI - 0.01));
        furthestDistance = Math.cos(Math.PI / 2 - p ) * topHalfSurfaceDistance + this.cameraToCenterDistance;
        // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
        farZ = furthestDistance * 1.01;

        m = new Float64Array(16);
        mat4.perspective(m, this._fov, this.width / this.height, nearZ, farZ);
        //Apply center of perspective offset
        m[8] = -offset.x * 2 / this.width;
        m[9] = offset.y * 2 / this.height;
        mat4.scale(m, m, [1, -1, 1]);
        mat4.translate(m, m, [0, 0, -this.cameraToCenterDistance]);
        mat4.rotateX(m, m, this._pitch );
        mat4.rotateZ(m, m, this.angle);
        mat4.translate(m, m, [-x, -y, 0]);
        mat4.scale(m, m, [1, 1, mercatorZfromAltitude(1, this.center.lat) * this.worldSize, 1] as any);
        this.invProjMatrix_limit = mat4.invert([] as any, m);

        // Make a second projection matrix that is aligned to a pixel grid for rendering raster tiles.
        // We're rounding the (floating point) x/y values to achieve to avoid rendering raster images to fractional
        // coordinates. Additionally, we adjust by half a pixel in either direction in case that viewport dimension
        // is an odd integer to preserve rendering to the pixel grid. We're rotating this shift based on the angle
        // of the transformation so that 0°, 90°, 180°, and 270° rasters are crisp, and adjust the shift so that
        // it is always <= 0.5 pixels.
        const xShift = (this.width % 2) / 2, yShift = (this.height % 2) / 2,
            angleCos = Math.cos(this.angle), angleSin = Math.sin(this.angle),
            dx = x - Math.round(x) + angleCos * xShift + angleSin * yShift,
            dy = y - Math.round(y) + angleCos * yShift + angleSin * xShift;
        const alignedM = new Float64Array(m) as any;
        mat4.translate(alignedM, alignedM, [ dx > 0.5 ? dx - 1 : dx, dy > 0.5 ? dy - 1 : dy, 0 ]);
        this.alignedProjMatrix = alignedM;

        m = mat4.create();
        mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
        mat4.translate(m, m, [1, -1, 0]);
        this.labelPlaneMatrix = m;

        m = mat4.create();
        mat4.scale(m, m, [1, -1, 1]);
        mat4.translate(m, m, [-1, -1, 0]);
        mat4.scale(m, m, [2 / this.width, 2 / this.height, 1]);
        this.glCoordMatrix = m;

        // matrix for conversion from location to screen coordinates
        this.pixelMatrix = mat4.multiply([] as any, this.labelPlaneMatrix, this.projMatrix);

        // inverse matrix for conversion from screen coordinaes to location
        m = new Float64Array(mat4.invert([] as any, this.pixelMatrix));
        if (!m) throw new Error("failed to invert matrix");
        this.pixelMatrixInverse = m;

        this._posMatrixCache = {};
        this._alignedPosMatrixCache = {};
}