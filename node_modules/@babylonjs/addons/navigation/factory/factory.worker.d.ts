import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin.js";
/**
 * Creates a navigation plugin for the given scene using a worker.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast module and sets up the navigation plugin to use a worker.
 * The worker is used to handle the creation of the navigation mesh asynchronously.
 * The `createNavMesh` method is not supported in worker mode, use `createNavMeshAsync` instead.
 */
export declare function CreateNavigationPluginWorkerAsync(): Promise<RecastNavigationJSPluginV2>;
