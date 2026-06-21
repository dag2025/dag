// models/UserMeasurement.js
import mongoose from 'mongoose';

const userMeasurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  height: { value: Number, unit: { type: String, default: 'cm' } },
  weight: { value: Number, unit: { type: String, default: 'kg' } },
  chest: { value: Number, unit: { type: String, default: 'cm' } },
  waist: { value: Number, unit: { type: String, default: 'cm' } },
  hips: { value: Number, unit: { type: String, default: 'cm' } },
  shoulder: { value: Number, unit: { type: String, default: 'cm' } },
  armLength: { value: Number, unit: { type: String, default: 'cm' } },
  ringSize: { value: Number, unit: { type: String, default: 'mm' } },
  wristSize: { value: Number, unit: { type: String, default: 'cm' } },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('UserMeasurement', userMeasurementSchema);