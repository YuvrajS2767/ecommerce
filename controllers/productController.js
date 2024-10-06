const Product = require('../models/Product');
const UserInteraction = require('../models/UserInteraction');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name'); // Populate user name in reviews
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, mrp, discount, brand, availability } = req.body;
    const newProduct = new Product({ name, description, price, category, imageUrl, mrp, discount, brand, availability });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error });
  }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, mrp, discount, brand, availability } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, imageUrl, mrp, discount, brand, availability },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';
  console.log('Search query:', query);
  try {
    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    });
    console.log('Products found:', products);
    res.json(products);
  } catch (error) {
    console.error('Error during search:', error.message);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

// Track user product view
exports.trackProductView = async (req, res) => {
  const userId = req.user._id; // Get userId from the authenticated request
  const { productId } = req.params;
  
  try {
    await UserInteraction.findOneAndUpdate(
      { userId },
      { $addToSet: { viewedProducts: productId } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Product view tracked' });
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({ message: 'Error tracking product view', error });
  }
};

// Track user search
exports.trackSearchQuery = async (req, res) => {
  const userId = req.user._id; // Get userId from the authenticated request
  const { query } = req.params;

  try {
    await UserInteraction.findOneAndUpdate(
      { userId },
      { $addToSet: { searchedQueries: query } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Search query tracked' });
  } catch (error) {
    console.error('Error tracking search query:', error);
    res.status(500).json({ message: 'Error tracking search query', error });
  }
};

// Submit a product review
exports.addProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find((rev) => rev.user.toString() === userId);
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Add new review
    const review = { user: userId, rating: Number(rating), comment };
    product.reviews.push(review);

    // Calculate the average rating
    const totalRating = product.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    product.averageRating = totalRating / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('reviews.user', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product.reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
};
