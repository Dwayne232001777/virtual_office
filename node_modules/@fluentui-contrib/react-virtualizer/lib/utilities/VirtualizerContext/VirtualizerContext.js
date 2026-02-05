import * as React from 'react';
const VirtualizerContext = React.createContext(undefined);
export const VirtualizerContextProvider = VirtualizerContext.Provider;
export const useVirtualizerContext_unstable = ()=>{
    return React.useContext(VirtualizerContext);
};
export const useVirtualizerContextState_unstable = (passedContext)=>{
    const virtualizerContext = useVirtualizerContext_unstable();
    const [_contextIndex, _setContextIndex] = React.useState(-1);
    const childProgressiveSizes = React.useRef([]);
    /* We respect any wrapped providers while also ensuring defaults or passed through
   * Order of usage -> Passed Prop -> Provider Context -> Internal State default
   */ const context = React.useMemo(()=>{
        var _passedContext_contextIndex, _ref, _passedContext_setContextIndex, _ref1;
        return {
            contextIndex: (_ref = (_passedContext_contextIndex = passedContext == null ? void 0 : passedContext.contextIndex) != null ? _passedContext_contextIndex : virtualizerContext == null ? void 0 : virtualizerContext.contextIndex) != null ? _ref : _contextIndex,
            setContextIndex: (_ref1 = (_passedContext_setContextIndex = passedContext == null ? void 0 : passedContext.setContextIndex) != null ? _passedContext_setContextIndex : virtualizerContext == null ? void 0 : virtualizerContext.setContextIndex) != null ? _ref1 : _setContextIndex,
            childProgressiveSizes
        };
    }, [
        _contextIndex,
        passedContext,
        virtualizerContext
    ]);
    return context;
};

//# sourceMappingURL=VirtualizerContext.js.map