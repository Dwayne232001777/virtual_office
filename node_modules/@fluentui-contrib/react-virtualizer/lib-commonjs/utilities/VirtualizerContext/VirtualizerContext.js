"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get VirtualizerContextProvider () {
        return VirtualizerContextProvider;
    },
    get useVirtualizerContextState_unstable () {
        return useVirtualizerContextState_unstable;
    },
    get useVirtualizerContext_unstable () {
        return useVirtualizerContext_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const VirtualizerContext = _react.createContext(undefined);
const VirtualizerContextProvider = VirtualizerContext.Provider;
const useVirtualizerContext_unstable = ()=>{
    return _react.useContext(VirtualizerContext);
};
const useVirtualizerContextState_unstable = (passedContext)=>{
    const virtualizerContext = useVirtualizerContext_unstable();
    const [_contextIndex, _setContextIndex] = _react.useState(-1);
    const childProgressiveSizes = _react.useRef([]);
    /* We respect any wrapped providers while also ensuring defaults or passed through
   * Order of usage -> Passed Prop -> Provider Context -> Internal State default
   */ const context = _react.useMemo(()=>{
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