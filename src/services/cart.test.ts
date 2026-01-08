import { describe, it, expect } from 'vitest';
import { CartService, type Cart, type CartItem } from './cart';

describe('CartService', () => {
  describe('addItem', () => {
    it('should add a new item to an empty cart', () => {
      const cart = CartService.createEmpty();
      const item: CartItem = {
        productId: 'product-1',
        quantity: 1,
        price: 10.0,
      };

      const result = CartService.addItem(cart, item);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(item);
      expect(result.subtotal).toBe(10.0);
      expect(result.total).toBe(11.0); // 10 + 10% tax
    });

    it('should increase quantity when adding the same item', () => {
      const cart = CartService.createEmpty();
      const item1: CartItem = {
        productId: 'product-1',
        quantity: 1,
        price: 10.0,
      };
      const item2: CartItem = {
        productId: 'product-1',
        quantity: 2,
        price: 10.0,
      };

      const cartAfterFirst = CartService.addItem(cart, item1);
      const result = CartService.addItem(cartAfterFirst, item2);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3); // 1 + 2
      expect(result.subtotal).toBe(30.0); // 3 * 10
      expect(result.total).toBe(33.0); // 30 + 10% tax
    });

    it('should add different items separately', () => {
      const cart = CartService.createEmpty();
      const item1: CartItem = {
        productId: 'product-1',
        quantity: 1,
        price: 10.0,
      };
      const item2: CartItem = {
        productId: 'product-2',
        quantity: 1,
        price: 20.0,
      };

      const cartAfterFirst = CartService.addItem(cart, item1);
      const result = CartService.addItem(cartAfterFirst, item2);

      expect(result.items).toHaveLength(2);
      expect(result.subtotal).toBe(30.0); // 10 + 20
      expect(result.total).toBe(33.0); // 30 + 10% tax
    });

    it('should handle items with variants separately', () => {
      const cart = CartService.createEmpty();
      const item1: CartItem = {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 1,
        price: 10.0,
      };
      const item2: CartItem = {
        productId: 'product-1',
        variantId: 'variant-2',
        quantity: 1,
        price: 15.0,
      };

      const cartAfterFirst = CartService.addItem(cart, item1);
      const result = CartService.addItem(cartAfterFirst, item2);

      expect(result.items).toHaveLength(2);
      expect(result.subtotal).toBe(25.0); // 10 + 15
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.0,
          },
          {
            productId: 'product-2',
            quantity: 1,
            price: 20.0,
          },
        ],
        subtotal: 30.0,
        tax: 3.0,
        total: 33.0,
      };

      const result = CartService.removeItem(cart, 'product-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-2');
      expect(result.subtotal).toBe(20.0);
      expect(result.total).toBe(22.0); // 20 + 10% tax
    });

    it('should remove item with specific variant', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            variantId: 'variant-1',
            quantity: 1,
            price: 10.0,
          },
          {
            productId: 'product-1',
            variantId: 'variant-2',
            quantity: 1,
            price: 15.0,
          },
        ],
        subtotal: 25.0,
        tax: 2.5,
        total: 27.5,
      };

      const result = CartService.removeItem(cart, 'product-1', 'variant-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].variantId).toBe('variant-2');
      expect(result.subtotal).toBe(15.0);
    });

    it('should do nothing if item does not exist', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.0,
          },
        ],
        subtotal: 10.0,
        tax: 1.0,
        total: 11.0,
      };

      const result = CartService.removeItem(cart, 'product-999');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-1');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.0,
          },
        ],
        subtotal: 10.0,
        tax: 1.0,
        total: 11.0,
      };

      const result = CartService.updateQuantity(cart, 'product-1', 3);

      expect(result.items[0].quantity).toBe(3);
      expect(result.subtotal).toBe(30.0); // 3 * 10
      expect(result.total).toBe(33.0); // 30 + 10% tax
    });

    it('should remove item if quantity is 0', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.0,
          },
        ],
        subtotal: 10.0,
        tax: 1.0,
        total: 11.0,
      };

      const result = CartService.updateQuantity(cart, 'product-1', 0);

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should remove item if quantity is negative', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.0,
          },
        ],
        subtotal: 10.0,
        tax: 1.0,
        total: 11.0,
      };

      const result = CartService.updateQuantity(cart, 'product-1', -1);

      expect(result.items).toHaveLength(0);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate subtotal, tax, and total correctly', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 10.0,
          },
          {
            productId: 'product-2',
            quantity: 1,
            price: 20.0,
          },
        ],
        subtotal: 0,
        tax: 0,
        total: 0,
      };

      const result = CartService.calculateTotals(cart);

      expect(result.subtotal).toBe(40.0); // 2 * 10 + 1 * 20
      expect(result.tax).toBe(4.0); // 40 * 0.1
      expect(result.total).toBe(44.0); // 40 + 4
    });

    it('should use custom tax rate', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 100.0,
          },
        ],
        subtotal: 0,
        tax: 0,
        total: 0,
      };

      const result = CartService.calculateTotals(cart, 0.2); // 20% tax

      expect(result.subtotal).toBe(100.0);
      expect(result.tax).toBe(20.0); // 100 * 0.2
      expect(result.total).toBe(120.0); // 100 + 20
    });

    it('should handle empty cart', () => {
      const cart = CartService.createEmpty();
      const result = CartService.calculateTotals(cart);

      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('should return total quantity of all items', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 10.0,
          },
          {
            productId: 'product-2',
            quantity: 3,
            price: 20.0,
          },
        ],
        subtotal: 80.0,
        tax: 8.0,
        total: 88.0,
      };

      const count = CartService.getItemCount(cart);

      expect(count).toBe(5); // 2 + 3
    });

    it('should return 0 for empty cart', () => {
      const cart = CartService.createEmpty();
      const count = CartService.getItemCount(cart);

      expect(count).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all items from cart', () => {
      const cart: Cart = {
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.0,
          },
        ],
        subtotal: 10.0,
        tax: 1.0,
        total: 11.0,
      };

      const result = CartService.clear(cart);

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('createEmpty', () => {
    it('should create an empty cart', () => {
      const cart = CartService.createEmpty();

      expect(cart.items).toHaveLength(0);
      expect(cart.subtotal).toBe(0);
      expect(cart.tax).toBe(0);
      expect(cart.total).toBe(0);
    });
  });
});
