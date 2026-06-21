import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Jewellery from "../models/Jewellery.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Helper function to extract public_id from Cloudinary URL
 */
const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.split('.')[0];
};

/**
 * Helper function to delete image from Cloudinary
 */
const deleteCloudinaryImage = async (url) => {
  if (!url) return;
  const publicId = extractPublicId(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(` Deleted jewellery image: ${publicId}`);
    } catch (error) {
      console.error(` Error deleting image ${publicId}:`, error);
    }
  }
};

/**
 * CREATE JEWELLERY
 */
router.post(
  "/",
  upload.single("image"),
  async (req, res) => {
    try {
      const { body, file } = req;
      
      console.log("========== CREATE JEWELLERY REQUEST ==========");
      console.log("Body fields:", Object.keys(body));
      console.log("File:", file ? file.originalname : "No file");

      // Parse sizes from JSON string
      let sizes = [];
      try {
        if (body.sizes && body.sizes !== "undefined" && body.sizes !== "null") {
          sizes = JSON.parse(body.sizes);
        }
      } catch (parseError) {
        console.error("Error parsing sizes JSON:", parseError);
        return res.status(400).json({ 
          success: false,
          message: "Invalid JSON in sizes",
          error: parseError.message 
        });
      }

      // Upload image to Cloudinary
      let imageUrl = null;
      let imagePublicId = null;

      if (file) {
        console.log("Uploading jewellery image to Cloudinary...");
        const uploadedImage = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "jewellery" }
        );
        imageUrl = uploadedImage.secure_url;
        imagePublicId = uploadedImage.public_id;
      }

      // Calculate final price
      const price = parseFloat(body.price) || 0;
      const discount = parseFloat(body.discount) || 0;
      const finalPrice = discount > 0 
        ? price - (price * discount) / 100 
        : price;

      // Create jewellery
      const jewellery = await Jewellery.create({
        name: body.name || "",
        category: body.category || "",
        material: body.material || "",
        color: body.color || "",
        occasion: body.occasion || "",
        price: price,
        discount: discount,
        finalPrice: finalPrice,
        sizes: sizes,
        description: body.description || "",
        image: imageUrl,
        imagePublicId: imagePublicId
      });

      console.log(" Jewellery created successfully:", jewellery._id);
      res.status(201).json({
        success: true,
        message: "Jewellery added successfully",
        jewellery: jewellery
      });
    } catch (error) {
      console.error(" Error creating jewellery:", error);
      res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET ALL JEWELLERY
 */
router.get("/", async (req, res) => {
  try {
    const jewellery = await Jewellery.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: jewellery.length,
      jewellery: jewellery
    });
  } catch (error) {
    console.error(" Error fetching jewellery:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * GET SINGLE JEWELLERY BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const jewellery = await Jewellery.findById(req.params.id);
    
    if (!jewellery) {
      return res.status(404).json({
        success: false,
        message: "Jewellery not found"
      });
    }
    
    res.status(200).json({
      success: true,
      jewellery: jewellery
    });
  } catch (error) {
    console.error(" Error fetching jewellery:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * UPDATE JEWELLERY
 */
router.put(
  "/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { body, file } = req;
      
      console.log("========== UPDATE JEWELLERY REQUEST ==========");
      console.log("Jewellery ID:", id);
      console.log("File:", file ? file.originalname : "No new file");

      // Find existing jewellery
      const existingJewellery = await Jewellery.findById(id);
      if (!existingJewellery) {
        return res.status(404).json({
          success: false,
          message: "Jewellery not found"
        });
      }

      // Parse sizes from JSON string
      let sizes = [];
      try {
        if (body.sizes && body.sizes !== "undefined" && body.sizes !== "null") {
          sizes = JSON.parse(body.sizes);
        } else {
          sizes = existingJewellery.sizes || [];
        }
      } catch (parseError) {
        console.error("Error parsing sizes JSON:", parseError);
        return res.status(400).json({ 
          success: false,
          message: "Invalid JSON in sizes",
          error: parseError.message 
        });
      }

      // Handle image update
      let imageUrl = existingJewellery.image;
      let imagePublicId = existingJewellery.imagePublicId;

      if (file) {
        // Delete old image from Cloudinary
        if (existingJewellery.imagePublicId) {
          await deleteCloudinaryImage(existingJewellery.image);
        }
        
        // Upload new image
        console.log("Uploading new jewellery image to Cloudinary...");
        const uploadedImage = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "jewellery" }
        );
        imageUrl = uploadedImage.secure_url;
        imagePublicId = uploadedImage.public_id;
      }

      // Calculate final price
      const price = parseFloat(body.price) || existingJewellery.price || 0;
      const discount = parseFloat(body.discount) !== undefined ? parseFloat(body.discount) : (existingJewellery.discount || 0);
      const finalPrice = discount > 0 
        ? price - (price * discount) / 100 
        : price;

      // Update jewellery
      const updatedJewellery = await Jewellery.findByIdAndUpdate(
        id,
        {
          name: body.name || existingJewellery.name,
          category: body.category || existingJewellery.category,
          material: body.material || existingJewellery.material,
          color: body.color !== undefined ? body.color : existingJewellery.color,
          occasion: body.occasion !== undefined ? body.occasion : existingJewellery.occasion,
          price: price,
          discount: discount,
          finalPrice: finalPrice,
          sizes: sizes,
          description: body.description !== undefined ? body.description : existingJewellery.description,
          image: imageUrl,
          imagePublicId: imagePublicId
        },
        { new: true, runValidators: true }
      );

      console.log(" Jewellery updated successfully:", updatedJewellery._id);
      res.status(200).json({
        success: true,
        message: "Jewellery updated successfully",
        jewellery: updatedJewellery
      });
    } catch (error) {
      console.error(" Error updating jewellery:", error);
      res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * DELETE JEWELLERY
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("========== DELETE JEWELLERY REQUEST ==========");
    console.log("Jewellery ID:", id);
    
    // Find the jewellery first
    const jewellery = await Jewellery.findById(id);
    
    if (!jewellery) {
      return res.status(404).json({
        success: false,
        message: "Jewellery not found"
      });
    }
    
    // Delete image from Cloudinary
    if (jewellery.imagePublicId) {
      await deleteCloudinaryImage(jewellery.image);
    }
    
    // Delete the jewellery from database
    await Jewellery.findByIdAndDelete(id);
    
    console.log("Jewellery deleted successfully:", id);
    res.status(200).json({
      success: true,
      message: "Jewellery deleted successfully",
      deletedId: id
    });
  } catch (error) {
    console.error("Error deleting jewellery:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});
/**
 * GET SINGLE JEWELLERY BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const jewellery = await Jewellery.findById(req.params.id);
    
    if (!jewellery) {
      return res.status(404).json({
        success: false,
        message: "Jewellery not found"
      });
    }
    
    console.log("Jewellery fetched successfully:", jewellery._id);
    res.status(200).json({
      success: true,
      jewellery: jewellery
    });
  } catch (error) {
    console.error("Error fetching jewellery:", error);
    
    // Handle invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: "Invalid jewellery ID format"
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

export default router;