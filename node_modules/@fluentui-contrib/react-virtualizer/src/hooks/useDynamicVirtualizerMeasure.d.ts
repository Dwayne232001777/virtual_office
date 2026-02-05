import * as React from 'react';
import { VirtualizerMeasureDynamicProps } from './hooks.types';
/**
 * React hook that measures virtualized space dynamically to ensure optimized virtualization length.
 */
export declare const useDynamicVirtualizerMeasure: <TElement extends HTMLElement>(virtualizerProps: VirtualizerMeasureDynamicProps) => {
    virtualizerLength: number;
    bufferItems: number;
    bufferSize: number;
    scrollRef: (instance: TElement | null) => void;
    containerSizeRef: React.RefObject<number>;
    updateScrollPosition: (scrollPosition: number) => void;
};
