"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "scrollToItemStatic", {
    enumerable: true,
    get: function() {
        return scrollToItemStatic;
    }
});
const scrollToItemStatic = (params)=>{
    const { index, itemSize: _itemSize, totalItems, scrollViewRef, axis = 'vertical', reversed = false, behavior = 'auto', gap = 0 } = params;
    const itemSize = _itemSize + gap;
    if (axis === 'horizontal') {
        if (reversed) {
            var _scrollViewRef_current;
            (_scrollViewRef_current = scrollViewRef.current) == null ? void 0 : _scrollViewRef_current.scrollTo({
                left: totalItems * itemSize - itemSize * index,
                behavior
            });
        } else {
            var _scrollViewRef_current1;
            (_scrollViewRef_current1 = scrollViewRef.current) == null ? void 0 : _scrollViewRef_current1.scrollTo({
                left: itemSize * index,
                behavior
            });
        }
    } else {
        if (reversed) {
            var _scrollViewRef_current2;
            (_scrollViewRef_current2 = scrollViewRef.current) == null ? void 0 : _scrollViewRef_current2.scrollTo({
                top: totalItems * itemSize - itemSize * index,
                behavior
            });
        } else {
            var _scrollViewRef_current3;
            (_scrollViewRef_current3 = scrollViewRef.current) == null ? void 0 : _scrollViewRef_current3.scrollTo({
                top: itemSize * index,
                behavior
            });
        }
    }
};

//# sourceMappingURL=imperativeScrolling.js.map