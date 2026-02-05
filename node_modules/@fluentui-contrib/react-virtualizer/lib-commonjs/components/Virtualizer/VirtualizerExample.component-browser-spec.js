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
    get VirtualizerComboboxExample () {
        return VirtualizerComboboxExample;
    },
    get VirtualizerExample () {
        return VirtualizerExample;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactcomponents = require("@fluentui/react-components");
const _Virtualizer = require("./Virtualizer");
const _useVirtualizerMeasure = require("../../hooks/useVirtualizerMeasure");
const useStyles = (0, _reactcomponents.makeStyles)({
    container: {
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        width: '100%',
        height: '500px',
        border: '1px solid #ccc'
    },
    child: {
        height: '50px',
        lineHeight: '50px',
        width: '100%',
        borderBottom: '1px solid #eee',
        padding: '0 10px'
    },
    keyTestContainer: {
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        width: '100%',
        height: '400px',
        border: '1px solid #ccc'
    },
    item: {
        height: '50px',
        lineHeight: '50px',
        padding: '0 10px',
        borderBottom: '1px solid #eee'
    },
    button: {
        marginBottom: '10px',
        padding: '8px 16px'
    }
});
const VirtualizerExample = ({ numItems = 1000, itemSize = 50 })=>{
    const styles = useStyles();
    const [items, setItems] = _react.useState(Array.from({
        length: numItems
    }, (_, i)=>({
            id: `item-${i}`,
            value: i
        })));
    const handleAddItem = ()=>{
        const nextId = items.length;
        const newItem = {
            id: `item-${nextId}`,
            value: nextId
        };
        setItems((prev)=>[
                newItem,
                ...prev
            ]); // Prepend to beginning
    };
    const handleAddMultipleItems = ()=>{
        const newItems = [];
        const nextId = items.length;
        for(let i = 0; i < 10; i++){
            newItems.push({
                id: `item-${nextId + i}`,
                value: nextId + i
            });
        }
        setItems((prev)=>[
                ...newItems,
                ...prev
            ]); // Prepend multiple items
    };
    const { virtualizerLength, bufferItems, bufferSize, scrollRef, containerSizeRef } = (0, _useVirtualizerMeasure.useStaticVirtualizerMeasure)({
        defaultItemSize: itemSize
    });
    return /*#__PURE__*/ _react.createElement("div", null, /*#__PURE__*/ _react.createElement("button", {
        className: styles.button,
        onClick: handleAddItem,
        "data-testid": "add-item-button"
    }, "Add Item"), /*#__PURE__*/ _react.createElement("button", {
        className: styles.button,
        onClick: handleAddMultipleItems,
        "data-testid": "add-multiple-button"
    }, "Add 10 Items"), /*#__PURE__*/ _react.createElement("div", {
        className: styles.keyTestContainer,
        role: "list",
        ref: scrollRef,
        "data-testid": "scroll-container",
        "aria-label": "Virtualizer Example"
    }, /*#__PURE__*/ _react.createElement(_Virtualizer.Virtualizer, {
        numItems: items.length,
        virtualizerLength: virtualizerLength,
        bufferItems: bufferItems,
        bufferSize: bufferSize,
        itemSize: 50,
        containerSizeRef: containerSizeRef
    }, (index)=>{
        const item = items[index];
        return /*#__PURE__*/ _react.createElement("div", {
            key: item.id,
            role: "listitem",
            className: styles.item,
            "data-testid": item.id,
            "data-value": item.value,
            "aria-posinset": index + 1,
            "aria-setsize": items.length
        }, "Item ", item.value);
    })));
};
const useComboboxStyles = (0, _reactcomponents.makeStyles)({
    listbox: {
        // maxHeight will be applied only positioning autoSize set.
        maxHeight: '250px'
    },
    option: {
        height: '32px'
    }
});
const VirtualizerComboboxExample = ()=>{
    const comboId = (0, _reactcomponents.useId)('combobox');
    //This should include the item height (32px) and account for rowGap (2px)
    const itemHeight = 32;
    const rowGap = 2;
    const [options] = _react.useState([
        {
            id: 0,
            name: 'a'
        },
        {
            id: 1,
            name: 'b'
        },
        {
            id: 2,
            name: 'c'
        },
        {
            id: 3,
            name: 'd'
        },
        {
            id: 4,
            name: 'e'
        },
        {
            id: 5,
            name: 'f'
        },
        {
            id: 6,
            name: 'g'
        },
        {
            id: 7,
            name: 'h'
        },
        {
            id: 8,
            name: 'i'
        },
        {
            id: 9,
            name: 'j'
        },
        {
            id: 10,
            name: 'k'
        }
    ]);
    const { virtualizerLength, bufferItems, bufferSize, scrollRef, containerSizeRef } = (0, _useVirtualizerMeasure.useStaticVirtualizerMeasure)({
        defaultItemSize: itemHeight,
        direction: 'vertical',
        // We want at least 10 additional items on each side of visible items for page up/down (+ 1 buffer)
        bufferItems: 4,
        // We need to recalculate index when at least 10 items (+1px) from the bottom or top for page up/down
        bufferSize: itemHeight * 3 + 1
    });
    const selectedIndex = _react.useRef(0);
    const styles = useComboboxStyles();
    const mergedRefs = (0, _reactcomponents.useMergedRefs)(scrollRef);
    // Scroll timer required to post scrollTo on stack post-open state change
    const [setScrollTimer, clearScrollTimer] = (0, _reactcomponents.useTimeout)();
    return /*#__PURE__*/ _react.createElement(_reactcomponents.FluentProvider, {
        theme: _reactcomponents.webLightTheme
    }, /*#__PURE__*/ _react.createElement("label", {
        htmlFor: `${comboId}`
    }, "Medium"), /*#__PURE__*/ _react.createElement(_reactcomponents.Combobox, {
        id: `${comboId}`,
        placeholder: "Select a number",
        positioning: {
            autoSize: 'width'
        },
        listbox: {
            ref: mergedRefs,
            className: styles.listbox
        },
        onOpenChange: (e, data)=>{
            clearScrollTimer();
            if (data.open) {
                setScrollTimer(()=>{
                    var _mergedRefs_current;
                    (_mergedRefs_current = mergedRefs.current) == null ? void 0 : _mergedRefs_current.scrollTo({
                        top: (itemHeight + rowGap) * selectedIndex.current
                    });
                }, 0);
            }
        },
        onOptionSelect: (_, data)=>{
            if (data.optionValue) {
                selectedIndex.current = parseInt(data.optionValue, 10);
            }
        },
        inlinePopup: true
    }, /*#__PURE__*/ _react.createElement(_Virtualizer.Virtualizer, {
        numItems: options.length,
        virtualizerLength: virtualizerLength,
        bufferItems: bufferItems,
        bufferSize: bufferSize,
        itemSize: itemHeight,
        containerSizeRef: containerSizeRef,
        gap: rowGap
    }, (index)=>{
        return /*#__PURE__*/ _react.createElement(_reactcomponents.Option, {
            className: styles.option,
            "aria-posinset": index,
            "aria-setsize": options.length,
            key: `item-${index}`,
            value: index.toString(),
            "data-testid": `option-${index}`
        }, options[index].name);
    })));
};

//# sourceMappingURL=VirtualizerExample.component-browser-spec.js.map