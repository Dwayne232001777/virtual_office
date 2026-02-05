// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
const name = "atmosphereVertexDeclaration";
const shader = `uniform mat4 inverseViewProjectionWithoutTranslation;
`;
// Sideeffect
if (!ShaderStore.IncludesShadersStore[name]) {
    ShaderStore.IncludesShadersStore[name] = shader;
}
/** @internal */
export const atmosphereVertexDeclaration = { name, shader };
//# sourceMappingURL=atmosphereVertexDeclaration.js.map