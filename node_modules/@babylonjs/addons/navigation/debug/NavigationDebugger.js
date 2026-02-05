import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Matrix } from "@babylonjs/core/Maths/math.vector.js";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import { GetRecast } from "../factory/common.js";
// TODO: Enum?
export const DebugLayerOption = {
    HEIGHTFIELD_SOLID: "heightfield solid",
    HEIGHTFIELD_WALKABLE: "heightfield walkable",
    COMPACT_HEIGHTFIELD_SOLID: "compact heightfield solid",
    COMPACT_HEIGHTFIELD_REGIONS: "compact heightfield regions",
    COMPACT_HEIGHTFIELD_DISTANCE: "compact heightfield distance",
    RAW_CONTOURS: "raw contours",
    CONTOURS: "contours",
    POLY_MESH: "poly mesh",
    POLY_MESH_DETAIL: "poly mesh detail",
    NAVMESH: "navmesh",
    NAVMESH_BV_TREE: "navmesh bv tree",
};
/**
 * NavigationDebugger is a utility class for visualizing navigation meshes and related data in a Babylon.js scene.
 * It provides methods to draw various navigation-related primitives such as points, lines, triangles, and quads.
 * It also supports drawing heightfields, compact heightfields, contours, poly meshes, and nav meshes.
 */
export class NavigationDebugger {
    /**
     * * Gets or sets the primitive types to be drawn by the debug drawer.
     * * This allows you to control which types of primitives (points, lines, tris, quads) are rendered in the navigation debug visualization.
     * * The default value is `["points", "lines", "tris", "quads"]`.
     * * You can modify this property to include or exclude specific primitive types based on your debugging needs.
     * @returns An array of primitive types that the debug drawer will render.
     */
    get primitiveTypes() {
        return this._primitiveTypes;
    }
    set primitiveTypes(value) {
        this._primitiveTypes = value;
    }
    constructor(_scene, options) {
        this._scene = _scene;
        /**
         * The list of line materials used in the navigation debug visualization.
         */
        this.lineMaterials = [];
        /**
         *  Get the intermediates from the generator
         *  @param intermediates - The generator intermediates
         *  @returns An object containing lists of heightfields, compact heightfields, contour sets
         */
        this.getIntermediates = (intermediates) => {
            const heightfieldList = [];
            const compactHeightfieldList = [];
            const contourSetList = [];
            const polyMeshList = [];
            const polyMeshDetailList = [];
            if (intermediates) {
                if (intermediates.type === "solo") {
                    if (intermediates.heightfield) {
                        heightfieldList.push(intermediates.heightfield);
                    }
                    if (intermediates.compactHeightfield) {
                        compactHeightfieldList.push(intermediates.compactHeightfield);
                    }
                    if (intermediates.contourSet) {
                        contourSetList.push(intermediates.contourSet);
                    }
                    if (intermediates.polyMesh) {
                        polyMeshList.push(intermediates.polyMesh);
                    }
                    if (intermediates.polyMeshDetail) {
                        polyMeshDetailList.push(intermediates.polyMeshDetail);
                    }
                }
                else if (intermediates.type === "tiled") {
                    for (const tile of intermediates.tileIntermediates) {
                        if (tile.heightfield) {
                            heightfieldList.push(tile.heightfield);
                        }
                        if (tile.compactHeightfield) {
                            compactHeightfieldList.push(tile.compactHeightfield);
                        }
                        if (tile.contourSet) {
                            contourSetList.push(tile.contourSet);
                        }
                        if (tile.polyMesh) {
                            polyMeshList.push(tile.polyMesh);
                        }
                        if (tile.polyMeshDetail) {
                            polyMeshDetailList.push(tile.polyMeshDetail);
                        }
                    }
                }
                else if (intermediates.type === "tilecache") {
                    for (const tile of intermediates.tileIntermediates) {
                        if (tile.heightfield) {
                            heightfieldList.push(tile.heightfield);
                        }
                        if (tile.compactHeightfield) {
                            compactHeightfieldList.push(tile.compactHeightfield);
                        }
                    }
                }
            }
            return {
                heightfieldList,
                compactHeightfieldList,
                contourSetList,
                polyMeshList,
                polyMeshDetailList,
            };
        };
        this._debugDrawerUtils = new (GetRecast().DebugDrawerUtils)();
        this._primitiveTypes = options?.primitiveTypes ?? ["points", "lines", "tris", "quads"];
        this.debugDrawerParentNode =
            options?.parent?.node instanceof TransformNode ? options.parent.node : new TransformNode(options?.parent?.node ?? "nav-mesh-debug-parent", this._scene);
        const materials = options?.materials;
        if (materials?.triMaterial) {
            this.triMaterial = materials.triMaterial;
        }
        else {
            this.triMaterial = new StandardMaterial("nav-debug-tris-material");
            this.triMaterial.backFaceCulling = false;
            this.triMaterial.specularColor = Color3.Black();
            this.triMaterial.alpha = 0.5;
        }
        if (materials?.pointMaterial) {
            this.pointMaterial = materials.pointMaterial;
        }
        else {
            this.pointMaterial = new StandardMaterial("nav-debug-points-material");
            this.pointMaterial.backFaceCulling = false;
            this.pointMaterial.specularColor = Color3.Black();
        }
        if (materials?.lineMaterialOptions) {
            this._lineMaterialOptions = materials.lineMaterialOptions;
        }
        else {
            this._lineMaterialOptions = {
                greasedLineMaterialOptions: {
                    width: 2,
                    sizeAttenuation: true,
                },
                greasedLineMeshOptions: {},
            };
        }
        this._pointMesh = CreateBox(NavigationDebugger.NAV_MESH_DEBUG_NAME_POINTS, { size: 0.02 });
    }
    /**
     * Resets the debug drawer by disposing of all child meshes in the debug drawer parent node.
     * This is useful for clearing the debug visualization before drawing new primitives.
     */
    clear() {
        for (const child of this.debugDrawerParentNode.getChildMeshes()) {
            child.dispose();
        }
    }
    /**
     * Disposes of the debug drawer, including all meshes and materials used for rendering.
     * This method should be called when the debug drawer is no longer needed to free up resources.
     */
    dispose() {
        this.clear();
        this._debugDrawerUtils.dispose();
        this._pointMesh.dispose();
        this.triMaterial.dispose();
        this.pointMaterial.dispose();
    }
    /**
     * This method iterates through the provided primitives and draws them based on their type.
     * It supports drawing points, lines, triangles, and quads, depending on the primitive type.
     * @param primitives An array of debug drawer primitives to be drawn.
     * @param options Optional parameters to control the drawing behavior, such as whether to join meshes.
     */
    drawPrimitives(primitives, options) {
        let linesInstance = null;
        for (const primitive of primitives) {
            // draw only the primitives that are in the primitiveTypes array
            if (!this._primitiveTypes.includes(primitive.type)) {
                continue;
            }
            switch (primitive.type) {
                case "points":
                    this._drawPoints(primitive);
                    break;
                case "lines": {
                    const line = this._drawLines(primitive, linesInstance);
                    if (!linesInstance) {
                        linesInstance = line;
                    }
                    break;
                }
                case "tris":
                    this._drawTris(primitive);
                    break;
                case "quads":
                    this._drawQuads(primitive);
                    break;
            }
        }
        linesInstance?.updateLazy();
        if (options?.joinMeshes ?? true) {
            // Join the debug meshes into a single mesh for better performance
            this._joinDebugMeshes();
        }
    }
    /**
     * Draws a heightfield as solid using the debug drawer utilities.
     * @param hf The heightfield to draw as solid.
     */
    drawHeightfieldSolid(hf) {
        const primitives = this._debugDrawerUtils.drawHeightfieldSolid(hf);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws a heightfield as walkable using the debug drawer utilities.
     * @param hf The heightfield to draw as walkable.
     */
    drawHeightfieldWalkable(hf) {
        const primitives = this._debugDrawerUtils.drawHeightfieldWalkable(hf);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws a compact heightfield as solid using the debug drawer utilities.
     * @param chf The compact heightfield to draw as solid.
     */
    drawCompactHeightfieldSolid(chf) {
        const primitives = this._debugDrawerUtils.drawCompactHeightfieldSolid(chf);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the regions of a compact heightfield using the debug drawer utilities.
     * @param chf The compact heightfield to draw regions for.
     */
    drawCompactHeightfieldRegions(chf) {
        const primitives = this._debugDrawerUtils.drawCompactHeightfieldRegions(chf);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the distance field of a compact heightfield using the debug drawer utilities.
     * @param chf The compact heightfield to draw the distance for.
     */
    drawCompactHeightfieldDistance(chf) {
        const primitives = this._debugDrawerUtils.drawCompactHeightfieldDistance(chf);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws a heightfield layer using the debug drawer utilities.
     * @param layer The heightfield layer to draw.
     * @param idx The index of the layer to draw.
     */
    drawHeightfieldLayer(layer, idx) {
        const primitives = this._debugDrawerUtils.drawHeightfieldLayer(layer, idx);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the layers of a heightfield using the debug drawer utilities.
     * @param lset The heightfield layer set containing the layers to draw.
     */
    drawHeightfieldLayers(lset) {
        const primitives = this._debugDrawerUtils.drawHeightfieldLayers(lset);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the region connections of a RecastContourSet using the debug drawer utilities.
     * @param cset RecastContourSet to draw
     * @param alpha The alpha value for the drawn contours, default is 1.
     */
    drawRegionConnections(cset, alpha = 1) {
        const primitives = this._debugDrawerUtils.drawRegionConnections(cset, alpha);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws raw contours from a RecastContourSet using the debug drawer utilities.
     * @param cset RecastContourSet to draw
     * @param alpha The alpha value for the drawn contours, default is 1.
     */
    drawRawContours(cset, alpha = 1) {
        const primitives = this._debugDrawerUtils.drawRawContours(cset, alpha);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws contours from a RecastContourSet using the debug drawer utilities.
     * @param cset RecastContourSet to draw
     * @param alpha The alpha value for the drawn contours, default is 1.
     */
    drawContours(cset, alpha = 1) {
        const primitives = this._debugDrawerUtils.drawContours(cset, alpha);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws a poly mesh using the debug drawer utilities.
     * @param mesh RecastPolyMesh to draw
     */
    drawPolyMesh(mesh) {
        const primitives = this._debugDrawerUtils.drawPolyMesh(mesh);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws a poly mesh detail using the debug drawer utilities.
     * @param dmesh RecastPolyMeshDetail to draw
     */
    drawPolyMeshDetail(dmesh) {
        const primitives = this._debugDrawerUtils.drawPolyMeshDetail(dmesh);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws a NavMesh using the debug drawer utilities.
     * @param mesh NavMesh to draw
     * @param flags Flags to control the drawing behavior, default is 0.
     */
    drawNavMesh(mesh, flags = 0) {
        const primitives = this._debugDrawerUtils.drawNavMesh(mesh, flags);
        this.drawPrimitives(primitives);
    }
    // todo:
    // - drawTileCacheLayerAreas
    // - drawTileCacheLayerRegions
    // - drawTileCacheContours
    // - drawTileCachePolyMesh
    /**
     * Draws a NavMesh with closed list using the debug drawer utilities.
     * @param mesh NavMesh to draw
     * @param query NavMeshQuery to use for drawing the closed list.
     * @param flags Flags to control the drawing behavior, default is 0.
     */
    drawNavMeshWithClosedList(mesh, query, flags = 0) {
        const primitives = this._debugDrawerUtils.drawNavMeshWithClosedList(mesh, query, flags);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the nodes of a NavMesh using the debug drawer utilities.
     * @param query NavMeshQuery to use for drawing the nodes.
     */
    drawNavMeshNodes(query) {
        const primitives = this._debugDrawerUtils.drawNavMeshNodes(query);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the bounding volume tree of a NavMesh using the debug drawer utilities.
     * @param mesh NavMesh to draw the bounding volume tree for.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    drawNavMeshBVTree(mesh) {
        const primitives = this._debugDrawerUtils.drawNavMeshBVTree(mesh);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws the portals of a NavMesh using the debug drawer utilities.
     * @param mesh NavMesh to draw the portals for.
     */
    drawNavMeshPortals(mesh) {
        const primitives = this._debugDrawerUtils.drawNavMeshPortals(mesh);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws polygons of a NavMesh with specific flags using the debug drawer utilities.
     * @param mesh NavMesh to draw the polygons with specific flags.
     * @param flags The flags to filter the polygons to be drawn.
     * @param col The color to use for the drawn polygons, represented as a number.
     */
    drawNavMeshPolysWithFlags(mesh, flags, col) {
        const primitives = this._debugDrawerUtils.drawNavMeshPolysWithFlags(mesh, flags, col);
        this.drawPrimitives(primitives);
    }
    /**
     * Draws polygons of a NavMesh with specific reference and color using the debug drawer utilities.
     * @param mesh NavMesh to draw the polygons with specific reference and color.
     * @param ref The reference number of the polygons to be drawn.
     * @param col The color to use for the drawn polygons, represented as a number.
     */
    drawNavMeshPoly(mesh, ref, col) {
        const primitives = this._debugDrawerUtils.drawNavMeshPoly(mesh, ref, col);
        this.drawPrimitives(primitives);
    }
    /**
     *  Draw debug information based on the selected option
     *  @param navMesh - The navigation mesh to draw
     *  @param intermediates - The generator intermediates containing the data to draw
     *  @param scene - The scene to draw in
     *  @param option - The debug drawer option to use
     *  @remarks This method will reset the debug drawer before drawing.
     */
    draw(navMesh, intermediates, scene, option) {
        this.clear();
        const { heightfieldList, compactHeightfieldList, contourSetList, polyMeshList, polyMeshDetailList } = this.getIntermediates(intermediates);
        if (option === DebugLayerOption.HEIGHTFIELD_SOLID) {
            for (const heightfield of heightfieldList) {
                this.drawHeightfieldSolid(heightfield);
            }
        }
        else if (option === DebugLayerOption.HEIGHTFIELD_WALKABLE) {
            for (const heightfield of heightfieldList) {
                this.drawHeightfieldWalkable(heightfield);
            }
        }
        else if (option === DebugLayerOption.COMPACT_HEIGHTFIELD_SOLID) {
            for (const compactHeightfield of compactHeightfieldList) {
                this.drawCompactHeightfieldSolid(compactHeightfield);
            }
        }
        else if (option === DebugLayerOption.COMPACT_HEIGHTFIELD_REGIONS) {
            for (const compactHeightfield of compactHeightfieldList) {
                this.drawCompactHeightfieldRegions(compactHeightfield);
            }
        }
        else if (option === DebugLayerOption.COMPACT_HEIGHTFIELD_DISTANCE) {
            for (const compactHeightfield of compactHeightfieldList) {
                this.drawCompactHeightfieldDistance(compactHeightfield);
            }
        }
        else if (option === DebugLayerOption.RAW_CONTOURS) {
            for (const contourSet of contourSetList) {
                this.drawRawContours(contourSet);
            }
        }
        else if (option === DebugLayerOption.CONTOURS) {
            for (const contourSet of contourSetList) {
                this.drawContours(contourSet);
            }
        }
        else if (option === DebugLayerOption.POLY_MESH) {
            for (const polyMesh of polyMeshList) {
                this.drawPolyMesh(polyMesh);
            }
        }
        else if (option === DebugLayerOption.POLY_MESH_DETAIL) {
            for (const polyMeshDetail of polyMeshDetailList) {
                this.drawPolyMeshDetail(polyMeshDetail);
            }
        }
        else if (option === DebugLayerOption.NAVMESH) {
            this.drawNavMesh(navMesh);
        }
        else if (option === DebugLayerOption.NAVMESH_BV_TREE) {
            this.drawNavMeshBVTree(navMesh);
        }
    }
    _drawPoints(primitive) {
        if (primitive.vertices.length === 0) {
            return;
        }
        const matricesData = new Float32Array(16 * primitive.vertices.length);
        const colorData = new Float32Array(4 * primitive.vertices.length);
        for (let i = 0; i < primitive.vertices.length; i++) {
            const [x, y, z, r, g, b, a] = primitive.vertices[i];
            colorData[i * 4] = r;
            colorData[i * 4 + 1] = g;
            colorData[i * 4 + 2] = b;
            colorData[i * 4 + 3] = a;
            const matrix = Matrix.Translation(x, y, z);
            matrix.copyToArray(matricesData, i * 16);
        }
        this._pointMesh.thinInstanceSetBuffer("matrix", matricesData, 16);
        this._pointMesh.thinInstanceSetBuffer("color", colorData, 4);
        this._pointMesh.parent = this.debugDrawerParentNode;
    }
    _drawLines(primitive, instance) {
        if (primitive.vertices.length === 0) {
            return null;
        }
        const points = [];
        const colors = [];
        for (let i = 0; i < primitive.vertices.length; i += 2) {
            const [x1, y1, z1, r1, g1, b1] = primitive.vertices[i];
            const [x2, y2, z2, r2, g2, b2] = primitive.vertices[i + 1];
            points.push([x1, y1, z1, x2, y2, z2]);
            colors.push(new Color3(r1, g1, b1));
            colors.push(new Color3(r2, g2, b2));
        }
        const options = { ...this._lineMaterialOptions.greasedLineMeshOptions, points, instance: instance ?? undefined };
        const materialOptions = { ...this._lineMaterialOptions.greasedLineMaterialOptions, colors };
        const lines = CreateGreasedLine(NavigationDebugger.NAV_MESH_DEBUG_NAME_LINES, options, materialOptions);
        lines.parent = this.debugDrawerParentNode;
        this.lineMaterials.push(lines.material);
        return lines;
    }
    _drawTris(primitive) {
        if (primitive.vertices.length === 0) {
            return;
        }
        const positions = new Float32Array(primitive.vertices.length * 3);
        const colors = new Float32Array(primitive.vertices.length * 4);
        for (let i = 0; i < primitive.vertices.length; i++) {
            const [x, y, z, r, g, b] = primitive.vertices[i];
            positions[i * 3 + 0] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            colors[i * 4 + 0] = r;
            colors[i * 4 + 1] = g;
            colors[i * 4 + 2] = b;
            colors[i * 4 + 3] = 1;
        }
        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.colors = colors;
        const customMesh = new Mesh(NavigationDebugger.NAV_MESH_DEBUG_NAME_TRIS);
        customMesh.isUnIndexed = true;
        vertexData.applyToMesh(customMesh);
        customMesh.material = this.triMaterial;
        customMesh.parent = this.debugDrawerParentNode;
    }
    _drawQuads(primitive) {
        if (primitive.vertices.length === 0) {
            return;
        }
        const positions = [];
        const colors = [];
        for (let i = 0; i < primitive.vertices.length; i += 4) {
            const vertices = [
                primitive.vertices[i],
                primitive.vertices[i + 1],
                primitive.vertices[i + 2],
                primitive.vertices[i],
                primitive.vertices[i + 2],
                primitive.vertices[i + 3],
            ];
            for (const [x, y, z, r, g, b] of vertices) {
                positions.push(x, y, z);
                colors.push(r, g, b, 1);
            }
        }
        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.colors = colors;
        const customMesh = new Mesh(NavigationDebugger.NAV_MESH_DEBUG_NAME_QUADS);
        customMesh.isUnIndexed = true;
        vertexData.applyToMesh(customMesh);
        customMesh.material = this.triMaterial;
        customMesh.parent = this.debugDrawerParentNode;
    }
    /**
     * Merge the debug meshes for better performance
     */
    _joinDebugMeshes() {
        const debugMeshes = this._scene.meshes.filter((m) => m.name === NavigationDebugger.NAV_MESH_DEBUG_NAME);
        // only indexed meshes can be merged
        debugMeshes.forEach((m) => {
            this._convertUnindexedToIndexed(m);
        });
        const merged = Mesh.MergeMeshes(debugMeshes, true);
        if (merged) {
            merged.name = NavigationDebugger.NAV_MESH_DEBUG_NAME;
            merged.parent = this.debugDrawerParentNode;
        }
    }
    _convertUnindexedToIndexed(mesh) {
        const vertexData = VertexData.ExtractFromMesh(mesh);
        const positions = vertexData.positions;
        if (!positions || positions.length % 9 !== 0) {
            Logger.Warn("Mesh must be fully unindexed with triangles.");
            return;
        }
        const vertexCount = positions.length / 3;
        const indices = Array.from({ length: vertexCount }, (_, i) => i);
        const newVertexData = new VertexData();
        newVertexData.positions = positions;
        newVertexData.indices = indices;
        newVertexData.applyToMesh(mesh, true);
    }
}
/**
 *  The name of the debug mesh used for navigation debugging.
 *  This is used to group all navigation debug meshes under a single name for easier management
 */
NavigationDebugger.NAV_MESH_DEBUG_NAME = "nav-mesh-debug";
/**
 * The name of the debug mesh used for visualization of the navigation mesh using points.
 */
NavigationDebugger.NAV_MESH_DEBUG_NAME_POINTS = "nav-mesh-debug-points";
/**
 * The name of the debug mesh used for visualization of the navigation mesh using triangles.
 */
NavigationDebugger.NAV_MESH_DEBUG_NAME_TRIS = "nav-mesh-debug-tris";
/**
 * The name of the debug mesh used for visualization of the navigation mesh using quads.
 */
NavigationDebugger.NAV_MESH_DEBUG_NAME_QUADS = "nav-mesh-debug-quads";
/**
 * The name of the debug mesh used for visualization of the navigation mesh using lines.
 */
NavigationDebugger.NAV_MESH_DEBUG_NAME_LINES = "nav-mesh-debug-lines";
//# sourceMappingURL=NavigationDebugger.js.map