import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { GetReversedIndices } from "../common/getters.js";
import { GetRecast } from "../factory/common.js";
/**
 * Creates a debug mesh for visualizing a NavMesh in the scene.
 * @param navMesh The NavMesh to visualize.
 * @param scene The scene in which to create the debug mesh.
 * @param parent Optional parent node for the debug mesh.
 * @param flags Poly flags to filter by, defaults to undefined to include all polys
 * @returns The created debug mesh.
 */
export function CreateDebugNavMesh(navMesh, scene, parent, flags) {
    const [positions, indices] = GetRecast().getNavMeshPositionsAndIndices(navMesh, flags);
    const mesh = new Mesh("NavMeshDebug", scene);
    const vertexData = new VertexData();
    vertexData.indices = GetReversedIndices(indices);
    vertexData.positions = positions;
    vertexData.applyToMesh(mesh, false);
    parent && (mesh.parent = parent);
    return mesh;
}
//# sourceMappingURL=simple-debug.js.map