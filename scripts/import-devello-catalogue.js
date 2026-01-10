const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to create slug from name
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Helper to convert price string to cents
const priceToCents = (priceStr) => {
  // Remove $ and commas, convert to number, then to cents
  const num = parseFloat(priceStr.replace(/[$,]/g, ''));
  return Math.round(num * 100);
};

const develloProducts = [
  // Windows
  {
    productId: 'W-001',
    name: 'Double Hung Window',
    description: 'Classic double-hung window for straightforward replacements and new builds.',
    slug: createSlug('Double Hung Window'),
    category: 'windows',
    referenceSize: 'Up to 36" × 60"',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_674f13ba5b9343e98d2884e86cfd80b8~mv2.jpg',
    highlights: [
      'Reliable double-hung action for easy installs',
      'Balanced for smooth lifts',
      'Low-maintenance frame options'
    ],
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 63000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_674f13ba5b9343e98d2884e86cfd80b8~mv2.jpg',
        notes: 'Slim aluminum frame, black finish'
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 51000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_674f13ba5b9343e98d2884e86cfd80b8~mv2.jpg',
        notes: 'Dark bronze finish'
      }
    ]
  },
  {
    productId: 'W-002',
    name: 'Sliding Window',
    description: 'Smooth sliding window for wide openings and clean sightlines.',
    slug: createSlug('Sliding Window'),
    category: 'windows',
    referenceSize: 'Up to 48" × 60"',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_0316f6094f444f96ba88d40ba28d6152~mv2.jpg',
    highlights: [
      'Glides easily on modern tracks',
      'Great for kitchens and condos',
      'Maximizes daylight with wide glass'
    ],
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 73000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_0316f6094f444f96ba88d40ba28d6152~mv2.jpg',
        notes: 'Black aluminum frame finish'
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 61000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_0316f6094f444f96ba88d40ba28d6152~mv2.jpg',
        notes: 'Dark bronze finish'
      }
    ]
  },
  {
    productId: 'W-003',
    name: 'Double Hung Window',
    description: 'Two operable sashes for flexible ventilation and classic looks.',
    slug: createSlug('Double Hung Window'),
    category: 'windows',
    referenceSize: 'Up to 36" × 60"',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9b6abd3e512e4feab166baeace69a8ec~mv2.jpg',
    highlights: [
      'Both sashes tilt for easy cleaning',
      'Balanced for smooth travel',
      'Timeless profile for most elevations'
    ],
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 65000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9b6abd3e512e4feab166baeace69a8ec~mv2.jpg',
        notes: 'Black aluminum frame finish'
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 53000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9b6abd3e512e4feab166baeace69a8ec~mv2.jpg',
        notes: 'Dark bronze finish'
      }
    ]
  },
  {
    productId: 'W-004',
    name: 'French-Door Paneled Glass Window',
    description: 'French-door style panelled glass window for statement openings.',
    slug: createSlug('French-Door Paneled Glass Window'),
    category: 'windows',
    referenceSize: 'Custom sizes available',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_04d0213c4c4d437ab5858126467ed417~mv2.jpg',
    highlights: [
      'French-door inspired grille layout',
      'Great for balconies and Juliet setups',
      'Lets in light while keeping classic lines'
    ],
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum + glass',
        price: 280000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_04d0213c4c4d437ab5858126467ed417~mv2.jpg',
        notes: 'Black finish, aluminum frame'
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum + glass',
        price: 228300,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_04d0213c4c4d437ab5858126467ed417~mv2.jpg',
        notes: 'Dark bronze finish'
      }
    ]
  },
  {
    productId: 'W-005',
    name: 'Panelled Double-Hung Window',
    description: 'Double-hung window with panelled glass for a traditional aesthetic.',
    slug: createSlug('Panelled Double-Hung Window'),
    category: 'windows',
    referenceSize: 'Up to 36" × 60"',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_fcbe98bfa8bd4b0888544d41d167d202~mv2.jpg',
    highlights: [
      'Panelled glass detail for classic projects',
      'Both sashes operable for flexible ventilation',
      'Works in brownstones and restorations'
    ],
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum + paneled glass',
        price: 71000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_fcbe98bfa8bd4b0888544d41d167d202~mv2.jpg',
        notes: 'Black aluminum frame, paneled glass'
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum + paneled glass',
        price: 59000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_fcbe98bfa8bd4b0888544d41d167d202~mv2.jpg',
        notes: 'Dark bronze finish'
      }
    ]
  },
  {
    productId: 'W-006',
    name: 'Casement Window',
    description: 'Outward-opening casement window for maximum airflow and tight seals.',
    slug: createSlug('Casement Window'),
    category: 'windows',
    referenceSize: 'Up to 30" × 60"',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b3a6aefcb7c74aef942eb70d8fe09e61~mv2.jpg',
    highlights: [
      'Full leaf opening for strong ventilation',
      'Multi-point lock for tighter seal',
      'Clean modern sightlines'
    ],
    variants: [
      {
        name: 'Black Aluminum Frame',
        material: 'Aluminum',
        price: 120000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b3a6aefcb7c74aef942eb70d8fe09e61~mv2.jpg',
        notes: 'Black finish, aluminum frame'
      },
      {
        name: 'Dark Bronze',
        material: 'Aluminum',
        price: 105000,
        imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b3a6aefcb7c74aef942eb70d8fe09e61~mv2.jpg',
        notes: 'Dark bronze finish'
      }
    ]
  },
  // Doors
  {
    productId: 'D-001',
    name: 'Flush Oak Door',
    description: 'Flush oak veneer door for warm, modern interiors.',
    slug: createSlug('Flush Oak Door'),
    category: 'doors',
    referenceSize: '30" × 80", 1-3/8" thick',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_80e538b485804704a1814d581189b0dc~mv2.jpg',
    highlights: [
      'Natural oak veneer, clean flush face',
      'Pairs with minimalist hardware',
      'Ready for stain or clear finish'
    ],
    variants: [
      {
        name: 'Hollow Core Oak',
        material: 'Oak veneer on hollow core',
        price: 70000,
        notes: 'Lightweight, cost-effective'
      },
      {
        name: 'Solid Core Oak',
        material: 'Oak veneer on solid core',
        price: 85000,
        notes: 'Better sound control, premium feel'
      }
    ]
  },
  {
    productId: 'D-002',
    name: 'Laminated Glass Door',
    description: 'Laminated glass door for bright interiors and privacy options.',
    slug: createSlug('Laminated Glass Door'),
    category: 'doors',
    referenceSize: '30" × 80", 1-3/8" thick',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_e3d5cc811e0e4e98932fa254806fb9c7~mv2.jpg',
    highlights: [
      'Laminated glass for safety and sound',
      'Great for offices and interior partitions',
      'Choose clear, frosted, or tinted lites'
    ],
    variants: [
      {
        name: 'Clear Laminate',
        material: 'Laminated safety glass',
        price: 85000,
        notes: 'Maximum light transfer'
      },
      {
        name: 'Frosted Laminate',
        material: 'Frosted laminated glass',
        price: 95000,
        notes: 'Privacy-friendly'
      }
    ]
  },
  {
    productId: 'D-003',
    name: 'Flush Walnut Door',
    description: 'Flush walnut veneer door for upscale, modern projects.',
    slug: createSlug('Flush Walnut Door'),
    category: 'doors',
    referenceSize: '30" × 80", 1-3/8" thick',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_643758ddc31949998fb1c6f3d1952f9e~mv2.jpg',
    highlights: [
      'Rich walnut veneer for premium interiors',
      'Pairs with matte black or brass hardware',
      'Clean, modern slab profile'
    ],
    variants: [
      {
        name: 'Hollow Core Walnut',
        material: 'Walnut veneer on hollow core',
        price: 70000,
        notes: 'Lightweight install'
      },
      {
        name: 'Solid Core Walnut',
        material: 'Walnut veneer on solid core',
        price: 90000,
        notes: 'Premium heft and acoustics'
      }
    ]
  },
  {
    productId: 'D-004',
    name: 'Flush White Door',
    description: 'White flush door ready for paint or install-as-is in minimalist spaces.',
    slug: createSlug('Flush White Door'),
    category: 'doors',
    referenceSize: '30" × 80", 1-3/8" thick',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_3a07935dc916444b9b6860b1d9b9b6d3~mv2.jpg',
    highlights: [
      'Smooth face, paint-ready finish',
      'Pairs with modern casing sets',
      'Great for rentals and modern flips'
    ],
    variants: [
      {
        name: 'Hollow Core White',
        material: 'Primed slab',
        price: 32000,
        notes: 'Lightweight, easy to hang'
      },
      {
        name: 'Solid Core White',
        material: 'Solid core primed',
        price: 51000,
        notes: 'Better acoustics and feel'
      }
    ]
  },
  {
    productId: 'D-005',
    name: '6 Panel Door',
    description: 'Traditional 6-panel profile for classic interiors and renovations.',
    slug: createSlug('6 Panel Door'),
    category: 'doors',
    referenceSize: '30" × 80", 1-3/8" thick',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9627a094bb1b4cd8ab7d41d67fbaef9d~mv2.jpg',
    highlights: [
      'Raised 6-panel profile',
      'Works in traditional and colonial styles',
      'Pre-primed and ready for paint'
    ],
    variants: [
      {
        name: 'MDF 6 Panel',
        material: 'Primed MDF',
        price: 38000,
        notes: 'Paint-grade, everyday use'
      },
      {
        name: 'Solid Wood 6 Panel',
        material: 'Pine/Poplar',
        price: 54000,
        notes: 'Stain or paint options'
      }
    ]
  },
  {
    productId: 'D-006',
    name: '2 Panel Door',
    description: 'Clean two-panel layout for versatile interiors.',
    slug: createSlug('2 Panel Door'),
    category: 'doors',
    referenceSize: '30" × 80", 1-3/8" thick',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_ee08d6c5fbc049c986ed5b0886cf5d25~mv2.jpg',
    highlights: [
      'Simple two-panel design',
      'Good fit for transitional styles',
      'Paint-ready surface'
    ],
    variants: [
      {
        name: 'MDF 2 Panel',
        material: 'Primed MDF',
        price: 34000,
        notes: 'Lightweight, quick install'
      },
      {
        name: 'Solid Core 2 Panel',
        material: 'Solid core',
        price: 52000,
        notes: 'Heavier feel, better sound control'
      }
    ]
  },
  {
    productId: 'D-007',
    name: 'Metal Patio Door',
    description: 'Durable metal patio door with large glass area for indoor-outdoor flow.',
    slug: createSlug('Metal Patio Door'),
    category: 'doors',
    referenceSize: '72" × 80" set',
    pricingNotes: '',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_d1e7fc8b68ce4e4fa65bc326b16b0c6a~mv2.jpg',
    highlights: [
      'Thermally broken metal frame',
      'Large glass for maximum daylight',
      'Great for decks and terraces'
    ],
    variants: [
      {
        name: 'Standard Metal Patio',
        material: 'Aluminum + glass',
        price: 220000,
        notes: 'Dual-pane glass, standard hardware'
      },
      {
        name: 'Premium Metal Patio',
        material: 'Aluminum + low-E glass',
        price: 220000,
        notes: 'Upgraded hardware and glass package'
      }
    ]
  },
  // Millwork
  {
    productId: 'M-101',
    name: 'Metro Casing',
    description: 'Door & Window Trim. Profile: 2-½" flat stock with eased edges (modern, minimal). All Devello millwork is supplied pre-primed, in long lengths to minimize joints, and can be coordinated with your door package for a complete room finish.',
    slug: 'metro-casing',
    category: 'millwork',
    referenceSize: 'Per linear foot',
    pricingNotes: 'Priced per linear foot',
    highlights: [
      'Modern, minimal profile',
      'Pre-primed and ready for paint',
      'Long lengths to minimize joints'
    ],
    variants: [
      {
        name: 'MDF Primed',
        material: 'MDF',
        price: 275,
        notes: 'Per linear foot'
      },
      {
        name: 'Poplar Primed',
        material: 'Poplar',
        price: 450,
        notes: 'Per linear foot'
      }
    ]
  },
  {
    productId: 'M-201',
    name: 'Tall Baseboard',
    description: 'Profile: 5-½" square with small top bevel. All Devello millwork is supplied pre-primed, in long lengths to minimize joints, and can be coordinated with your door package for a complete room finish.',
    slug: 'tall-baseboard',
    category: 'millwork',
    referenceSize: 'Per linear foot',
    pricingNotes: 'Priced per linear foot',
    highlights: [
      '5-½" height for modern proportions',
      'Pre-primed and ready for paint',
      'Long lengths to minimize joints'
    ],
    variants: [
      {
        name: 'MDF Primed',
        material: 'MDF',
        price: 325,
        notes: 'Per linear foot'
      },
      {
        name: 'Poplar Primed',
        material: 'Poplar',
        price: 550,
        notes: 'Per linear foot'
      }
    ]
  },
  {
    productId: 'M-301',
    name: 'Soft Crown',
    description: 'Profile: 4-¼" cove crown for 8–9 ft ceilings. All Devello millwork is supplied pre-primed, in long lengths to minimize joints, and can be coordinated with your door package for a complete room finish.',
    slug: 'soft-crown',
    category: 'millwork',
    referenceSize: 'Per linear foot',
    pricingNotes: 'Priced per linear foot',
    highlights: [
      '4-¼" cove crown for 8–9 ft ceilings',
      'Pre-primed and ready for paint',
      'Long lengths to minimize joints'
    ],
    variants: [
      {
        name: 'MDF Primed',
        material: 'MDF',
        price: 375,
        notes: 'Per linear foot'
      },
      {
        name: 'Poplar Primed',
        material: 'Poplar',
        price: 650,
        notes: 'Per linear foot'
      }
    ]
  }
];

// Glass & Mirrors Products
const glassMirrorsProducts = [
  {
    productId: 'GM-001',
    name: 'Gold Mirror',
    description: 'Premium gold-finished mirror for elegant interiors. Perfect for bathrooms, bedrooms, and dressing areas. Adds luxury and sophistication to any space.',
    slug: createSlug('Gold Mirror'),
    category: 'mirrors',
    referenceSize: 'Custom sizing available',
    pricingNotes: 'Starting from $1600',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_ace24880b53d45c69921fe3f65d9cf93~mv2.jpg',
    highlights: [
      'Premium gold finish',
      'Elegant and sophisticated design',
      'Perfect for luxury interiors',
      'Custom sizing available'
    ],
    variants: [
      {
        name: 'Standard Gold Mirror',
        material: 'Gold-finished mirror',
        price: 160000,
        notes: 'Starting price, custom sizing available'
      }
    ]
  },
  {
    productId: 'GM-002',
    name: 'Fluted Glass',
    description: 'Textured fluted glass panels for modern interiors. Perfect for partitions, doors, and decorative features. Provides privacy while maintaining light flow.',
    slug: createSlug('Fluted Glass'),
    category: 'glass',
    referenceSize: 'Custom sizing available',
    pricingNotes: 'Starting from $850',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_317f077e5f92498d9e57072ab871882f~mv2.jpg',
    highlights: [
      'Modern fluted texture',
      'Privacy with light transmission',
      'Perfect for partitions and doors',
      'Custom sizing available'
    ],
    variants: [
      {
        name: 'Fluted Glass Panel',
        material: 'Textured fluted glass',
        price: 85000,
        notes: 'Starting price, custom sizing available'
      }
    ]
  },
  {
    productId: 'GM-003',
    name: 'Regular Mirror',
    description: 'Standard mirror for everyday use. Perfect for bathrooms, bedrooms, and functional spaces. Affordable and reliable.',
    slug: createSlug('Regular Mirror'),
    category: 'mirrors',
    referenceSize: 'Custom sizing available',
    pricingNotes: 'Starting from $200',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_2231b3370ad64f87ab9db2320aeadd54~mv2.jpg',
    highlights: [
      'Affordable and reliable',
      'Perfect for everyday use',
      'Custom sizing available',
      'Standard mirror quality'
    ],
    variants: [
      {
        name: 'Standard Mirror',
        material: 'Silver-backed mirror',
        price: 20000,
        notes: 'Starting price, custom sizing available'
      }
    ]
  },
  {
    productId: 'GM-004',
    name: 'Shower Glass Door',
    description: 'Modern frameless shower glass door for contemporary bathrooms. Sleek design with excellent functionality. Custom sizing available.',
    slug: createSlug('Shower Glass Door'),
    category: 'glass',
    referenceSize: 'Custom sizing available',
    pricingNotes: 'Starting from $1400',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9b40fc005f844942ab01b4ba485b28b8~mv2.jpg',
    highlights: [
      'Frameless modern design',
      'Perfect for contemporary bathrooms',
      'Custom sizing available',
      'Excellent functionality'
    ],
    variants: [
      {
        name: 'Frameless Shower Door',
        material: 'Tempered safety glass',
        price: 140000,
        notes: 'Starting price, custom sizing available'
      }
    ]
  },
  {
    productId: 'GM-005',
    name: 'Sliding Glass Paneled Shower Door',
    description: 'Sliding glass paneled shower door with elegant design. Space-saving sliding mechanism perfect for modern bathrooms.',
    slug: createSlug('Sliding Glass Paneled Shower Door'),
    category: 'glass',
    referenceSize: 'Custom sizing available',
    pricingNotes: 'Starting from $1600',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_2c16e8134e1341a186f4f3f95412d4f6~mv2.jpg',
    highlights: [
      'Sliding panel design',
      'Space-saving mechanism',
      'Elegant paneled look',
      'Perfect for modern bathrooms'
    ],
    variants: [
      {
        name: 'Sliding Paneled Door',
        material: 'Tempered safety glass',
        price: 160000,
        notes: 'Starting price, custom sizing available'
      }
    ]
  },
  {
    productId: 'GM-006',
    name: 'Corner Shower Glass Door',
    description: 'Corner shower glass door designed for corner installations. Maximizes space efficiency while maintaining elegant design.',
    slug: createSlug('Corner Shower Glass Door'),
    category: 'glass',
    referenceSize: 'Custom sizing available',
    pricingNotes: 'Starting from $1300',
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_d39adaa7ffc043d5946b2772dc7f3e9e~mv2.jpg',
    highlights: [
      'Corner installation design',
      'Space-efficient',
      'Elegant frameless look',
      'Perfect for corner showers'
    ],
    variants: [
      {
        name: 'Corner Shower Door',
        material: 'Tempered safety glass',
        price: 130000,
        notes: 'Starting price, custom sizing available'
      }
    ]
  }
];

// Build a House Bundle Products (organized by space)
const bundleProducts = [
  // Windows
  {
    productId: 'BH-W1',
    name: 'Double-Hung Window (House Pack)',
    description: 'Based on W-101 Metro Double-Hung. Sold per opening, with quantity guides: 2BR apt: ~8–10 openings, 3BR townhouse: ~14–18 openings.',
    slug: 'double-hung-window-house-pack',
    category: 'bundles',
    subCategory: 'windows',
    baseProductId: 'W-101',
    startingPrice: 32500
  },
  {
    productId: 'BH-W2',
    name: 'Feature Bay / Picture Window',
    description: 'Based on W-301 Brownstone Bay. "One bay window per living room" concept.',
    slug: 'feature-bay-picture-window',
    category: 'bundles',
    subCategory: 'living-room',
    baseProductId: 'W-301',
    startingPrice: 165000
  },
  {
    productId: 'BH-W3',
    name: 'Specialty Window Options',
    description: 'Awning windows for bathrooms/kitchens. Fixed clerestory or transom strips.',
    slug: 'specialty-window-options',
    category: 'bundles',
    subCategory: 'windows',
    startingPrice: 29500
  },
  // Doors
  {
    productId: 'BH-D1',
    name: 'Interior Passage Door Pack',
    description: 'Based on D-101 Essential Flat Panel. Quantity guidelines: 2BR: ~6–8 interior doors, 3BR house: ~10–14 interior doors. Mix of hollow-core (closets), solid-core (bedrooms/baths).',
    slug: 'interior-passage-door-pack',
    category: 'bundles',
    subCategory: 'doors',
    baseProductId: 'D-101',
    startingPrice: 8900
  },
  {
    productId: 'BH-D2',
    name: 'Quiet Bedroom Upgrade Pack',
    description: 'Based on D-201 Shaker Solid-Core. For bedrooms + home office.',
    slug: 'quiet-bedroom-upgrade-pack',
    category: 'bundles',
    subCategory: 'doors',
    baseProductId: 'D-201',
    startingPrice: 22000
  },
  {
    productId: 'BH-D3',
    name: 'Exterior Door Set',
    description: '1× Townhouse Entry Door (D-301). Optional rear entry / garden door (can be a solid core or exterior-rated glazed door).',
    slug: 'exterior-door-set',
    category: 'bundles',
    subCategory: 'doors',
    baseProductId: 'D-301',
    startingPrice: 79500
  },
  // Hallways
  {
    productId: 'BH-M1',
    name: 'Casing Pack',
    description: 'Enough M-101 casing for all doors & windows in a 2BR/3BR configuration. Offer as "per house" bundles: 2BR: ~250–300 lf, 3BR: ~350–450 lf.',
    slug: 'casing-pack',
    category: 'bundles',
    subCategory: 'hallways',
    baseProductId: 'M-101',
    startingPrice: 275
  },
  {
    productId: 'BH-M2',
    name: 'Baseboard Pack',
    description: 'M-201 baseboard for all public and private rooms. 2BR: ~250–350 lf, 3BR house: ~400–600 lf.',
    slug: 'baseboard-pack',
    category: 'bundles',
    subCategory: 'hallways',
    baseProductId: 'M-201',
    startingPrice: 325
  },
  {
    productId: 'BH-M3',
    name: 'Crown Moulding Pack (Optional)',
    description: 'Crown for living/dining + primary bedroom. Sold room-by-room: "Crown for 12\' × 16\' room – from $260 in MDF".',
    slug: 'crown-moulding-pack',
    category: 'bundles',
    subCategory: 'living-room',
    baseProductId: 'M-301',
    startingPrice: 375
  },
  {
    productId: 'BH-F1',
    name: 'Engineered Hardwood Flooring',
    description: '7–8" wide planks, matte finish. Starting at: $6.50–$8.50 / sq ft material.',
    slug: 'engineered-hardwood-flooring',
    category: 'bundles',
    subCategory: 'living-room',
    startingPrice: 650
  },
  {
    productId: 'BH-F2',
    name: 'Tile Package (Bath / Kitchen)',
    description: '24" × 24" porcelain floor tile. 3" × 12" subway wall tile. Starting at: $4.00–$7.00 / sq ft material.',
    slug: 'tile-package-bath-kitchen',
    category: 'bundles',
    subCategory: 'bathroom',
    startingPrice: 400
  },
  {
    productId: 'BH-F3',
    name: 'Stair Components',
    description: 'Treads, risers, stringers, handrail kits (if applicable).',
    slug: 'stair-components',
    category: 'bundles',
    startingPrice: 0
  },
  {
    productId: 'BH-L1',
    name: 'Recessed Downlight Kit',
    description: '4" or 6" LED, dimmable, IC-rated. Sold per fixture; house packs by room count. Starting at: $35 / fixture (trim + housing).',
    slug: 'recessed-downlight-kit',
    category: 'bundles',
    subCategory: 'living-room',
    startingPrice: 3500
  },
  {
    productId: 'BH-L2',
    name: 'Surface Fixture Pack',
    description: 'Flush-mounts for bedrooms & hallway. Decorative pendants for kitchen island and dining.',
    slug: 'surface-fixture-pack',
    category: 'bundles',
    subCategory: 'hallways',
    startingPrice: 0
  },
  {
    productId: 'BH-E1',
    name: 'Device & Dimmer Pack',
    description: 'Modern Decora switches, dimmers, GFCI outlets. Bundle per room or per house ("2BR Electrical Trim Kit").',
    slug: 'device-dimmer-pack',
    category: 'bundles',
    startingPrice: 0
  },
  // Kitchen
  {
    productId: 'BH-K1',
    name: 'Kitchen Appliance Opening Package',
    description: 'Not appliances, but cabinet & rough opening spec package (dishwasher, range, fridge).',
    slug: 'kitchen-appliance-opening-package',
    category: 'bundles',
    subCategory: 'kitchen',
    startingPrice: 0
  },
  {
    productId: 'BH-K2',
    name: 'Cabinetry Line',
    description: 'Partner-sourced. Flat panel or Shaker doors. Standard module widths (12", 18", 24", 30", 36").',
    slug: 'cabinetry-line',
    category: 'bundles',
    subCategory: 'kitchen',
    startingPrice: 0
  },
  // Bathroom
  {
    productId: 'BH-B1',
    name: 'Bath Suite Package',
    description: 'Vanity + sink + faucet. Toilet + accessories. Tub/shower set.',
    slug: 'bath-suite-package',
    category: 'bundles',
    subCategory: 'bathroom',
    startingPrice: 0
  },
  {
    productId: 'BH-H1',
    name: 'Interior Door Hardware Set',
    description: 'Lever handle, latch, hinges, strike. One SKU per style (matte black, brushed nickel, etc.).',
    slug: 'interior-door-hardware-set',
    category: 'bundles',
    subCategory: 'doors',
    startingPrice: 0
  },
  {
    productId: 'BH-H2',
    name: 'Exterior Hardware & Smart Lock Kit',
    description: 'Handleset + smart deadbolt for D-301.',
    slug: 'exterior-hardware-smart-lock-kit',
    category: 'bundles',
    subCategory: 'doors',
    baseProductId: 'D-301',
    startingPrice: 0
  }
];

async function main() {
  console.log('Importing Devello Core Catalogue...\n');

  // Clean up old window and door products
  console.log('Cleaning up old window and door products...\n');
  const validWindowSlugs = develloProducts.filter(p => p.category === 'windows').map(p => p.slug);
  const validDoorSlugs = develloProducts.filter(p => p.category === 'doors').map(p => p.slug);
  
  // Find and delete old windows that aren't in the new list
  const oldWindows = await prisma.product.findMany({
    where: {
      metadata: {
        path: ['category'],
        equals: 'windows'
      },
      slug: {
        notIn: validWindowSlugs
      }
    }
  });

  // Find and delete old doors that aren't in the new list
  const oldDoors = await prisma.product.findMany({
    where: {
      metadata: {
        path: ['category'],
        equals: 'doors'
      },
      slug: {
        notIn: validDoorSlugs
      }
    }
  });

  // Delete old products
  for (const oldProduct of [...oldWindows, ...oldDoors]) {
    await prisma.product.delete({
      where: { id: oldProduct.id }
    });
    console.log(`Deleted old product: ${oldProduct.name} (${oldProduct.slug})`);
  }

  if (oldWindows.length > 0 || oldDoors.length > 0) {
    console.log(`\nDeleted ${oldWindows.length + oldDoors.length} old products.\n`);
  }

  // Clean up old glass and mirrors products
  console.log('Cleaning up old glass and mirrors products...\n');
  const validGlassMirrorSlugs = glassMirrorsProducts.map(p => p.slug);
  
  // Find and delete old glass/mirrors that aren't in the new list
  const oldGlassMirrors = await prisma.product.findMany({
    where: {
      OR: [
        {
          metadata: {
            path: ['category'],
            equals: 'glass'
          }
        },
        {
          metadata: {
            path: ['category'],
            equals: 'mirrors'
          }
        }
      ],
      slug: {
        notIn: validGlassMirrorSlugs
      }
    }
  });

  // Delete old glass/mirrors products
  for (const oldProduct of oldGlassMirrors) {
    await prisma.product.delete({
      where: { id: oldProduct.id }
    });
    console.log(`Deleted old glass/mirror product: ${oldProduct.name} (${oldProduct.slug})`);
  }

  if (oldGlassMirrors.length > 0) {
    console.log(`\nDeleted ${oldGlassMirrors.length} old glass/mirror products.\n`);
  }

  // Import glass & mirrors products
  for (const product of glassMirrorsProducts) {
    try {
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        console.log(`Product ${product.productId} (${product.slug}) already exists, updating...`);
        
        const minPrice = Math.min(...product.variants.map(v => v.price));
        
        await prisma.product.update({
          where: { slug: product.slug },
          data: {
            name: product.name,
            description: product.description,
            image_url: product.imageUrl || null,
            price: minPrice,
            currency: 'usd',
            product_type: 'one_time',
            status: 'active',
            metadata: {
              category: product.category,
              productId: product.productId,
              variants: product.variants,
              referenceSize: product.referenceSize,
              pricingNotes: product.pricingNotes,
              highlights: product.highlights
            }
          }
        });
        console.log(`Updated: ${product.name} (${product.productId})`);
      } else {
        const minPrice = Math.min(...product.variants.map(v => v.price));
        
        await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            slug: product.slug,
            image_url: product.imageUrl || null,
            price: minPrice,
            currency: 'usd',
            product_type: 'one_time',
            status: 'active',
            metadata: {
              category: product.category,
              productId: product.productId,
              variants: product.variants,
              referenceSize: product.referenceSize,
              pricingNotes: product.pricingNotes,
              highlights: product.highlights
            }
          }
        });
        console.log(`Created: ${product.name} (${product.productId})`);
      }
    } catch (error) {
      console.error(`Error processing ${product.productId}:`, error);
    }
  }

  // Import core products
  for (const product of develloProducts) {
    try {
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        console.log(`Product ${product.productId} (${product.slug}) already exists, updating...`);
        
        const minPrice = Math.min(...product.variants.map(v => v.price));
        
        await prisma.product.update({
          where: { slug: product.slug },
          data: {
            name: product.name,
            description: product.description,
            image_url: product.imageUrl || null,
            price: minPrice,
            currency: 'usd',
            product_type: 'one_time',
            status: 'active',
            metadata: {
              category: product.category,
              productId: product.productId,
              variants: product.variants,
              referenceSize: product.referenceSize,
              pricingNotes: product.pricingNotes,
              highlights: product.highlights
            }
          }
        });
        console.log(`Updated: ${product.name} (${product.productId})`);
      } else {
        const minPrice = Math.min(...product.variants.map(v => v.price));
        
        await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            slug: product.slug,
            image_url: product.imageUrl || null,
            price: minPrice,
            currency: 'usd',
            product_type: 'one_time',
            status: 'active',
            metadata: {
              category: product.category,
              productId: product.productId,
              variants: product.variants,
              referenceSize: product.referenceSize,
              pricingNotes: product.pricingNotes,
              highlights: product.highlights
            }
          }
        });
        console.log(`Created: ${product.name} (${product.productId})`);
      }
    } catch (error) {
      console.error(`Error processing ${product.productId}:`, error);
    }
  }

  console.log('\nImporting Build a House Bundle Products...\n');

  // Import bundle products
  for (const bundle of bundleProducts) {
    try {
      const existing = await prisma.product.findUnique({
        where: { slug: bundle.slug },
      });

      if (existing) {
        console.log(`Bundle ${bundle.productId} (${bundle.slug}) already exists, updating...`);
        
        await prisma.product.update({
          where: { slug: bundle.slug },
          data: {
            name: bundle.name,
            description: bundle.description,
            price: bundle.startingPrice,
            currency: 'usd',
            product_type: 'service',
            status: 'active',
            metadata: {
              category: bundle.category,
              productId: bundle.productId,
              baseProductId: bundle.baseProductId || null,
              subCategory: bundle.subCategory || null,
              isBundle: true
            }
          }
        });
        console.log(`Updated: ${bundle.name} (${bundle.productId})`);
      } else {
        await prisma.product.create({
          data: {
            name: bundle.name,
            description: bundle.description,
            slug: bundle.slug,
            price: bundle.startingPrice,
            currency: 'usd',
            product_type: 'service',
            status: 'active',
            metadata: {
              category: bundle.category,
              productId: bundle.productId,
              baseProductId: bundle.baseProductId || null,
              subCategory: bundle.subCategory || null,
              isBundle: true
            }
          }
        });
        console.log(`Created: ${bundle.name} (${bundle.productId})`);
      }
    } catch (error) {
      console.error(`Error processing bundle ${bundle.productId}:`, error);
    }
  }

  console.log('\nFinished importing Devello Core Catalogue!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

