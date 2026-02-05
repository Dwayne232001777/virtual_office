import { GetPositionsAndIndices } from "../common/getters.js";
import { BuildFromNavmeshData, BuildFromTileCacheData } from "./generator.common.js";
import { CreateDefaultTileCacheMeshProcess } from "../common/tile-cache.js";
/**
 * Builds a NavMesh and NavMeshQuery from meshes using provided parameters.
 * @param meshes The array of meshes used to create the NavMesh.
 * @param parameters The parameters used to configure the NavMesh generation.
 * @param workerOptions Options for the worker, including a completion callback and the worker instance.
 * @throws Error if the NavMesh data is invalid or cannot be deserialized.
 */
export function GenerateNavMeshWithWorker(meshes, parameters, workerOptions) {
    if (meshes.length === 0) {
        throw new Error("At least one mesh is needed to create the nav mesh.");
    }
    // callback function to process the message from the worker
    workerOptions.worker.onmessage = (e) => {
        if (e.data?.success === false) {
            throw new Error(`Unable to generate navMesh: ${e}`);
        }
        else {
            const { navMesh, tileCache } = e.data;
            if (tileCache) {
                // if tileCache is present, the binary data contains the navmesh and the tilecache as well
                const tileCacheArray = new Uint8Array(tileCache);
                const navMeshData = BuildFromTileCacheData(tileCacheArray, CreateDefaultTileCacheMeshProcess());
                workerOptions.completion(navMeshData.navMesh, navMeshData.navMeshQuery, navMeshData.tileCache);
                return;
            }
            else {
                if (navMesh) {
                    // deserialize the navmesh only (no tilecache present)
                    const navMeshArray = new Uint8Array(navMesh);
                    const navMeshData = BuildFromNavmeshData(navMeshArray);
                    workerOptions.completion(navMeshData.navMesh, navMeshData.navMeshQuery, undefined);
                    return;
                }
            }
            throw new Error(`Unable to generate navMesh/tileCache: ${e}`);
        }
    };
    // send message to worker
    const [positions, indices] = GetPositionsAndIndices(meshes, { doNotReverseIndices: parameters.doNotReverseIndices });
    const positionsCopy = new Float32Array(positions);
    const indicesCopy = new Uint32Array(indices);
    workerOptions.worker.postMessage({ positions: positionsCopy, indices: indicesCopy, parameters }, [positionsCopy.buffer, indicesCopy.buffer]);
}
//# sourceMappingURL=generator.worker.js.map