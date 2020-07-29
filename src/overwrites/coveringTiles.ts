import { MercatorCoordinate } from "mapbox-gl";
import { Aabb, Frustum } from "./pimitives";
import { OverscaledTileID } from "./tile_id";
import {vec2} from 'gl-matrix'


export function coveringTiles(this: any, 
    options: {
        tileSize: number,
        minzoom?: number,
        maxzoom?: number,
        roundZoom?: boolean,
        reparseOverscaled?: boolean,
        renderWorldCopies?: boolean
    }
): Array<OverscaledTileID> {
    let z = this.coveringZoomLevel(options);
    const actualZ = z;

    if (options.minzoom !== undefined && z < options.minzoom) return [];
    if (options.maxzoom !== undefined && z > options.maxzoom) z = options.maxzoom;

    const centerCoord = MercatorCoordinate.fromLngLat(this.center);
    const numTiles = Math.pow(2, z);
    const centerPoint = [numTiles * centerCoord.x, numTiles * centerCoord.y, 0];

    const cameraFrustum = Frustum.fromInvProjectionMatrix(this.invProjMatrix_limit, this.worldSize, z);

    // No change of LOD behavior for pitch lower than 60 and when there is no top padding: return only tile ids from the requested zoom level
    let minZoom = options.minzoom || 0;
    // Use 0.1 as an epsilon to avoid for explicit == 0.0 floating point checks
    if (this.pitch <= 60.0 && this._edgeInsets.top < 0.1)
        minZoom = z;

    // There should always be a certain number of maximum zoom level tiles surrounding the center location
    const radiusOfMaxLvlLodInTiles = 3;

    const newRootTile = (wrap: number): any => {
        return {
            // All tiles are on zero elevation plane => z difference is zero
            aabb: new Aabb([wrap * numTiles, 0, 0], [(wrap + 1) * numTiles, numTiles, 0]),
            zoom: 0,
            x: 0,
            y: 0,
            wrap,
            fullyVisible: false
        };
    };

    // Do a depth-first traversal to find visible tiles and proper levels of detail
    const stack = [];
    const result = [];
    const maxZoom = z;
    const overscaledZ = options.reparseOverscaled ? actualZ : z;

    if (this._renderWorldCopies) {
        // Render copy of the globe thrice on both sides
        for (let i = 1; i <= 3; i++) {
            stack.push(newRootTile(-i));
            stack.push(newRootTile(i));
        }
    }

    stack.push(newRootTile(0));

    while (stack.length > 0) {
        const it = stack.pop();
        const x = it.x;
        const y = it.y;
        let fullyVisible = it.fullyVisible;

        // Visibility of a tile is not required if any of its ancestor if fully inside the frustum
        if (!fullyVisible) {
            const intersectResult = it.aabb.intersects(cameraFrustum);

            if (intersectResult === 0)
                continue;

            fullyVisible = intersectResult === 2;
        }

        const distanceX = it.aabb.distanceX(centerPoint);
        const distanceY = it.aabb.distanceY(centerPoint);
        const longestDim = Math.max(Math.abs(distanceX), Math.abs(distanceY));

        // We're using distance based heuristics to determine if a tile should be split into quadrants or not.
        // radiusOfMaxLvlLodInTiles defines that there's always a certain number of maxLevel tiles next to the map center.
        // Using the fact that a parent node in quadtree is twice the size of its children (per dimension)
        // we can define distance thresholds for each relative level:
        // f(k) = offset + 2 + 4 + 8 + 16 + ... + 2^k. This is the same as "offset+2^(k+1)-2"
        const distToSplit = radiusOfMaxLvlLodInTiles + (1 << (maxZoom - it.zoom)) - 2;

        // Have we reached the target depth or is the tile too far away to be any split further?
        if (it.zoom === maxZoom || (longestDim > distToSplit && it.zoom >= minZoom)) {
            result.push({
                tileID: new OverscaledTileID(it.zoom === maxZoom ? overscaledZ : it.zoom, it.wrap, it.zoom, x, y),
                distanceSq: vec2.sqrLen([centerPoint[0] - 0.5 - x, centerPoint[1] - 0.5 - y])
            });
            continue;
        }

        for (let i = 0; i < 4; i++) {
            const childX = (x << 1) + (i % 2);
            const childY = (y << 1) + (i >> 1);

            stack.push({aabb: it.aabb.quadrant(i), zoom: it.zoom + 1, x: childX, y: childY, wrap: it.wrap, fullyVisible});
        }
    }

    return result.sort((a, b) => a.distanceSq - b.distanceSq).map(a => a.tileID);
}