# Home Page Structure & Section Widths

## Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FULL VIEWPORT WIDTH (100vw)                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        BeamsBackground (Full Screen)                    │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Hero Section                                 │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              Devello Inc Title                          │   │   │   │
│  │  │  │              (text-6xl to text-7xl)                     │   │   │   │
│  │  │  │              max-width: fit-content                    │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              Subtitle                                   │   │   │   │
│  │  │  │              max-width: 28rem (max-w-md)                │   │   │   │
│  │  │  │              mx-auto (centered)                      │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                Features Grid Section                          │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              Grid Container                              │   │   │   │
│  │  │  │              max-width: 80rem (max-w-7xl)              │   │   │   │
│  │  │  │              mx-auto (centered)                         │   │   │   │
│  │  │  │              px-4 sm:px-8 md:px-16 lg:px-16           │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │   │   │
│  │  │  │  │   Lighting  │ │  Assisted   │ │   General   │       │   │   │   │
│  │  │  │  │    Card     │ │    Edit     │ │    Edit     │       │   │   │   │
│  │  │  │  │             │ │    Card     │ │    Card     │       │   │   │   │
│  │  │  │  │ max-w-22rem │ │ max-w-22rem│ │ max-w-22rem │       │   │   │   │
│  │  │  │  │ sm:max-w-80 │ │ sm:max-w-80 │ │ sm:max-w-80 │       │   │   │   │
│  │  │  │  │ h-[500px]   │ │ h-[500px]   │ │ h-[500px]   │       │   │   │   │
│  │  │  │  └─────────────┘ └─────────────┘ └─────────────┘       │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  Grid: 1 col (mobile) → 2 cols (md) → 3 cols (lg)     │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Blog Section                               │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              Blog Container                               │   │   │   │
│  │  │  │              max-width: 80rem (max-w-7xl)              │   │   │   │
│  │  │  │              mx-auto (centered)                         │   │   │   │
│  │  │  │              px-4 sm:px-8 md:px-16 lg:px-16           │   │   │   │
│  │  │  │              py-8                                      │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │              Featured Post                      │   │   │   │   │
│  │  │  │  │              h-[400px] image                   │   │   │   │   │
│  │  │  │  │              lg:flex-row layout               │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │              More Posts Grid                    │   │   │   │   │
│  │  │  │  │              2 columns (md:grid-cols-2)         │   │   │   │   │
│  │  │  │  │              h-[250px] images                  │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │              Newsletter Section                 │   │   │   │   │
│  │  │  │  │              text-center                         │   │   │   │   │
│  │  │  │  │              pb-16                              │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Section Width Breakdown

### 1. **Hero Section**
- **Container**: Full width with centered content
- **Title**: `max-width: fit-content` (auto-sizing)
- **Subtitle**: `max-width: 28rem` (448px) with `mx-auto` centering
- **Padding**: `pt-32` (top padding)

### 2. **Features Grid Section**
- **Container**: `max-width: 80rem` (1280px) with `mx-auto` centering
- **Padding**: 
  - Mobile: `px-4` (16px)
  - Small: `sm:px-8` (32px)
  - Medium+: `md:px-16 lg:px-16` (64px)
- **Grid Layout**:
  - Mobile: `grid-cols-1` (single column)
  - Medium: `md:grid-cols-2` (two columns)
  - Large: `lg:grid-cols-3` (three columns)
- **Card Dimensions**:
  - Width: `max-w-[22rem] sm:max-w-80` (352px → 320px)
  - Height: `h-[500px]` (500px)
  - Gap: `gap-8 sm:gap-16` (32px → 64px)

### 3. **Blog Section**
- **Container**: `max-width: 80rem` (1280px) with `mx-auto` centering
- **Padding**: Same as Features Grid
- **Featured Post**: 
  - Image: `h-[400px]` (400px)
  - Layout: `lg:flex-row` (side-by-side on large screens)
- **More Posts Grid**: `md:grid-cols-2` (two columns on medium+)
  - Images: `h-[250px]` (250px)

### 4. **Newsletter Section**
- **Container**: Centered within Blog section
- **Padding**: `pb-16` (64px bottom)

## Responsive Breakpoints

- **Mobile**: `< 768px` - Single column, reduced padding
- **Small**: `768px - 1024px` - Two columns, medium padding
- **Large**: `> 1024px` - Three columns, full padding
- **iPad Pro Fix**: Special handling for `1024px` portrait mode

## Key Width Constraints

1. **Maximum Content Width**: 80rem (1280px)
2. **Card Maximum Width**: 22rem (352px) / 20rem (320px) on small screens
3. **Title Auto-sizing**: `max-width: fit-content`
4. **Subtitle Width**: 28rem (448px) maximum
5. **Full Viewport**: 100vw with horizontal scroll prevention

## Special Considerations

- **iPad Pro Fix**: Additional padding for 1024px portrait mode
- **Mobile Status Bar**: Safe area inset handling
- **Touch Device Detection**: Automatic hover state management
- **Background**: BeamsBackground covers full viewport
- **Overflow**: `overflow-x: hidden` prevents horizontal scrolling
