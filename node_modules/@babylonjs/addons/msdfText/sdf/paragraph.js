import { DefaultParagraphOptions } from "../paragraphOptions.js";
/** @internal */
export class SdfTextParagraph {
    get lineHeight() {
        return this.fontAsset._font.common.lineHeight * this.options.lineHeight;
    }
    constructor(text, fontAsset, options) {
        this.text = text;
        this.fontAsset = fontAsset;
        this.options = { ...DefaultParagraphOptions, ...options };
        const { paragraph, lines, glyphs, width, height } = this.options.customLayoutEngine ? this.options.customLayoutEngine(text, this.options) : this._computeMetrics(text);
        this.paragraph = paragraph;
        this.lines = lines;
        this.glyphs = glyphs;
        this.width = width;
        this.height = height;
    }
    _computeMetrics(text) {
        const collapsed = this._collapse(text);
        const breaked = this._breakLines(collapsed);
        const trimmed = breaked.map((line) => line.trim());
        const lines = [];
        for (const line of trimmed) {
            lines.push(...this._wrap(line, lines.length));
        }
        const width = Math.max(...lines.map((line) => line.width));
        const height = this.lineHeight * lines.length;
        if (this.options.textAlign !== "left" || this.options.translate) {
            lines.forEach((line) => {
                const anchor = (() => {
                    switch (this.options.textAlign) {
                        case "right":
                            return width - line.width;
                        case "center":
                            return (width - line.width) / 2;
                        case "left":
                        default:
                            return 0;
                    }
                })();
                const x = this.options.translate ? this.options.translate.x * width : 0;
                const y = this.options.translate ? this.options.translate.y * height : 0;
                for (const glyph of line.glyphs) {
                    glyph.x += anchor;
                    glyph.x += x;
                    glyph.y += y;
                }
            });
        }
        const glyphs = lines.flatMap((line) => line.glyphs);
        return {
            paragraph: trimmed.join("\n"),
            lines,
            glyphs,
            width,
            height,
        };
    }
    _breakLines(text) {
        return text.split("\n");
    }
    _collapse(text) {
        return text.replace(/\t/g, " ".repeat(this.options.tabSize)).replace(/ +/g, " ");
    }
    _wrap(text, lineOffset = 0) {
        const lines = new Array();
        let currentLine = lineOffset;
        let currentGlyphs = new Array();
        let currentCursor = 0;
        let currentWidth = 0;
        let lastChar;
        let start = 0;
        let end = start;
        const pushCurrentLine = () => {
            lines.push({
                text: text.slice(start, end),
                glyphs: currentGlyphs,
                start: start,
                end: end,
                width: currentWidth,
            });
        };
        while (end < text.length) {
            const i = end;
            const charCode = text.charCodeAt(i);
            const char = this.fontAsset._getChar(charCode);
            const charWidth = char.width;
            const kerning = lastChar ? this.fontAsset._getKerning(lastChar.id, char.id) : 0;
            currentCursor += kerning;
            const newWidth = currentCursor + charWidth;
            const cursorProgress = char.xadvance + this.options.letterSpacing;
            const nextPosition = currentCursor + cursorProgress;
            const shouldBreak = nextPosition > this.options.maxWidth || newWidth > this.options.maxWidth;
            if (shouldBreak) {
                pushCurrentLine();
                currentLine++;
                lastChar = undefined;
                currentCursor = 0;
                currentWidth = 0;
                start = end;
                end = start + 1;
                currentGlyphs = [];
            }
            const x = currentCursor;
            const y = currentLine * this.lineHeight;
            currentGlyphs.push({
                char,
                line: currentLine,
                position: currentGlyphs.length,
                x: x,
                y: y,
            });
            if (!shouldBreak) {
                lastChar = char;
                currentCursor = nextPosition;
                currentWidth = newWidth;
                end++;
            }
            else {
                currentCursor = cursorProgress;
            }
        }
        if (currentGlyphs.length > 0) {
            if (lastChar) {
                // currentWidth += lastChar.xadvance;
            }
            pushCurrentLine();
        }
        return lines;
    }
}
//# sourceMappingURL=paragraph.js.map