# Product Modal Layout Structure

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODAL CONTAINER (Fixed)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [X] Close Button (top-right)                              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              SCROLLABLE CONTENT AREA                  │  │  │
│  │  │  ┌──────────────────┐  ┌─────────────────────────────┐ │  │  │
│  │  │  │                │  │  PRODUCT DETAILS COLUMN     │ │  │  │
│  │  │  │                │  │                             │ │  │  │
│  │  │  │  PRODUCT IMAGE │  │  1. Product Name            │ │  │  │
│  │  │  │  (Left Column) │  │  2. Description             │ │  │  │
│  │  │  │                │  │  3. Craftsmanship Note      │ │  │  │
│  │  │  │  [4:3 aspect]  │  │  4. Variants Selection      │ │  │  │
│  │  │  │                │  │  5. Size Fields (H/W)       │ │  │  │
│  │  │  │                │  │  6. Quantity Selector       │ │  │  │
│  │  │  │                │  │  7. Price Display           │ │  │  │
│  │  │  │                │  │  8. Order Form (glass)     │ │  │  │
│  │  │  │                │  │  9. Shipping Info           │ │  │  │
│  │  │  │                │  │  10. Action Buttons         │ │  │  │
│  │  │  └──────────────────┘  └─────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Element Reference Map

### Main Structure
- **Container**: `product-modal-container` (line 372)
- **Modal Card**: `motion.div` with `about-devello-glass` (line 393)
- **Background**: `MeshGradient` (line 416)
- **Header**: Close button section (line 436)
- **Content**: Scrollable area (line 455)

### Grid Layout (line 456)
- **Grid**: `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8`
- **Left Column**: Product Image (line 458)
- **Right Column**: Product Details (line 470)

### Right Column Elements (in order):

1. **Product Name** (line 471)
   - Reference: `h2` with `text-2xl md:text-3xl`
   - Content: `{product.name}`

2. **Description** (line 475)
   - Reference: `p` with `text-sm md:text-base mb-4`
   - Conditional: Only if `product.description` exists

3. **Craftsmanship Note** (line 482)
   - Reference: `div` with `text-xs md:text-sm italic mb-4`
   - Content: "Each piece is handcrafted..."

4. **Variants Selection** (line 487)
   - Reference: `div` with `mb-4`
   - Conditional: Only if `hasVariants` is true
   - Contains: Label + variant buttons

5. **Size Fields** (line 537)
   - Reference: `div` with `mb-4`
   - Conditional: Only for windows/doors
   - Contains: Height and Width inputs

6. **Quantity Selector** (line 613)
   - Reference: `div` with `mb-4`
   - Contains: Decrement button, quantity display, increment button

7. **Price Display** (line 645)
   - Reference: `div` with `mb-4 p-3 rounded-xl`
   - Conditional: Hidden for glass/mirror
   - Contains: Price calculation display

8. **Glass/Mirror Order Form** (line 659)
   - Reference: Conditional block starting at line 659
   - Conditional: Only for glass/mirror products
   - Contains: Email, Phone, Requirements textarea, Shipping info

9. **Shipping Information** (line 763)
   - Reference: `div` with `mb-4 p-3 rounded-xl`
   - Conditional: Only for non-glass/mirror products

10. **Action Buttons** (line 776)
    - Reference: Conditional block
    - For glass/mirror: Single "Place Order" button
    - For others: "Add to Cart" + "Buy Now" buttons

## How to Reference Elements for Moving

### Format for Commands:
```
Move [ELEMENT_NAME] [DIRECTION] [RELATIVE_TO_ELEMENT]
```

### Element Names (use these exact names):
- `product-name` - Product title
- `description` - Product description text
- `craftsmanship-note` - Handcrafted note
- `variants-selection` - Material/variant selector
- `size-fields` - Height/Width inputs
- `quantity-selector` - Quantity controls
- `price-display` - Price section
- `order-form` - Glass/mirror form
- `shipping-info` - Shipping information
- `action-buttons` - Add to Cart / Buy Now buttons
- `product-image` - Left column image

### Directions:
- `above` - Move before another element
- `below` - Move after another element
- `left-of` - Move to left column (swap with image)
- `right-of` - Move to right column
- `swap-with` - Swap positions with another element

### Examples:
- "Move `craftsmanship-note` above `product-name`"
- "Move `variants-selection` below `action-buttons`"
- "Move `product-image` right-of `product-details`" (swap columns)
- "Move `size-fields` above `variants-selection`"
- "Move `price-display` below `quantity-selector`"

## Current Order (Right Column):
1. Product Name
2. Description
3. Craftsmanship Note
4. Variants Selection
5. Size Fields (conditional)
6. Quantity Selector
7. Price Display (conditional)
8. Order Form (conditional - glass/mirror)
9. Shipping Info (conditional - non-glass/mirror)
10. Action Buttons

## Line Number Reference:
- Product Image: 458-467
- Product Name: 471-473
- Description: 475-479
- Craftsmanship Note: 482-484
- Variants: 487-534
- Size Fields: 537-610
- Quantity: 613-642
- Price: 645-656
- Order Form: 659-760
- Shipping Info: 763-773
- Action Buttons: 776-841
