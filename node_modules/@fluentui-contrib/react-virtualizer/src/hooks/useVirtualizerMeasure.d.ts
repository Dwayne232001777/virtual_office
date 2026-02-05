import * as React from 'react';
import { VirtualizerMeasureProps } from './hooks.types';
/**
 * React hook that measures virtualized space based on a static size to ensure optimized virtualization length.
 */
export declare const useStaticVirtualizerMeasure: <TElement extends HTMLElement>(virtualizerProps: VirtualizerMeasureProps) => {
    virtualizerLength: number;
    bufferItems: number;
    bufferSize: number;
    scrollRef: (instance: TElement | null) => void;
    containerSizeRef: React.MutableRefObject<number>;
};
