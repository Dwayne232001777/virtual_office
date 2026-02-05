"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useDynamicVirtualizerPagination", {
    enumerable: true,
    get: function() {
        return useDynamicVirtualizerPagination;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactutilities = require("@fluentui/react-utilities");
const useDynamicVirtualizerPagination = (virtualizerProps, paginationEnabled = true)=>{
    'use no memo';
    const { axis = 'vertical', currentIndex, actualNodeSizes, progressiveItemSizes, virtualizerLength } = virtualizerProps;
    const [setScrollTimer, clearScrollTimer] = (0, _reactutilities.useTimeout)();
    const lastScrollPos = _react.useRef(-1);
    const lastIndexScrolled = _react.useRef(0);
    const scrollContainer = _react.useRef(null);
    const clearListeners = ()=>{
        if (scrollContainer.current) {
            scrollContainer.current.removeEventListener('scroll', onScroll);
            scrollContainer.current = null;
            clearScrollTimer();
        }
    };
    _react.useEffect(()=>{
        return ()=>{
            clearListeners();
        };
    }, []);
    /**
   * Handle scroll stop event and paginate to the closest item
   * If the closest item is the same as the previous scroll end
   * we paginate to the next/previous one based on direction
   *
   * Users/Virtualizer-Hooks must pass in a cumulative array of sizes
   * This prevents the need to recalculate and ensures size arrays are synced externally
   */ const onScrollEnd = _react.useCallback(()=>{
        if (!scrollContainer.current || !paginationEnabled || !(progressiveItemSizes == null ? void 0 : progressiveItemSizes.current) || !actualNodeSizes.current) {
            // No container found
            return;
        }
        const currentScrollPos = Math.round(axis === 'vertical' ? scrollContainer.current.scrollTop : scrollContainer.current.scrollLeft);
        const actualItemSizes = [
            0,
            ...progressiveItemSizes.current
        ];
        let closestItemPos = 0;
        let closestItem = 0;
        for(let i = 0; i < actualItemSizes.length - 1; i++){
            // First, update our progressive size array to the actual post-render measurement
            if (i + 1 < actualItemSizes.length) {
                actualItemSizes[i + 1] = actualItemSizes[i] + actualNodeSizes.current[i];
            }
            if (currentScrollPos <= actualItemSizes[i + 1] && currentScrollPos >= actualItemSizes[i]) {
                // Found our in between position
                const distanceToPrev = Math.abs(currentScrollPos - actualItemSizes[i]);
                const distanceToNext = Math.abs(actualItemSizes[i + 1] - currentScrollPos);
                if (distanceToPrev < distanceToNext) {
                    closestItem = i;
                } else {
                    closestItem = i + 1;
                }
                break;
            }
        }
        let nextItem = closestItem;
        if (nextItem === lastIndexScrolled.current) {
            // Special case for go to next/previous with minimum amount of scroll needed
            const nextTarget = lastScrollPos.current < currentScrollPos ? 1 : -1;
            // This will also handle a case where we scrolled to the exact correct position (noop)
            const isSecondaryScroll = Math.round(lastScrollPos.current - currentScrollPos) === 0;
            const posMod = isSecondaryScroll ? 0 : nextTarget;
            nextItem = closestItem + posMod;
        }
        // Safeguard nextItem
        nextItem = Math.min(Math.max(0, nextItem), actualItemSizes.length);
        closestItemPos = actualItemSizes[nextItem];
        if (axis === 'vertical') {
            scrollContainer.current.scrollTo({
                top: closestItemPos,
                behavior: 'smooth'
            });
        } else {
            scrollContainer.current.scrollTo({
                left: closestItemPos,
                behavior: 'smooth'
            });
        }
        lastScrollPos.current = closestItemPos;
        lastIndexScrolled.current = nextItem;
    }, [
        paginationEnabled,
        currentIndex,
        scrollContainer,
        virtualizerLength,
        axis,
        progressiveItemSizes
    ]);
    /**
   * On scroll timer that will continuously delay callback until scrolling stops
   */ const onScroll = _react.useCallback(()=>{
        clearScrollTimer();
        setScrollTimer(onScrollEnd, 100);
    }, [
        onScrollEnd,
        clearScrollTimer,
        setScrollTimer
    ]);
    /**
   * Pagination ref will ensure we attach listeners to containers on change
   * It is returned from hook and merged into the scroll container externally
   */ const paginationRef = _react.useCallback((instance)=>{
        if (!paginationEnabled) {
            clearListeners();
            scrollContainer.current = null;
            return;
        }
        if (scrollContainer.current !== instance) {
            clearListeners();
            scrollContainer.current = instance;
            if (scrollContainer.current) {
                scrollContainer.current.addEventListener('scroll', onScroll);
            }
        }
    }, [
        onScroll,
        onScrollEnd,
        paginationEnabled
    ]);
    return paginationRef;
};

//# sourceMappingURL=useDynamicPagination.js.map