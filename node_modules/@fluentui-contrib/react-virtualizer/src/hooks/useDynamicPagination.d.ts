import * as React from 'react';
import { VirtualizerDynamicPaginationProps } from './hooks.types';
/**
 * Optional hook that will enable pagination on the virtualizer so that it 'autoscrolls' to an items exact position
 * Sizes are dynamic so we require a progressive sizing array (passed in from Dynamic virtualizer hooks)
 * On short scrolls, we will go at minimum to the next/previous item so that arrow pagination works
 * All VirtualizerDynamicPaginationProps can be grabbed from dynamic Virtualizer hooks externally and passed in
 */
export declare const useDynamicVirtualizerPagination: (virtualizerProps: VirtualizerDynamicPaginationProps, paginationEnabled?: boolean) => React.RefCallback<HTMLElement | HTMLDivElement | null>;
