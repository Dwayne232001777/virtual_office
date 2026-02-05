/**
 * Microtask debouncer
 * https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
 * @param fn - Function to debounce
 * @returns debounced function
 */ // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "debounce", {
    enumerable: true,
    get: function() {
        return debounce;
    }
});
function debounce(fn) {
    let pending;
    return ()=>{
        if (!pending) {
            pending = true;
            queueMicrotask(()=>{
                // Need to set pending to `false` before the debounced function is run.
                // React can actually interrupt the function while it's running!
                pending = false;
                fn();
            });
        }
    };
}

//# sourceMappingURL=debounce.js.map