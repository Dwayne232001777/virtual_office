import * as React from 'react';
import { slot, useMergedRefs } from '@fluentui/react-utilities';
import { useVirtualizer_unstable } from '../Virtualizer/useVirtualizer';
import { useStaticVirtualizerMeasure } from '../../Hooks';
import { scrollToItemStatic } from '../../Utilities';
import { useStaticVirtualizerPagination } from '../../hooks/useStaticPagination';
export function useVirtualizerScrollView_unstable(props) {
    const { imperativeRef, itemSize, numItems, axis = 'vertical', reversed, enablePagination = false, gap } = props;
    var _props_axis;
    const { virtualizerLength, bufferItems, bufferSize, scrollRef, containerSizeRef } = useStaticVirtualizerMeasure({
        defaultItemSize: props.itemSize,
        direction: (_props_axis = props.axis) != null ? _props_axis : 'vertical'
    });
    // Store the virtualizer length as a ref for imperative ref access
    const virtualizerLengthRef = React.useRef(virtualizerLength);
    if (virtualizerLengthRef.current !== virtualizerLength) {
        virtualizerLengthRef.current = virtualizerLength;
    }
    const paginationRef = useStaticVirtualizerPagination({
        axis,
        itemSize
    }, enablePagination);
    const scrollViewRef = useMergedRefs(props.scrollViewRef, scrollRef, paginationRef);
    const imperativeVirtualizerRef = React.useRef(null);
    const scrollCallbackRef = React.useRef(null);
    React.useImperativeHandle(imperativeRef, ()=>{
        var _imperativeVirtualizerRef_current;
        return {
            scrollTo (index, behavior = 'auto', callback) {
                var _imperativeVirtualizerRef_current;
                scrollCallbackRef.current = callback != null ? callback : null;
                (_imperativeVirtualizerRef_current = imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.setFlaggedIndex(index);
                scrollToItemStatic({
                    index,
                    itemSize,
                    totalItems: numItems,
                    scrollViewRef,
                    axis,
                    reversed,
                    behavior,
                    gap
                });
            },
            scrollToPosition (position, behavior = 'auto', index, callback) {
                if (callback) {
                    scrollCallbackRef.current = callback != null ? callback : null;
                }
                if (imperativeVirtualizerRef.current) {
                    var _scrollViewRef_current;
                    if (index !== undefined) {
                        imperativeVirtualizerRef.current.setFlaggedIndex(index);
                    }
                    const positionOptions = axis == 'vertical' ? {
                        top: position
                    } : {
                        left: position
                    };
                    (_scrollViewRef_current = scrollViewRef.current) == null ? void 0 : _scrollViewRef_current.scrollTo({
                        behavior,
                        ...positionOptions
                    });
                }
            },
            currentIndex: (_imperativeVirtualizerRef_current = imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.currentIndex,
            virtualizerLength: virtualizerLengthRef
        };
    }, [
        axis,
        scrollViewRef,
        itemSize,
        numItems,
        reversed
    ]);
    const handleRenderedIndex = (index)=>{
        if (scrollCallbackRef.current) {
            scrollCallbackRef.current(index);
        }
    };
    const virtualizerState = useVirtualizer_unstable({
        ...props,
        virtualizerLength,
        bufferItems,
        bufferSize,
        onRenderedFlaggedIndex: handleRenderedIndex,
        imperativeVirtualizerRef,
        containerSizeRef,
        gap
    });
    return {
        ...virtualizerState,
        components: {
            ...virtualizerState.components,
            container: 'div'
        },
        container: slot.always(props.container, {
            defaultProps: {
                ref: scrollViewRef
            },
            elementType: 'div'
        })
    };
}

//# sourceMappingURL=useVirtualizerScrollView.js.map