"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _experimentalctreact = require("@playwright/experimental-ct-react");
const _VirtualizerExamplecomponentbrowserspec = require("./VirtualizerExample.component-browser-spec");
_experimentalctreact.test.use({
    viewport: {
        width: 800,
        height: 600
    }
});
/**
 * Helper function to check if console errors contain React key reconciliation errors
 */ const hasKeyErrors = (errors)=>{
    const keyErrorPatterns = [
        'key',
        'unique',
        'Warning: Encountered two children with the same key'
    ];
    return errors.some((err)=>keyErrorPatterns.some((pattern)=>err.includes(pattern)));
};
_experimentalctreact.test.describe('Virtualizer', ()=>{
    (0, _experimentalctreact.test)('should render only visible items initially', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 1000
        }));
        await (0, _experimentalctreact.expect)(component).toBeVisible();
        // Should render first item
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
        // Should NOT render items far down the list
        const farItem = component.getByTestId('item-500');
        await (0, _experimentalctreact.expect)(farItem).not.toBeAttached();
    });
    (0, _experimentalctreact.test)('should have correct ARIA attributes', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 100
        }));
        const container = component.getByTestId('scroll-container');
        await (0, _experimentalctreact.expect)(container).toBeVisible();
        await (0, _experimentalctreact.expect)(container).toHaveAttribute('role', 'list');
        await (0, _experimentalctreact.expect)(container).toHaveAttribute('aria-label', 'Virtualizer Example');
        // Wait for first item to be rendered (virtualizer needs to measure container first)
        const firstItem = component.getByTestId('item-0');
        await (0, _experimentalctreact.expect)(firstItem).toBeVisible();
        // Check ARIA attributes
        await (0, _experimentalctreact.expect)(firstItem).toHaveAttribute('role', 'listitem');
        await (0, _experimentalctreact.expect)(firstItem).toHaveAttribute('aria-posinset', '1');
        await (0, _experimentalctreact.expect)(firstItem).toHaveAttribute('aria-setsize', '100');
    });
    (0, _experimentalctreact.test)('should update visible items on scroll', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 1000
        }));
        // Initially item-0 should be visible
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
        // Scroll down
        const container = component.getByTestId('scroll-container');
        await container.evaluate((el)=>{
            el.scrollTop = 2500; // Scroll to middle (50 items * 50px each)
        });
        // Wait for item-50 to appear (IntersectionObserver callback)
        await (0, _experimentalctreact.expect)(component.getByTestId('item-50')).toBeVisible();
        // Item-0 should no longer be in the DOM
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).not.toBeAttached();
    });
    (0, _experimentalctreact.test)('should handle rapid scrolling without whitespace', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 1000
        }));
        const container = component.getByTestId('scroll-container');
        // Perform rapid scrolling
        for(let i = 0; i < 10; i++){
            await container.evaluate((el, offset)=>{
                el.scrollTop += offset;
            }, 500);
        }
        // Wait for items to be rendered after scrolling
        await (0, _experimentalctreact.expect)(component.locator('[role="listitem"]').first()).toBeVisible();
        // Should still have items rendered (no blank space)
        const items = await component.locator('[role="listitem"]').count();
        (0, _experimentalctreact.expect)(items).toBeGreaterThan(0);
    });
    (0, _experimentalctreact.test)('should scroll to bottom and render last items', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 1000
        }));
        const container = component.getByTestId('scroll-container');
        // Scroll to bottom
        await container.evaluate((el)=>{
            el.scrollTop = el.scrollHeight;
        });
        // Wait for last item to appear
        await (0, _experimentalctreact.expect)(component.getByTestId('item-999')).toBeVisible();
    });
    (0, _experimentalctreact.test)('should handle scroll to top', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 1000
        }));
        const container = component.getByTestId('scroll-container');
        // First scroll to middle
        await container.evaluate((el)=>{
            el.scrollTop = 5000;
        });
        // Wait for middle items to appear
        await (0, _experimentalctreact.expect)(component.getByTestId('item-100')).toBeVisible();
        // Then scroll back to top
        await container.evaluate((el)=>{
            el.scrollTop = 0;
        });
        // Wait for first item to reappear
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
    });
    (0, _experimentalctreact.test)('should maintain correct item count', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 1000
        }));
        const container = component.getByTestId('scroll-container');
        await (0, _experimentalctreact.expect)(container).toBeVisible();
        // Wait for initial items to be rendered
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
        // Count rendered items
        const itemCount = await component.locator('[role="listitem"]').count();
        // Should render more than viewport but less than total
        (0, _experimentalctreact.expect)(itemCount).toBeGreaterThan(5);
        (0, _experimentalctreact.expect)(itemCount).toBeLessThan(1000);
        // After scrolling, count should be similar
        await container.evaluate((el)=>{
            el.scrollTop = 2500;
        });
        // Wait for virtualization to update by checking that the expected item is visible
        await (0, _experimentalctreact.expect)(component.getByTestId('item-50')).toBeVisible();
        const itemCountAfterScroll = await component.locator('[role="listitem"]').count();
        (0, _experimentalctreact.expect)(itemCountAfterScroll).toBeGreaterThan(5);
        (0, _experimentalctreact.expect)(itemCountAfterScroll).toBeLessThan(1000);
    });
    (0, _experimentalctreact.test)('should handle small lists (no virtualization needed)', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 5
        }));
        // All items should be visible
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
        await (0, _experimentalctreact.expect)(component.getByTestId('item-1')).toBeVisible();
        await (0, _experimentalctreact.expect)(component.getByTestId('item-2')).toBeVisible();
        await (0, _experimentalctreact.expect)(component.getByTestId('item-3')).toBeVisible();
        await (0, _experimentalctreact.expect)(component.getByTestId('item-4')).toBeVisible();
    });
    (0, _experimentalctreact.test)('should render items with correct content', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 100
        }));
        const item0 = component.getByTestId('item-0');
        await (0, _experimentalctreact.expect)(item0).toContainText('Item 0');
        const item1 = component.getByTestId('item-1');
        await (0, _experimentalctreact.expect)(item1).toContainText('Item 1');
    });
    (0, _experimentalctreact.test)('should handle edge case at list boundaries', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 100
        }));
        const container = component.getByTestId('scroll-container');
        // Scroll to very bottom
        await container.evaluate((el)=>{
            el.scrollTop = el.scrollHeight - el.clientHeight;
        });
        // Wait for last item to appear
        await (0, _experimentalctreact.expect)(component.getByTestId('item-99')).toBeVisible();
        // Scroll to very top
        await container.evaluate((el)=>{
            el.scrollTop = 0;
        });
        // Wait for first item to reappear
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
    });
    (0, _experimentalctreact.test)('should start with empty list and prepend items without React key errors', async ({ mount, page })=>{
        // Listen for console errors
        const consoleErrors = [];
        page.on('console', (msg)=>{
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 0
        }));
        // Wait for initial render
        await (0, _experimentalctreact.expect)(component.getByTestId('scroll-container')).toBeVisible();
        // Initially, list should be empty
        await (0, _experimentalctreact.expect)(component.locator('[role="listitem"]')).toHaveCount(0);
        // Add first item
        await component.getByTestId('add-item-button').click();
        // Should have one item now
        const firstItem = component.getByTestId('item-0');
        await (0, _experimentalctreact.expect)(firstItem).toBeVisible();
        await (0, _experimentalctreact.expect)(firstItem).toHaveAttribute('data-value', '0');
        await (0, _experimentalctreact.expect)(firstItem).toContainText('Item 0');
        // Add second item (should be prepended)
        await component.getByTestId('add-item-button').click();
        // item-1 should now be first (prepended)
        const newFirstItem = component.getByTestId('item-1');
        await (0, _experimentalctreact.expect)(newFirstItem).toBeVisible();
        await (0, _experimentalctreact.expect)(newFirstItem).toHaveAttribute('data-value', '1');
        // item-0 should still be visible but below item-1
        await (0, _experimentalctreact.expect)(firstItem).toBeVisible();
        // Verify no React key reconciliation errors
        (0, _experimentalctreact.expect)(hasKeyErrors(consoleErrors)).toBe(false);
    });
    (0, _experimentalctreact.test)('should handle prepending multiple items without React key errors', async ({ mount, page })=>{
        const consoleErrors = [];
        page.on('console', (msg)=>{
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 0
        }));
        await (0, _experimentalctreact.expect)(component.getByTestId('scroll-container')).toBeVisible();
        // Add 10 items at once
        await component.getByTestId('add-multiple-button').click();
        // First visible item should be item-0 (the first of the 10 added)
        const firstItem = component.getByTestId('item-0');
        await (0, _experimentalctreact.expect)(firstItem).toBeVisible();
        await (0, _experimentalctreact.expect)(firstItem).toHaveAttribute('data-value', '0');
        // Should have items visible
        const itemsAfterFirst = await component.locator('[role="listitem"]').count();
        (0, _experimentalctreact.expect)(itemsAfterFirst).toBeGreaterThan(0);
        // Add 10 more items (should be prepended)
        await component.getByTestId('add-multiple-button').click();
        // Now item-10 should be first
        const newFirstItem = component.getByTestId('item-10');
        await (0, _experimentalctreact.expect)(newFirstItem).toBeVisible();
        await (0, _experimentalctreact.expect)(newFirstItem).toHaveAttribute('data-value', '10');
        // No key reconciliation errors
        (0, _experimentalctreact.expect)(hasKeyErrors(consoleErrors)).toBe(false);
    });
    (0, _experimentalctreact.test)('should correctly update when scrolled and items are prepended', async ({ mount })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerExample, {
            numItems: 50
        }));
        await (0, _experimentalctreact.expect)(component.getByTestId('scroll-container')).toBeVisible();
        // Wait for initial items to be rendered
        await (0, _experimentalctreact.expect)(component.getByTestId('item-0')).toBeVisible();
        // Scroll down
        const container = component.getByTestId('scroll-container');
        await container.evaluate((el)=>{
            el.scrollTop = 1000;
        });
        // Wait for scrolled items to appear
        await (0, _experimentalctreact.expect)(component.getByTestId('item-20')).toBeVisible();
        // Add more items while scrolled (prepend to top)
        await component.getByTestId('add-multiple-button').click();
        // Scroll back to top to see the newly prepended items
        await container.evaluate((el)=>{
            el.scrollTop = 0;
        });
        // Wait for new items to be visible at the top - item-50 is the first of the newly added 10 items
        await (0, _experimentalctreact.expect)(component.getByTestId('item-50')).toBeVisible();
        // Items should still render correctly
        const items = await component.locator('[role="listitem"]').count();
        (0, _experimentalctreact.expect)(items).toBeGreaterThan(0);
    });
});
_experimentalctreact.test.describe('ComboboxVirtualizer', ()=>{
    (0, _experimentalctreact.test)('should render combobox with virtualized options', async ({ mount, page })=>{
        const component = await mount(/*#__PURE__*/ _react.createElement(_VirtualizerExamplecomponentbrowserspec.VirtualizerComboboxExample, null));
        const combobox = component.getByRole('combobox');
        await (0, _experimentalctreact.expect)(combobox).toBeVisible();
        // Open combobox (this renders the options in a portal on document.body)
        await combobox.click();
        // Wait for the portal listbox to appear (use page-scoped locator)
        const optionsList = page.getByRole('listbox');
        await (0, _experimentalctreact.expect)(optionsList).toBeVisible();
        // First option should be visible (portal-scoped)
        await (0, _experimentalctreact.expect)(page.getByTestId('option-0')).toBeVisible();
        // Scroll down in the portal options list
        await optionsList.evaluate((el)=>{
            el.scrollTop = 500; // Scroll down
        });
        // An option further down should be visible (portal-scoped)
        await (0, _experimentalctreact.expect)(page.getByTestId('option-10')).toBeVisible();
        // click outside to close combobox — click the document body to ensure closing the portal
        await page.locator('body').click();
        // Combobox listbox should be hidden/removed from the page
        await (0, _experimentalctreact.expect)(page.getByRole('listbox')).toBeHidden();
        // Open combobox again
        await combobox.click();
        // Wait for portal listbox and first option again
        await (0, _experimentalctreact.expect)(page.getByRole('listbox')).toBeVisible();
        await (0, _experimentalctreact.expect)(page.getByTestId('option-0')).toBeVisible();
    });
});

//# sourceMappingURL=Virtualizer.component-browser-spec.js.map