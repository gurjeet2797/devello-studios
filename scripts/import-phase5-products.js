const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to create slug from name
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Helper to convert price to cents
const priceToCents = (price) => {
  return Math.round(price * 100);
};

// Lighting Products
const lightingProducts = [
  // Overhead / Ceiling Fixtures
  {
    productId: 'L-001',
    name: 'Echo Chandelier',
    description: 'A stunning sculptural chandelier featuring asymmetrical solid steel cylinders in muted white, each capped with a Tala Sphere IV LED bulb. This piece acts as functional art, bringing sculptural elegance and high-quality light to interior spaces.',
    slug: 'echo-chandelier',
    category: 'lighting',
    subCategory: 'overhead-fixtures',
    brand: 'Tala',
    finish: 'Powder-coated Matte White',
    dimensions: { width: '19.3"', depth: '17.7"', height: '11.8"', maxHang: "16' adjustable" },
    vendorUrl: 'https://talalighting.com',
    msrp: 130000,
    price: 182000, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_e319ad17263e47808703e54c5c773449~mv2.webp',
  },
  {
    productId: 'L-002',
    name: 'Nine Pendant Cluster (Walnut + Sphere IV)',
    description: 'A dramatic cluster pendant featuring nine oversized Sphere IV LED bulbs suspended from a single canopy, each attached to a Walnut wood pendant socket. The effect is a luminous cascade that adds instant wow-factor to foyers, stairwells or dining areas.',
    slug: 'nine-pendant-cluster-walnut',
    category: 'lighting',
    subCategory: 'overhead-fixtures',
    brand: 'Tala',
    finish: 'Walnut veneer with white canopy',
    dimensions: { canopy: '20" round', pendants: '1.5" × 3" wood caps', maxHang: "16' adjustable", bulbSize: '~6" dia each' },
    vendorUrl: 'https://talalighting.com',
    msrp: 217000,
    price: 303800, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_7877c791120a4cdc90c998d96598468e~mv2.jpg',
  },
  {
    productId: 'L-003',
    name: 'Triple Pendant in Brass + Voronoi II',
    description: 'A cluster of three pendants inspired by basalt rock forms, crafted in solid brass with faceted surfaces. This triple pendant emits a beautiful warm glow downward – perfect over kitchen islands or as an accent in seating areas.',
    slug: 'basalt-triple-pendant',
    category: 'lighting',
    subCategory: 'overhead-fixtures',
    brand: 'Tala',
    finish: 'Brushed Brass',
    dimensions: { canopy: '9.8" diameter', pendant: '2.3" W × 3" H each', maxHang: "13' adjustable" },
    vendorUrl: 'https://talalighting.com',
    msrp: 99500,
    price: 139300, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_db5895e7056149a0a3d96c10af187157~mv2.webp',
  },

  // Wall Sconces
  {
    productId: 'L-004',
    name: 'Lochan Wall Light (Brass + Oval)',
    description: 'A compact, minimalist wall sconce featuring a modest brass base and Tala\'s elegant Oval LED bulb. This fixture is wet-rated (IP44) for safe use in bathrooms or covered outdoor areas.',
    slug: 'lochan-wall-light-brass',
    category: 'lighting',
    subCategory: 'wall-sconces',
    brand: 'Tala',
    finish: 'Brass anodized aluminum',
    dimensions: { base: '4.4" W × 4.4" H', extends: '3.4"', bulb: '6.25" L × 5.5" W' },
    vendorUrl: 'https://talalighting.com',
    msrp: 27500,
    price: 38500, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b9603be18be34063b24bea49fa80e7d4~mv2.webp',
  },
  {
    productId: 'L-005',
    name: 'Loop Wall Light (Gold)',
    description: 'A striking loop-shaped wall sconce in a rich gold tone, complete with a dim-to-warm globe bulb. Designed by John Tree for Tala, it marries art and function – the anodized gold loop reflects the bulb\'s warm light for a beautiful effect.',
    slug: 'loop-wall-light-gold',
    category: 'lighting',
    subCategory: 'wall-sconces',
    brand: 'Tala',
    finish: 'Gold anodized aluminum',
    dimensions: { overall: '9.25" L × 7.25" W × 7.25" H' },
    vendorUrl: 'https://talalighting.com',
    msrp: 31500,
    price: 44100, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_f6f7397ed6074c829f9a63e401d019b9~mv2.webp',
  },
  {
    productId: 'L-006',
    name: 'Firth LED Wall Light',
    description: 'A modern, disk-shaped LED sconce that mounts flush to the wall with a thick, textured glass face. It provides diffuse, ambient light and is ADA and wet-location rated – so it\'s extremely versatile (think shower wall light or outdoor porch).',
    slug: 'firth-led-wall-light',
    category: 'lighting',
    subCategory: 'wall-sconces',
    brand: 'Tala',
    finish: 'Clear fluted glass with white diffuser',
    dimensions: { diameter: '5.875"', depth: '3.125"' },
    vendorUrl: 'https://talalighting.com',
    msrp: 45000,
    price: 63000, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_c7636e23251949e6948676aee2378ad5~mv2.webp',
  },

  // Freestanding Lamps
  {
    productId: 'L-007',
    name: 'Poise Adjustable Floor Lamp (Black from Brass)',
    description: 'A sleek, telescoping floor lamp in polished brass, featuring a slim profile and an adjustable height via a graceful clutch mechanism. It comes paired with Tala\'s high-performance Sphere V dim-to-warm LED bulb for a beautiful warm glow.',
    slug: 'poise-adjustable-floor-lamp-brass',
    category: 'lighting',
    subCategory: 'floor-lamps',
    brand: 'Tala',
    finish: 'Brass plated steel',
    dimensions: { base: '8⅛" square', height: '49" to 66⅞" adjustable', cord: "10'" },
    vendorUrl: 'https://talalighting.com',
    msrp: 44500,
    price: 62300, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b2058c92f5164042bdf475e1988b4ddd~mv2.webp',
  },
  {
    productId: 'L-008',
    name: 'Reflection Enno Table Lamp',
    description: 'A limited-edition designer table lamp that features a sculptural porcelain base mirroring the form of Tala\'s Enno bulb. The base has a raw bisque finish on lower part and a high-gloss glaze on the upper part to catch the bulb\'s light.',
    slug: 'reflection-enno-table-lamp',
    category: 'lighting',
    subCategory: 'table-lamps',
    brand: 'Tala',
    finish: 'Matte white porcelain with gloss white glaze accents',
    dimensions: { base: '5⅞" diameter', height: '11¾"', cord: '10-ft grey braided' },
    vendorUrl: 'https://talalighting.com',
    msrp: 25500,
    price: 35700, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_ca5bbf80b3ba4b6bb6ddf271dbef23c7~mv2.webp',
  },
  {
    productId: 'L-009',
    name: 'The Muse Portable Lamp',
    description: 'A gorgeous cordless lamp that blends old-world lantern charm with modern tech: it has a dimmable LED filament, touch control dimmer, USB-C charging, and even a removable battery. It\'s IP44 rated for outdoor use, making it a versatile indoor/outdoor luxury lamp.',
    slug: 'the-muse-portable-lamp',
    category: 'lighting',
    subCategory: 'table-lamps',
    brand: 'Tala x Farrow & Ball',
    finish: 'Solid brass hardware with aluminum body (4 custom colors available)',
    dimensions: { height: '9"', diameter: '4"', battery: '24 hours on low setting' },
    vendorUrl: 'https://talalighting.com',
    msrp: 36500,
    price: 51100, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_b8697eb5ff9a4bfdb65f4fd3175b0474~mv2.webp',
  },
  // Additional Tala Products
  {
    productId: 'L-010',
    name: 'Basalt Single Pendant (Brass)',
    description: 'A statement pendant inspired by Northern Ireland\'s basalt columns: exposed sand-cast brass + polished faces paired with a mouth-blown glass bulb. High-end, architectural, and perfect for kitchen runs or bedside pendants.',
    slug: 'basalt-single-pendant-brass',
    category: 'lighting',
    subCategory: 'overhead-fixtures',
    brand: 'Tala',
    finish: 'Textured + polished Brass (Black canopy, brass grips, black cord)',
    dimensions: { pendant: '2 2/8" L × 2 2/8" W × 3" H', canopy: '5 1/8" L × 5 1/8" W × 1" H', bulb: '2 1/8" L × 2 1/8" W × 8 1/2" H', cord: "13' (approx.)" },
    vendorUrl: 'https://talalighting.com/products/basalt-single-pendant-in-brass',
    msrp: 35000,
    price: 49000, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_cd48292a8b0c410b9c5b0d89672189d5~mv2.webp',
  },
  {
    productId: 'L-011',
    name: 'Voronoi II Pendant Light (Brass)',
    description: 'Tala\'s best-selling bulb + pendant pairing: warm ambient glow with the iconic spiral filament. Ideal for clusters over islands, dining tables, stairwells, and boutique hospitality-style interiors.',
    slug: 'voronoi-ii-pendant-light-brass',
    category: 'lighting',
    subCategory: 'overhead-fixtures',
    brand: 'Tala',
    finish: 'Brass (also available in Graphite / Oak / Walnut)',
    dimensions: { pendant: '1 5/8" L × 1 5/8" W × 3 1/8" H (brass)', canopy: '5" L × 5" W × 1" H', bulb: '6 6/8" L × 6 6/8" W × 11" H', cord: "10'" },
    vendorUrl: 'https://talalighting.com/products/voronoi-ii-pendant-light-in-brass',
    msrp: 27000,
    price: 37800, // 40% markup
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_9ca5a00750fa4d72975a6c555f9d52a5~mv2.webp',
  },
  {
    productId: 'L-012',
    name: 'Alumina Multi-Use Lamp (Charcoal) — Set of 2',
    description: 'A designer "do-it-all" fixture: use as a table lamp or wall light with plug-in portability. Powder-coated aluminum in a modern charcoal tone, paired with Sphere IV Dim-to-Warm bulbs for a premium, designer-specified feel.',
    slug: 'alumina-multi-use-lamp-charcoal-set-of-2',
    category: 'lighting',
    subCategory: 'wall-sconces',
    brand: 'Tala',
    finish: 'Powder-coated Charcoal aluminum (range includes multiple colorways)',
    dimensions: { overall: '8 5/8" L × 5 7/8" W × 9 4/8" H (per lamp)', cord: "10'" },
    vendorUrl: 'https://talalighting.com/products/alumina-multi-use-lamp-in-charcoal-set-of-2',
    msrp: 47000,   // regular price
    price: 59220,  // 40% markup on sale price (42300 * 1.4)
    imageUrl: 'https://static.wixstatic.com/media/c6bfe7_c6f8f285207a44128c78f5aeed6e2756~mv2.webp',
  },
];

// Bathroom Products - Vanity Suite 1: Warm Walnut Modern
const bathroomProducts = [
  {
    productId: 'B-001',
    name: '48" Fluted Walnut Vanity',
    description: 'A mid-century inspired vanity featuring a ridged walnut front that adds rich texture. It sits on a sturdy plinth (or optional brass-capped feet) and offers two deep drawers plus a cabinet – blending style with storage.',
    slug: '48-fluted-walnut-vanity',
    category: 'bathroom',
    subCategory: 'vanities',
    set: 'suite1',
    brand: 'OVE Decors',
    finish: 'Warm Walnut wood veneer with Satin Brass knobs/handles',
    dimensions: { width: '48"', depth: '20"', height: '34"' },
    vendorUrl: 'https://ovedecors.com',
    msrp: 119900,
    price: 119900,
    imageUrl: null,
  },
  {
    productId: 'B-002',
    name: 'Arched Wall Mirror (Brass)',
    description: 'A modern arched mirror with a minimalist brass-finished frame that complements the fluted walnut vanity with a contrasting curved silhouette. The arch shape softens the vanity\'s lines and adds an elegant, trend-forward touch.',
    slug: 'arched-wall-mirror-brass',
    category: 'bathroom',
    subCategory: 'mirrors',
    set: 'suite1',
    brand: 'Crate & Barrel',
    finish: 'Brass metal frame',
    dimensions: { height: '36" (at center)', width: '34" (arch width)', depth: '1"' },
    vendorUrl: 'https://crateandbarrel.com',
    msrp: 39900,
    price: 39900,
    imageUrl: null,
  },
  {
    productId: 'B-003',
    name: 'Kohler Purist Widespread Faucet (Brushed Brass)',
    description: 'A high-end bathroom faucet known for its clean, cylindrical lines and flawless performance. In Kohler\'s brushed brass, it becomes a jewelry-like accent that elevates the vanity.',
    slug: 'kohler-purist-widespread-faucet-brushed-brass',
    category: 'bathroom',
    subCategory: 'faucets',
    set: 'suite1',
    brand: 'Kohler',
    finish: 'Vibrant Brushed Moderne Brass',
    dimensions: { spoutHeight: '6"', reach: '5"', handles: '4" H', spread: '8"-16" adjustable' },
    vendorUrl: 'https://kohler.com',
    msrp: 79900,
    price: 79900,
    imageUrl: null,
  },
  // Vanity Suite 2: Gloss White & Gold Elegance
  {
    productId: 'B-004',
    name: '48" Glossy White Vanity (Brass Base)',
    description: 'A sleek modern vanity with a crisp white finish and eye-catching brass accents – includes an open bottom base in brass and small brass knob handles on drawers. It offers a fresh, light aesthetic while still feeling luxurious due to the bold brass contrast.',
    slug: '48-glossy-white-vanity-brass-base',
    category: 'bathroom',
    subCategory: 'vanities',
    set: 'suite2',
    brand: 'James Martin',
    finish: 'Gloss White lacquer with Champagne Brass stainless steel base',
    dimensions: { width: '48"', depth: '18"', height: '34"' },
    vendorUrl: 'https://jamesmartinvanities.com',
    msrp: 280000,
    price: 280000,
    imageUrl: null,
  },
  {
    productId: 'B-005',
    name: 'Round Brass Wall Mirror',
    description: 'A classic round mirror in a subdued brass finish that complements the vanity\'s brass base without overpowering. The round shape introduces soft geometry, balancing the vanity\'s rectangular form.',
    slug: 'round-brass-wall-mirror',
    category: 'bathroom',
    subCategory: 'mirrors',
    set: 'suite2',
    brand: 'Uttermost',
    finish: 'Satin Brass plated frame',
    dimensions: { diameter: '30"', profile: '1/2"' },
    vendorUrl: 'https://uttermost.com',
    msrp: 25000,
    price: 25000,
    imageUrl: null,
  },
  {
    productId: 'B-006',
    name: 'Delta Trinsic Single Faucet (Champagne Bronze)',
    description: 'A sleek single-handle faucet with a contemporary cylindrical design, matching Delta\'s Champagne Bronze finish to our brass theme. It\'s simple to use and has a built-in red/blue indicator for temp.',
    slug: 'delta-trin sic-single-faucet-champagne-bronze',
    category: 'bathroom',
    subCategory: 'faucets',
    set: 'suite2',
    brand: 'Delta',
    finish: 'Champagne Bronze',
    dimensions: { height: '6.5"', reach: '5.25"', configuration: 'Single-hole' },
    vendorUrl: 'https://deltafaucet.com',
    msrp: 34900,
    price: 34900,
    imageUrl: null,
  },
  // Vanity Suite 3: Midnight Navy & Brass
  {
    productId: 'B-007',
    name: '48" Midnight Navy Console Vanity',
    description: 'A striking console-style vanity with a deep navy blue finish and eye-catching brass details – it stands on tall brass legs and includes an open lower shelf for decor or storage baskets. It features two drawers and an open shelf, marrying form and function.',
    slug: '48-midnight-navy-console-vanity',
    category: 'bathroom',
    subCategory: 'vanities',
    set: 'suite3',
    brand: 'Signature Hardware',
    finish: 'Midnight Navy Blue with Satin Brass knobs and Brass Open Console Base',
    dimensions: { width: '48"', depth: '21"', height: '34.25"' },
    vendorUrl: 'https://signaturehardware.com',
    msrp: 149900,
    price: 149900,
    imageUrl: null,
  },
  {
    productId: 'B-008',
    name: 'Rectangular Champagne Brass Mirror',
    description: 'A tall rectangular mirror in a muted brass finish that complements the vanity\'s brass hardware. The shape fits nicely over a 48" vanity (either one large mirror centered, or two side by side if a client prefers).',
    slug: 'rectangular-champagne-brass-mirror',
    category: 'bathroom',
    subCategory: 'mirrors',
    set: 'suite3',
    brand: 'James Martin',
    finish: 'Champagne Brass metal frame with 1" bevel edge',
    dimensions: { width: '26"', height: '40"' },
    vendorUrl: 'https://jamesmartinvanities.com',
    msrp: 49500,
    price: 49500,
    imageUrl: null,
  },
  {
    productId: 'B-009',
    name: 'Brizo Litze Widespread Faucet (Luxe Gold)',
    description: 'A showpiece faucet featuring industrial-chic knurled detailing on the handles and spout base, all rendered in a rich Luxe Gold finish. Brizo\'s Litze is both visually stunning and mechanically top-tier.',
    slug: 'brizo-litze-widespread-faucet-luxe-gold',
    category: 'bathroom',
    subCategory: 'faucets',
    set: 'suite3',
    brand: 'Brizo',
    finish: 'Luxe Gold',
    dimensions: { spoutHeight: '7"', reach: '5.5"', spread: '8"', handleBase: '2" diam' },
    vendorUrl: 'https://brizo.com',
    msrp: 92000,
    price: 92000,
    imageUrl: null,
  },
  // Additional Bathroom Fixtures
  {
    productId: 'B-010',
    name: 'Toto CT708 Wall-Hung Flushometer Toilet (Elongated)',
    description: 'A wall-hung toilet bowl for use with a commercial-style flushometer valve. It flushes at 1.28 GPF (or 1.0 GPF compatible) and features Toto\'s renowned glaze for cleanliness. This model brings a sleek, floating toilet aesthetic that is highly desirable in contemporary design.',
    slug: 'toto-ct708-wall-hung-flushometer-toilet',
    category: 'bathroom',
    subCategory: 'toilets',
    set: null,
    brand: 'Toto',
    finish: 'White vitreous china',
    dimensions: { bowl: '15" × 14"', projects: '26.5" from wall', mountingHeight: '17" (ADA compliant)' },
    vendorUrl: 'https://totousa.com',
    msrp: 30000,
    price: 30000,
    imageUrl: null,
  },
  {
    productId: 'B-011',
    name: 'American Standard Madera Flushometer Toilet (Floor-Mount)',
    description: 'A robust commercial-style floor toilet designed for use with a flushometer valve (exposed or concealed). It has a straightforward, modern silhouette (simple skirted base, no tank). Flush volume can be 1.1, 1.28, or 1.6 GPF depending on valve used.',
    slug: 'american-standard-madera-flushometer-toilet',
    category: 'bathroom',
    subCategory: 'toilets',
    set: null,
    brand: 'American Standard',
    finish: 'White vitreous china',
    dimensions: { bowl: 'Elongated', boltSpread: '10" or 12"', height: 'ADA ~17"' },
    vendorUrl: 'https://americanstandard.com',
    msrp: 25000,
    price: 25000,
    imageUrl: null,
  },
  {
    productId: 'B-012',
    name: 'Toto Washlet S550e Electric Bidet Seat (Elongated)',
    description: 'A top-of-the-line electric bidet seat featuring warm water wash (adjustable temperature and pressure), warm air dryer, heated seat, deodorizer, and an auto-open/close lid and auto night-light. Comes with a wall-mount wireless remote control.',
    slug: 'toto-washlet-s550e-electric-bidet-seat',
    category: 'bathroom',
    subCategory: 'bidets',
    set: null,
    brand: 'Toto',
    finish: 'White anti-microbial plastic (Cotton White)',
    dimensions: { width: '15.1"', length: '20.7"', height: '5" rear housing' },
    vendorUrl: 'https://totousa.com',
    msrp: 120000,
    price: 120000,
    imageUrl: null,
  },
];

async function main() {
  console.log('Importing Phase 5 Products (Lighting & Bathroom)...\n');

  const allProducts = [...lightingProducts, ...bathroomProducts];

  for (const product of allProducts) {
    try {
      const existing = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      const metadata = {
        category: product.category,
        subCategory: product.subCategory,
        brand: product.brand,
        finish: product.finish,
        dimensions: product.dimensions,
        vendorUrl: product.vendorUrl,
        msrp: product.msrp,
        productId: product.productId,
      };

      // Add set if it exists
      if (product.set) {
        metadata.set = product.set;
      }

      if (existing) {
        console.log(`Product ${product.productId} (${product.slug}) already exists, updating...`);
        
        await prisma.product.update({
          where: { slug: product.slug },
          data: {
            name: product.name,
            description: product.description,
            image_url: product.imageUrl || null,
            price: product.price,
            currency: 'usd',
            product_type: 'one_time',
            status: 'active',
            metadata: metadata,
          },
        });
        console.log(`✅ Updated: ${product.name} (${product.productId})`);
      } else {
        await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            slug: product.slug,
            image_url: product.imageUrl || null,
            price: product.price,
            currency: 'usd',
            product_type: 'one_time',
            status: 'active',
            metadata: metadata,
          },
        });
        console.log(`✅ Created: ${product.name} (${product.productId})`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${product.productId} (${product.slug}):`, error);
    }
  }

  console.log(`\n✅ Finished importing ${allProducts.length} Phase 5 products!`);
}

main()
  .catch((e) => {
    console.error('❌ Failed to import Phase 5 products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
