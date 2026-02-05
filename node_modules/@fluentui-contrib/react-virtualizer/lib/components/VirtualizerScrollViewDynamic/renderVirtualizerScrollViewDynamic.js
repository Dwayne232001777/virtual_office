/** @jsxRuntime classic */ /** @jsx createElement */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement } from '@fluentui/react-jsx-runtime';
import { assertSlots } from '@fluentui/react-utilities';
import { renderVirtualizer_unstable } from '../Virtualizer/renderVirtualizer';
export const renderVirtualizerScrollViewDynamic_unstable = (state)=>{
    assertSlots(state);
    return /*#__PURE__*/ createElement(state.container, null, renderVirtualizer_unstable(state));
};

//# sourceMappingURL=renderVirtualizerScrollViewDynamic.js.map