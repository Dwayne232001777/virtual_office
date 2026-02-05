import { GenerateNavMesh } from "./generator.single-thread.js";
/**
 * Injects the navigation mesh generation methods into the navigation plugin.
 * @param navigationPlugin The navigation plugin to inject the methods into.
 */
export function InjectGenerators(navigationPlugin) {
    navigationPlugin.createNavMeshImpl = (meshes, parameters) => {
        return GenerateNavMesh(meshes, parameters);
    };
    navigationPlugin.createNavMeshAsyncImpl = async (meshes, parameters) => {
        return await new Promise((resolve) => {
            resolve(GenerateNavMesh(meshes, parameters));
        });
    };
}
//# sourceMappingURL=injection.js.map