import * as React from 'react';
import type { DynamicVirtualizerContextProps, VirtualizerContextProps } from './types';
export declare const VirtualizerContextProvider: React.Provider<VirtualizerContextProps>;
export declare const useVirtualizerContext_unstable: () => VirtualizerContextProps | undefined;
export declare const useVirtualizerContextState_unstable: (passedContext?: VirtualizerContextProps) => DynamicVirtualizerContextProps;
