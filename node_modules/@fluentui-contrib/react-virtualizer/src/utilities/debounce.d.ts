/**
 * Microtask debouncer
 * https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
 * @param fn - Function to debounce
 * @returns debounced function
 */
export declare function debounce(fn: Function): () => void;
