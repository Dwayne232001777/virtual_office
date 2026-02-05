/** @jsxRuntime classic */ /** @jsx createElement */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    get renderVirtualizerChildPlaceholder () {
        return renderVirtualizerChildPlaceholder;
    },
    get renderVirtualizer_unstable () {
        return renderVirtualizer_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _reactjsxruntime = require("@fluentui/react-jsx-runtime");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactutilities = require("@fluentui/react-utilities");
const renderVirtualizer_unstable = (state)=>{
    (0, _reactutilities.assertSlots)(state);
    return /*#__PURE__*/ (0, _reactjsxruntime.createElement)(_react.Fragment, null, /*#__PURE__*/ (0, _reactjsxruntime.createElement)(state.beforeContainer, null, /*#__PURE__*/ (0, _reactjsxruntime.createElement)(state.before, null)), state.virtualizedChildren, /*#__PURE__*/ (0, _reactjsxruntime.createElement)(state.afterContainer, null, /*#__PURE__*/ (0, _reactjsxruntime.createElement)(state.after, null)));
};
const renderVirtualizerChildPlaceholder = (child, index)=>{
    return /*#__PURE__*/ (0, _reactjsxruntime.createElement)(_react.Suspense, {
        key: `fui-virtualizer-placeholder-${index}`,
        fallback: null
    }, child);
};

//# sourceMappingURL=renderVirtualizer.js.map