import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
var CharCode;
(function (CharCode) {
    CharCode[CharCode["SPACE"] = 32] = "SPACE";
    CharCode[CharCode["TOFU"] = 65532] = "TOFU";
})(CharCode || (CharCode = {}));
/**
 * Class representing a font asset for SDF (Signed Distance Field) rendering.
 */
export class FontAsset {
    /**
     * Creates a new FontAsset instance.
     * @param definitionData defines the font data in JSON format.
     * @param textureUrl defines the url of the texture to use for the font.
     * @param scene defines the hosting scene.
     */
    constructor(definitionData, textureUrl, scene) {
        this._chars = new Map();
        this._kernings = new Map();
        this._font = JSON.parse(definitionData);
        // So far we only consider one page
        this._font.pages = [textureUrl];
        this._font.chars.forEach((char) => this._chars.set(char.id, char));
        this._font.kernings.forEach((kerning) => {
            let submap = this._kernings.get(kerning.first);
            if (!submap) {
                submap = new Map();
                this._kernings.set(kerning.first, submap);
            }
            submap.set(kerning.second, kerning.amount);
        });
        this._charsRegex = new RegExp(`[${this._font.chars.map((c) => c.char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")).join("")}]`, "g");
        this._updateFallbacks();
        this.scale = 1 / this._font.info.size;
        this.textures = this._font.pages.map((page) => {
            const texture = new Texture(page, scene, { noMipmap: false, invertY: false });
            texture.anisotropicFilteringLevel = 16;
            return texture;
        });
    }
    dispose() {
        for (const texture of this.textures) {
            texture.dispose();
        }
        this.textures.length = 0;
    }
    _updateFallbacks() {
        if (!this._chars.has(CharCode.SPACE)) {
            this._chars.set(CharCode.SPACE, {
                id: CharCode.SPACE,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                xoffset: 0,
                yoffset: 0,
                xadvance: this._font.info.size * 0.5,
                page: -1,
                chnl: -1,
                index: -1,
                char: " ",
            });
        }
        if (!this._chars.has(CharCode.TOFU)) {
            this._chars.set(CharCode.TOFU, {
                id: CharCode.TOFU,
                x: 0,
                y: 0,
                width: this._font.info.size,
                height: this._font.info.size,
                xoffset: 0,
                yoffset: 0,
                xadvance: this._font.info.size * 0.5,
                page: -1,
                chnl: -1,
                index: -1,
                char: "￿",
            });
        }
    }
    /** @internal */
    _getChar(charCode) {
        return this._chars.get(charCode) || this._chars.get(CharCode.TOFU);
    }
    /** @internal */
    _getKerning(first, second) {
        return this._kernings.get(first)?.get(second) || 0;
    }
    /** @internal */
    _unsupportedChars(text) {
        return text.replace(this._charsRegex, "");
    }
}
//# sourceMappingURL=fontAsset.js.map