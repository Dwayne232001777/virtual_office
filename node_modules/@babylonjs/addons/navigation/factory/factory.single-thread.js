import { InjectGenerators } from "../generator/injection.js";
import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin.js";
import { GetRecast, InitRecast } from "./common.js";
/**
 * Creates a navigation plugin for the given scene.
 * @returns A promise that resolves to the created navigation plugin.
 * @param options Optional configuration. options.version: The version of Recast to use. options.instance: A custom Recast instance to inject instead of loading one.
 * @remarks This function initializes the Recast module and sets up the navigation plugin.
 */
export async function CreateNavigationPluginAsync(options) {
    await InitRecast(options);
    const navigationPlugin = new RecastNavigationJSPluginV2(GetRecast());
    InjectGenerators(navigationPlugin);
    return navigationPlugin;
}
//# sourceMappingURL=factory.single-thread.js.map