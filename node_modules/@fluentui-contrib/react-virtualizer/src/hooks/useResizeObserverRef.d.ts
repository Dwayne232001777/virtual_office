import * as React from 'react';
import { ResizeCallbackWithRef } from './hooks.types';
/**
 * useResizeObserverRef_unstable simplifies resize observer connection and ensures debounce/cleanup
 */
export declare const useResizeObserverRef_unstable: (resizeCallback: ResizeCallbackWithRef) => React.RefCallback<HTMLElement | HTMLDivElement | null>;
