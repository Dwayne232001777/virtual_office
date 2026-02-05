import * as React from 'react';
export declare const useMutationObserver: (target: Element | Document | undefined, callback: MutationCallback, options?: MutationObserverInit) => {
    observer: React.MutableRefObject<MutationObserver | undefined>;
};
