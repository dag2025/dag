import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  altMobile: String,
  pincode: { type: String, required: true },
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  address: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Address', addressSchema);