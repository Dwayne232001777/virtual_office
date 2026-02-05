import * as React from 'react';
/**
 * This function will take the rootMargin and flip the sides if we are in RTL based on the computed reading direction of the target element.
 * @param ltrRootMargin the margin to be processed and flipped if required
 * @param target target element that will have its current reading direction determined
 * @returns the corrected rootMargin (if it was necessary to correct)
 */
export declare const getRTLRootMargin: (ltrRootMargin: string, target?: Element | Document | null | undefined, win?: Window | null) => string;
/**
 * React hook that allows easy usage of the browser API IntersectionObserver within React
 * @param callback - A function called when the percentage of the target element is visible crosses a threshold.
 * @param options - An optional object which customizes the observer. If options isn't specified, the observer uses the
 * document's viewport as the root, with no margin, and a 0% threshold (meaning that even a one-pixel change is
 * enough to trigger a callback).
 * @returns An array containing a callback to update the list of Elements the observer should listen to, a callback to
 * update the init options of the IntersectionObserver and a ref to the IntersectionObserver instance itself.
 */
export declare const useIntersectionObserver: (callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
    setObserverList: React.Dispatch<React.SetStateAction<Element[] | undefined>>;
    setObserverInit: (newInit: IntersectionObserverInit | undefined) => void;
    observer: React.MutableRefObject<IntersectionObserver | undefined>;
};
