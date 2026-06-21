import mongoose from 'mongoose';

// Each "arm" represents a product (dress or jewellery) – we'll store its feature vector.
// For scalability, we won't store arms in this model; instead we'll compute on the fly using product features.
// This model stores the user's LinUCB state: A (covariance) and b (reward vector) for each arm? Actually LinUCB maintains per-user per-arm parameters, but that's too heavy. 
// A common simplification: treat each product as an arm, but use a shared feature space across products (disjoint linear models per arm? No, LinUCB uses a shared feature space across arms, with arm-specific features).
// We'll store for each user: a dictionary mapping productId to { A, b }? That's not scalable. 
// Instead, we'll use a "hybrid" LinUCB where each arm has its own feature vector (product features) and we maintain per-user global parameters. 
// Actually the standard LinUCB (disjoint) maintains per-arm parameters. That's too heavy. We'll use a simplified version: 
// We'll maintain per-user global A and b (for all arms) and use arm-specific features. That's "hybrid" LinUCB but easier.

// Let's define: for each user, we store:
// - A (d x d matrix) – global covariance
// - b (d x 1 vector) – global reward accumulator
// - lastUpdated (timestamp)
// d = feature dimension (e.g., category + color + price etc.)

const userBanditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  A: [[Number]],        // 2D array (d x d)
  b: [Number],          // 1D array (d)
  alpha: { type: Number, default: 0.3 }, // exploration parameter
  d: { type: Number, default: 10 },      // feature dimension
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('UserBandit', userBanditSchema);