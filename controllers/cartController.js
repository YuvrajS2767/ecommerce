const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Add to cart
exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id; // Use user ID from authenticated request

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid product ID or quantity' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // If cart exists, update it
      const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
      if (productIndex > -1) {
        let productItem = cart.products[productIndex];
        productItem.quantity += quantity;
        cart.products[productIndex] = productItem;
      } else {
        cart.products.push({ productId, quantity });
      }
      cart = await cart.save();
      return res.status(200).json(cart);
    } else {
      // If no cart, create a new cart
      const newCart = await Cart.create({
        userId,
        products: [{ productId, quantity }],
      });
      return res.status(201).json(newCart);
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Get cart
// cartController.js
exports.getCart = async (req, res) => {
  const userId = req.user._id; // Use user ID from authenticated request

  try {
    const cart = await Cart.findOne({ userId }).populate('products.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Update quantity in cart
exports.updateQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id; // Use user ID from authenticated request

  if (!productId || quantity < 0) {
    return res.status(400).json({ message: 'Invalid product ID or quantity' });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const productIndex = cart.products.findIndex(item => item.productId.toString() === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    cart.products[productIndex].quantity = quantity;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id; // Use user ID from authenticated request

  if (!productId) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const updatedProducts = cart.products.filter(item => item.productId.toString() !== productId);
    cart.products = updatedProducts;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error removing item from cart', error });
  }
};

// Buy now
exports.buyNow = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id; // Use user ID from authenticated request

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid product ID or quantity' });
  }

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create a new order for the user
    const order = await Order.create({
      userId,
      products: [{ productId, quantity }],
      totalAmount: product.price * quantity,
      status: 'Processing',
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error processing the order:', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};
