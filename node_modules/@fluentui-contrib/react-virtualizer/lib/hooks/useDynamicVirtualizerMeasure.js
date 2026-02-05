import { useIsomorphicLayoutEffect, useMergedRefs } from '@fluentui/react-utilities';
import * as React from 'react';
import { useResizeObserverRef_unstable } from './useResizeObserverRef';
import { useFluent_unstable as useFluent } from '@fluentui/react-shared-contexts';
/**
 * React hook that measures virtualized space dynamically to ensure optimized virtualization length.
 */ export const useDynamicVirtualizerMeasure = (virtualizerProps)=>{
    const { defaultItemSize, direction = 'vertical', numItems, getItemSize, bufferItems, bufferSize, virtualizerContext, gap = 0 } = virtualizerProps;
    const [virtualizerLength, setVirtualizerLength] = React.useState(0);
    const [virtualizerBufferItems, setVirtualizerBufferItems] = React.useState(0);
    const [virtualizerBufferSize, setVirtualizerBufferSize] = React.useState(0);
    const scrollPosition = React.useRef(0);
    const numItemsRef = React.useRef(numItems);
    const containerSizeRef = React.useRef(0);
    const { targetDocument } = useFluent();
    const container = React.useRef(null);
    const handleScrollResize = React.useCallback((scrollRef)=>{
        const hasReachedEnd = virtualizerContext.contextIndex + virtualizerLength >= numItems;
        // Track whether this update was driven by a change in numItems
        const numItemsChanged = numItemsRef.current !== numItems;
        numItemsRef.current = numItems;
        if (!(scrollRef == null ? void 0 : scrollRef.current) || hasReachedEnd && !numItemsChanged) {
            return;
        }
        if (scrollRef.current !== (targetDocument == null ? void 0 : targetDocument.body)) {
            // We have a local scroll container
            containerSizeRef.current = direction === 'vertical' ? scrollRef == null ? void 0 : scrollRef.current.getBoundingClientRect().height : scrollRef == null ? void 0 : scrollRef.current.getBoundingClientRect().width;
        } else if (targetDocument == null ? void 0 : targetDocument.defaultView) {
            var _targetDocument_defaultView, _targetDocument_defaultView1;
            // If our scroll ref is the document body, we should check window height
            containerSizeRef.current = direction === 'vertical' ? targetDocument == null ? void 0 : (_targetDocument_defaultView = targetDocument.defaultView) == null ? void 0 : _targetDocument_defaultView.innerHeight : targetDocument == null ? void 0 : (_targetDocument_defaultView1 = targetDocument.defaultView) == null ? void 0 : _targetDocument_defaultView1.innerWidth;
        }
        const _actualScrollPos = direction === 'vertical' ? scrollRef.current.scrollTop : scrollRef.current.scrollLeft;
        /* If the numItems changed, we're going to calc
       * a new index based on actual scroll position
       */ const actualScrollPos = numItemsChanged ? _actualScrollPos : scrollPosition.current;
        const sizeToBeat = containerSizeRef.current + virtualizerBufferSize * 2;
        const startIndex = Math.max(virtualizerContext.contextIndex, 0);
        let indexSizer = 0;
        let i = 0;
        let length = 0;
        let indexMod = 0;
        let currentItemPos = startIndex > 0 ? virtualizerContext.childProgressiveSizes.current[startIndex - 1] : 0;
        while(indexSizer <= sizeToBeat && i < numItems - startIndex){
            const iItemSize = getItemSize(startIndex + i) + gap;
            if (actualScrollPos > currentItemPos + iItemSize) {
                // The item isn't in view, we'll update index to skip it.
                i++;
                indexMod++;
                currentItemPos += iItemSize;
                continue;
            } else if (actualScrollPos > currentItemPos) {
                // The item is partially out of view, ignore the out of bounds portion
                const variance = currentItemPos + iItemSize - actualScrollPos;
                indexSizer += variance;
            } else {
                // Item is in view
                indexSizer += iItemSize;
            }
            // Increment
            i++;
            length++;
            currentItemPos += iItemSize;
        }
        /*
       * Number of items to append at each end, i.e. 'preload' each side before entering view.
       * Minimum: 2 - we give slightly more buffer for dynamic version.
       */ const newBufferItems = bufferItems != null ? bufferItems : Math.max(Math.ceil(length / 3), 1);
        /*
       * This is how far we deviate into the bufferItems to detect a redraw.
       */ const newBufferSize = bufferSize != null ? bufferSize : Math.max(defaultItemSize / 2, 1);
        const totalLength = length + newBufferItems * 2;
        if (numItemsChanged && indexMod - newBufferItems > 0) {
            // Virtualizer will recalculate on numItems change, but from the old index
            // We should get ahead of that update to prevent unnessecary recalculations
            virtualizerContext.setContextIndex(startIndex + indexMod - newBufferItems);
        }
        scrollPosition.current = actualScrollPos;
        setVirtualizerLength(totalLength);
        setVirtualizerBufferItems(newBufferItems);
        setVirtualizerBufferSize(newBufferSize);
    }, [
        bufferItems,
        bufferSize,
        defaultItemSize,
        direction,
        numItems,
        targetDocument == null ? void 0 : targetDocument.body,
        targetDocument == null ? void 0 : targetDocument.defaultView,
        virtualizerBufferSize,
        virtualizerContext.childProgressiveSizes,
        virtualizerContext.contextIndex,
        virtualizerLength
    ]);
    const resizeCallback = React.useCallback((_entries, // TODO: exclude types from this lint rule: https://github.com/microsoft/fluentui/issues/31286
    // eslint-disable-next-line no-restricted-globals
    _observer, scrollRef)=>{
        if (scrollRef) {
            handleScrollResize(scrollRef);
        }
    }, [
        handleScrollResize
    ]);
    React.useEffect(()=>{
        // Track numItems changes (consumed in handleScrollResize)
        numItemsRef.current = numItems;
    }, [
        numItems
    ]);
    const scrollRef = useMergedRefs(container, useResizeObserverRef_unstable(resizeCallback));
    useIsomorphicLayoutEffect(()=>{
        if (virtualizerContext.contextIndex + virtualizerLength < numItems) {
            // Avoid re-rendering/re-calculating when the end index has already been reached
            handleScrollResize(container);
        }
    }, [
        handleScrollResize,
        numItems,
        virtualizerContext.contextIndex,
        virtualizerLength
    ]);
    const updateScrollPosition = React.useCallback((_scrollPosition)=>{
        scrollPosition.current = _scrollPosition;
        handleScrollResize(scrollRef);
    }, [
        handleScrollResize,
        scrollRef
    ]);
    return {
        virtualizerLength,
        bufferItems: virtualizerBufferItems,
        bufferSize: virtualizerBufferSize,
        scrollRef,
        containerSizeRef,
        updateScrollPosition
    };
};

//# sourceMappingURL=useDynamicVirtualizerMeasure.js.map