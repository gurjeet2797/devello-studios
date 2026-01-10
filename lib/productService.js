import prisma from './prisma';

const DUMMY_WINDOW_SLUG = 'dummy-window';
const DUMMY_WINDOW_NAME = 'Dummy Window';
const DUMMY_WINDOW_DESCRIPTION = 'Test product used to validate checkout flow end-to-end.';

export class ProductService {
  /**
   * Get product by ID (checks both products and house_build_products tables)
   */
  static async getProductById(id) {
    try {
      // First check products table (windows/doors/glass/mirrors)
      let product = await prisma.product.findUnique({
        where: { id },
      });
      
      // If not found, check house_build_products table
      if (!product) {
        product = await prisma.houseBuildProduct.findUnique({
          where: { id },
        });
      }
      
      return product;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  }

  /**
   * Get product by slug (checks both products and house_build_products tables)
   */
  static async getProductBySlug(slug) {
    try {
      // First check products table (windows/doors/glass/mirrors)
      let product = await prisma.product.findUnique({
        where: { slug },
      });
      
      // If not found, check house_build_products table
      if (!product) {
        product = await prisma.houseBuildProduct.findUnique({
          where: { slug },
        });
      }
      
      return product;
    } catch (error) {
      console.error('Error getting product by slug:', error);
      throw error;
    }
  }

  /**
   * Validate product availability
   */
  static async validateProductAvailability(productId) {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        return { available: false, reason: 'Product not found' };
      }

      // Allow test products in production if they have visible_in_catalog: true
      if (this.isTestProduct(product) && process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_PRODUCTS && product.visible_in_catalog !== true) {
        return { available: false, reason: 'Test products are disabled in production' };
      }

      if (product.status !== 'active') {
        return { available: false, reason: 'Product is not active' };
      }

      return { available: true, product };
    } catch (error) {
      console.error('Error validating product availability:', error);
      return { available: false, reason: 'Error validating product' };
    }
  }

  /**
   * Calculate pricing (can include discounts, taxes, etc.)
   */
  static calculatePricing(product, quantity = 1) {
    const subtotal = product.price * quantity;
    const tax = 0; // Calculate tax if needed
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      currency: product.currency,
    };
  }

  /**
   * Handle product fulfillment
   */
  static async fulfillProductOrder(productOrderId) {
    try {
      const productOrder = await prisma.productOrder.findUnique({
        where: { id: productOrderId },
        include: { product: true },
      });

      if (!productOrder) {
        throw new Error('Product order not found');
      }

      // If product relation is null, try to fetch from house_build_products table
      if (!productOrder.product && productOrder.product_id) {
        try {
          productOrder.product = await prisma.houseBuildProduct.findUnique({
            where: { id: productOrder.product_id },
          });
        } catch (err) {
          console.error('Error fetching house build product for fulfillment:', err);
        }
      }

      if (productOrder.status === 'delivered') {
        return productOrder;
      }

      // Update order status to delivered
      const updatedOrder = await prisma.productOrder.update({
        where: { id: productOrderId },
        data: {
          status: 'delivered',
          delivered_at: new Date(),
        },
      });

      // TODO: Add any fulfillment logic here (send email, update inventory, etc.)

      return updatedOrder;
    } catch (error) {
      console.error('Error fulfilling product order:', error);
      throw error;
    }
  }

  /**
   * Generate order number (simplified format)
   */
  static generateOrderNumber() {
    // Simple format: ORD-YYYYMMDD-XXXX (date + 4 random digits)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Get product variants from metadata
   */
  static getVariants(product) {
    if (!product || !product.metadata) {
      return [];
    }
    
    const metadata = typeof product.metadata === 'string' 
      ? JSON.parse(product.metadata) 
      : product.metadata;
    
    return metadata.variants || [];
  }

  /**
   * Get minimum price from variants or product price
   */
  static getMinPrice(product) {
    if (!product) {
      return 0;
    }

    const variants = this.getVariants(product);
    
    if (variants.length > 0) {
      const prices = variants
        .map(v => v.price)
        .filter(p => p !== undefined && p !== null);
      
      if (prices.length > 0) {
        return Math.min(...prices);
      }
    }

    // Fallback to product price
    return product.price || 0;
  }

  /**
   * Get product ID from metadata
   */
  static getProductId(product) {
    if (!product || !product.metadata) {
      return null;
    }
    
    const metadata = typeof product.metadata === 'string' 
      ? JSON.parse(product.metadata) 
      : product.metadata;
    
    return metadata.productId || null;
  }

  /**
   * Get variant price from database (validates variant exists and returns its price)
   * This ensures pricing always comes from the database, not frontend
   */
  static getVariantPrice(product, variantName) {
    if (!product || !variantName) {
      return product?.price || 0;
    }

    const variants = this.getVariants(product);
    const variant = variants.find(v => v.name === variantName);
    
    if (variant && variant.price) {
      return variant.price;
    }

    // Fallback to product base price if variant not found
    return product.price || 0;
  }

  /**
   * Validate and get price for a product (with optional variant)
   * Always returns price from database, never trusts frontend price
   */
  static async getValidatedPrice(productId, variantName = null) {
    const product = await this.getProductById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (variantName) {
      return this.getVariantPrice(product, variantName);
    }

    return product.price;
  }

  static isTestProduct(product) {
    return !!product?.is_test;
  }

  static async getDummyWindowProduct(options = {}) {
    const { allowCreate = false } = options;

    const existingProduct = await prisma.product.findFirst({
      where: { slug: DUMMY_WINDOW_SLUG },
    });

    if (existingProduct) {
      return existingProduct;
    }

    if (!allowCreate) {
      return null;
    }

    return prisma.product.upsert({
      where: { slug: DUMMY_WINDOW_SLUG },
      update: {
        is_test: true,
        visible_in_catalog: true, // Enable in production for testing
      },
      create: {
        name: DUMMY_WINDOW_NAME,
        description: DUMMY_WINDOW_DESCRIPTION,
        slug: DUMMY_WINDOW_SLUG,
        price: 1000,
        currency: 'usd',
        product_type: 'one_time',
        status: 'active',
        is_test: true,
        visible_in_catalog: true, // Enable in production for testing
        metadata: {
          variants: [
            {
              name: 'Standard',
              price: 1000,
            },
          ],
        },
      },
    });
  }
}

