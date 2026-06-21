import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Ad title is required'],
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: [true, 'Media type is required']
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required']
  },
  mediaPublicId: {
    type: String,
    required: [true, 'Media public ID is required']
  },
  linkedProduct: {
    productType: {
      type: String,
      enum: ['dress', 'jewellery'],
      required: false
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: 'linkedProduct.productType'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  clicks: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // ✅ This automatically manages createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for linked product
adSchema.virtual('productDetails', {
  ref: function() {
    return this.linkedProduct?.productType === 'dress' ? 'Dress' : 'Jewellery';
  },
  localField: 'linkedProduct.productId',
  foreignField: '_id',
  justOne: true
});

// ✅ NO MIDDLEWARE NEEDED - timestamps: true handles everything
// Remove all pre/post hooks completely

const Ad = mongoose.model('Ad', adSchema);
export default Ad;