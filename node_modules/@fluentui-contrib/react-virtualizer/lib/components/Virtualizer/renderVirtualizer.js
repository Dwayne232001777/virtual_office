/** @jsxRuntime classic */ /** @jsx createElement */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement } from '@fluentui/react-jsx-runtime';
import * as React from 'react';
import { assertSlots } from '@fluentui/react-utilities';
export const renderVirtualizer_unstable = (state)=>{
    assertSlots(state);
    return /*#__PURE__*/ createElement(React.Fragment, null, /*#__PURE__*/ createElement(state.beforeContainer, null, /*#__PURE__*/ createElement(state.before, null)), state.virtualizedChildren, /*#__PURE__*/ createElement(state.afterContainer, null, /*#__PURE__*/ createElement(state.after, null)));
};
export const renderVirtualizerChildPlaceholder = (child, index)=>{
    return /*#__PURE__*/ createElement(React.Suspense, {
        key: `fui-virtualizer-placeholder-${index}`,
        fallback: null
    }, child);
};

//# sourceMappingURL=renderVirtualizer.js.map