import * as React from 'react';
import { VirtualizerStaticPaginationProps } from './hooks.types';
/**
 * Optional hook that will enable pagination on the virtualizer so that it 'autoscrolls' to an items exact position
 * Sizes are uniform/static, we round to the nearest item on long scrolls
 * On short scrolls, we will go at minimum to the next/previous item so that arrow pagination works
 * All VirtualizerStaticPaginationProps can be grabbed from Virtualizer hooks externally and passed in
 */
export declare const useStaticVirtualizerPagination: (virtualizerProps: VirtualizerStaticPaginationProps, paginationEnabled?: boolean) => React.RefCallback<HTMLElement | HTMLDivElement | null>;
