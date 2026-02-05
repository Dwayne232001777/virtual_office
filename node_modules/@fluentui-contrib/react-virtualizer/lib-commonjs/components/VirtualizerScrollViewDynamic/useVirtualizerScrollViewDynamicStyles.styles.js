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
    get useVirtualizerScrollViewDynamicStyles_unstable () {
        return useVirtualizerScrollViewDynamicStyles_unstable;
    },
    get virtualizerScrollViewDynamicClassNames () {
        return virtualizerScrollViewDynamicClassNames;
    }
});
const _useVirtualizerStylesstyles = require("../Virtualizer/useVirtualizerStyles.styles");
const _react = require("@griffel/react");
const virtualizerScrollViewDynamicClassName = 'fui-Virtualizer-Scroll-View-Dynamic';
const virtualizerScrollViewDynamicClassNames = {
    ..._useVirtualizerStylesstyles.virtualizerClassNames,
    container: `${virtualizerScrollViewDynamicClassName}__container`
};
const useStyles = (0, _react.makeStyles)({
    base: {
        display: 'flex',
        width: '100%',
        height: '100%'
    },
    vertical: {
        flexDirection: 'column',
        overflowY: 'auto'
    },
    horizontal: {
        flexDirection: 'row',
        overflowX: 'auto'
    },
    verticalReversed: {
        flexDirection: 'column-reverse',
        overflowY: 'auto'
    },
    horizontalReversed: {
        flexDirection: 'row-reverse',
        overflowX: 'auto'
    },
    enableScrollAnchor: {
        // When scroll anchor is enabled, we handle scroll changes ourselves
        overflowAnchor: 'none'
    }
});
const useVirtualizerScrollViewDynamicStyles_unstable = (state)=>{
    'use no memo';
    const { enableScrollAnchor } = state;
    const styles = useStyles();
    // Default virtualizer styles base
    (0, _useVirtualizerStylesstyles.useVirtualizerStyles_unstable)(state);
    const containerStyle = state.axis === 'horizontal' ? state.reversed ? styles.horizontalReversed : styles.horizontal : state.reversed ? styles.verticalReversed : styles.vertical;
    // Add container styles
    state.container.className = (0, _react.mergeClasses)(virtualizerScrollViewDynamicClassNames.container, styles.base, containerStyle, state.container.className, // Ensure browser-based anchor is disabled if our prop is set (override user)
    enableScrollAnchor && styles.enableScrollAnchor);
    return state;
};

//# sourceMappingURL=useVirtualizerScrollViewDynamicStyles.styles.js.map