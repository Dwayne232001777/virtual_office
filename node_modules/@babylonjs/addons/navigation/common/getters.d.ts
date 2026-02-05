import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
/**
 *  Extracts positions and indices from an array of meshes.
 *  @param meshes The array of meshes from which to extract positions and indices.
 *  @returns A tuple containing a Float32Array of positions and a Uint32Array of
 */
export declare function GetPositionsAndIndices(meshes: Mesh[], options?: {
    doNotReverseIndices?: boolean;
}): [positions: Float32Array, indices: Uint32Array];
/**
 * Reverses the order of vertices in each triangle (3 indices per face) to ensure
 * that the winding order is consistent with the Recast Navigation requirements.
 * This is necessary because Recast Navigation expects the indices to be in a specific winding order.
 * @param meshOrIndices The mesh from which to extract indices or the indices themselves.
 * @returns Array of indices with reversed winding order.
 */
export declare function GetReversedIndices(meshOrIndices: Mesh | Uint32Array | number[]): Uint32Array<ArrayBufferLike> | number[] | Int32Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | null;
