const Product = require('../models/Product');
const UserInteraction = require('../models/UserInteraction');

// Recommend products based on viewed products
exports.recommendBasedOnViewed = async (userId) => {
  try {
    const userInteraction = await UserInteraction.findOne({ userId }).populate('viewedProducts');
    if (!userInteraction) return [];

    const viewedProductIds = userInteraction.viewedProducts.map(product => product._id);

    // Find products in the same category as viewed products
    const recommendations = await Product.find({
      category: { $in: viewedProductIds.map(id => id.category) },
      _id: { $nin: viewedProductIds } // Exclude already viewed products
    }).limit(10); // Limit the number of recommendations

    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations based on viewed products:', error);
    return [];
  }
};

// Recommend products based on search queries
exports.recommendBasedOnSearch = async (userId) => {
  try {
    const userInteraction = await UserInteraction.findOne({ userId });
    if (!userInteraction) return [];

    const queries = userInteraction.searchedQueries;
    const recommendations = await Product.find({
      name: { $in: queries } // Match products with names similar to search queries
    }).limit(10); // Limit the number of recommendations

    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations based on search queries:', error);
    return [];
  }
};
