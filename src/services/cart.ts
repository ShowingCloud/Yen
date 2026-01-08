import { Prisma } from '../generated/client';
import type { Product, Variant } from '../generated/client';

/**
 * Cart Item
 * Represents an item in the shopping cart
 */
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number; // Price at time of adding to cart
  product?: Product;
  variant?: Variant;
}

/**
 * Cart
 * Represents a shopping cart with items and totals
 */
export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * CartService
 * Handles cart operations: adding items, removing items, calculating totals
 * Pure functions for easy testing
 */
export class CartService {
  /**
   * Add an item to the cart
   * If the item already exists (same product and variant), increase quantity
   */
  static addItem(cart: Cart, item: CartItem): Cart {
    const existingItemIndex = cart.items.findIndex(
      (existing) =>
        existing.productId === item.productId &&
        existing.variantId === item.variantId
    );

    const newItems = [...cart.items];

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + item.quantity,
      };
    } else {
      // Add new item
      newItems.push(item);
    }

    return CartService.calculateTotals({
      ...cart,
      items: newItems,
    });
  }

  /**
   * Remove an item from the cart
   */
  static removeItem(cart: Cart, productId: string, variantId?: string): Cart {
    const newItems = cart.items.filter(
      (item) =>
        !(item.productId === productId && item.variantId === variantId)
    );

    return CartService.calculateTotals({
      ...cart,
      items: newItems,
    });
  }

  /**
   * Update item quantity
   */
  static updateQuantity(
    cart: Cart,
    productId: string,
    quantity: number,
    variantId?: string
  ): Cart {
    if (quantity <= 0) {
      return CartService.removeItem(cart, productId, variantId);
    }

    const newItems = cart.items.map((item) => {
      if (item.productId === productId && item.variantId === variantId) {
        return { ...item, quantity };
      }
      return item;
    });

    return CartService.calculateTotals({
      ...cart,
      items: newItems,
    });
  }

  /**
   * Calculate cart totals (subtotal, tax, total)
   * Tax rate is configurable (default 10%)
   */
  static calculateTotals(cart: Cart, taxRate: number = 0.1): Cart {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      ...cart,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  /**
   * Get cart item count (total quantity of all items)
   */
  static getItemCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Clear the cart
   */
  static clear(cart: Cart): Cart {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }

  /**
   * Create an empty cart
   */
  static createEmpty(): Cart {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }
}
