import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
  size: String,
  stock: Number,
});

const dressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: String,         
    price: Number,
    discount: Number,
    finalPrice: Number,

    material: String,
    color: String,
    occasion: String,

    sizes: [sizeSchema],      
    meterSizes: [sizeSchema],  

    description: String,

    images: {
      cover: String,
      gallery: [String],
    },
  },
  { timestamps: true }
);


export default mongoose.model("Dress", dressSchema);
