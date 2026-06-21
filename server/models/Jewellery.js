import mongoose from 'mongoose';

const jewellerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Jewellery name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  material: {
    type: String,
    required: [true, 'Material is required'],
    trim: true
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  occasion: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  finalPrice: {
    type: Number,
    min: 0
  },
  sizes: [{
    size: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// ✅ FIX 1: For pre-save middleware with async/await, don't use next()
// Just do your calculations and let the save continue naturally
jewellerySchema.pre('save', function() {
  // Use regular function (not arrow) to have access to 'this'
  if (this.price) {
    if (this.discount && this.discount > 0) {
      this.finalPrice = this.price - (this.price * this.discount / 100);
    } else {
      this.finalPrice = this.price;
    }
  }
  // No need to call next() - just return
});

// ✅ FIX 2: Also add pre-update middleware for findOneAndUpdate operations
jewellerySchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  
  if (update.price || update.discount) {
    const price = update.price || 0;
    const discount = update.discount || 0;
    
    if (discount > 0) {
      update.finalPrice = price - (price * discount / 100);
    } else {
      update.finalPrice = price;
    }
  }
});

const Jewellery = mongoose.model('Jewellery', jewellerySchema);
export default Jewellery;