import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Dress from "../models/Dress.js";

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
  return fileName.split('.')[0]; // Remove file extension
};

/**
 * Helper function to delete images from Cloudinary
 */
const deleteCloudinaryImages = async (urls) => {
  if (!urls || urls.length === 0) return;
  
  const deletePromises = urls.map(async (url) => {
    const publicId = extractPublicId(url);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted image: ${publicId}`);
      } catch (error) {
        console.error(`❌ Error deleting image ${publicId}:`, error);
      }
    }
  });
  
  await Promise.all(deletePromises);
};

/**
 * CREATE DRESS
 */
router.post(
  "/",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const { body, files } = req;
      
      console.log("========== CREATE DRESS REQUEST ==========");
      console.log("Body fields:", Object.keys(req.body));
      console.log("Files:", req.files ? Object.keys(req.files) : "No files");
      
      // Parse JSON strings from form data
      let sizes = [];
      let meterSizes = [];
      
      try {
        if (body.sizes && body.sizes !== "undefined") {
          sizes = JSON.parse(body.sizes);
        }
        if (body.meterSizes && body.meterSizes !== "undefined") {
          meterSizes = JSON.parse(body.meterSizes);
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        return res.status(400).json({ 
          message: "Invalid JSON in sizes/meterSizes",
          error: parseError.message 
        });
      }

      // Upload images to Cloudinary
      const uploadImage = async (file) => {
        return cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "dresses" }
        );
      };

      let coverImage = null;
      let galleryImages = [];

      if (files && files.cover && files.cover[0]) {
        console.log("Uploading cover image...");
        coverImage = await uploadImage(files.cover[0]);
      }

      if (files && files.gallery) {
        console.log(`Uploading ${files.gallery.length} gallery images...`);
        galleryImages = await Promise.all(files.gallery.map(uploadImage));
      }

      // Calculate final price
      const price = parseFloat(body.price) || 0;
      const discount = parseFloat(body.discount) || 0;
      const finalPrice = discount > 0 
        ? price - (price * discount) / 100 
        : price;

      // Create dress
      const dress = await Dress.create({
        name: body.name || "",
        category: body.category || "",
        price: price,
        discount: discount,
        finalPrice: finalPrice,
        material: body.material || "",
        color: body.color || "",
        occasion: body.occasion || "",
        description: body.description || "",
        sizes: sizes,
        meterSizes: meterSizes,
        images: {
          cover: coverImage?.secure_url || null,
          gallery: galleryImages.map((img) => img.secure_url),
        },
      });

      console.log("✅ Dress created successfully:", dress._id);
      res.status(201).json({
        success: true,
        message: "Dress created successfully",
        dress: dress
      });
    } catch (error) {
      console.error("❌ Error creating dress:", error);
      res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET ALL DRESSES
 */
router.get("/", async (req, res) => {
  try {
    const dresses = await Dress.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: dresses.length,
      dresses: dresses
    });
  } catch (error) {
    console.error("❌ Error fetching dresses:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * GET SINGLE DRESS BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const dress = await Dress.findById(req.params.id);
    
    if (!dress) {
      return res.status(404).json({
        success: false,
        message: "Dress not found"
      });
    }
    
    res.status(200).json({
      success: true,
      dress: dress
    });
  } catch (error) {
    console.error("❌ Error fetching dress:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * UPDATE DRESS
 * Important: Handle image updates and delete old images from Cloudinary
 */
router.put(
  "/:id",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { body, files } = req;
      
      console.log("========== UPDATE DRESS REQUEST ==========");
      console.log("Dress ID:", id);
      console.log("Body fields:", Object.keys(req.body));
      console.log("Files:", req.files ? Object.keys(req.files) : "No files");
      
      // Find existing dress
      const existingDress = await Dress.findById(id);
      if (!existingDress) {
        return res.status(404).json({
          success: false,
          message: "Dress not found"
        });
      }
      
      // Parse JSON strings from form data
      let sizes = [];
      let meterSizes = [];
      
      try {
        if (body.sizes && body.sizes !== "undefined") {
          sizes = JSON.parse(body.sizes);
        } else {
          sizes = existingDress.sizes;
        }
        
        if (body.meterSizes && body.meterSizes !== "undefined") {
          meterSizes = JSON.parse(body.meterSizes);
        } else {
          meterSizes = existingDress.meterSizes;
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        return res.status(400).json({ 
          message: "Invalid JSON in sizes/meterSizes",
          error: parseError.message 
        });
      }

      // Prepare update data
      const updateData = {
        name: body.name || existingDress.name,
        category: body.category || existingDress.category,
        price: parseFloat(body.price) || existingDress.price,
        discount: parseFloat(body.discount) || existingDress.discount,
        material: body.material || existingDress.material,
        color: body.color || existingDress.color,
        occasion: body.occasion || existingDress.occasion,
        description: body.description || existingDress.description,
        sizes: sizes,
        meterSizes: meterSizes,
        images: { ...existingDress.images.toObject() } // Copy existing images
      };
      
      // Recalculate final price
      updateData.finalPrice = updateData.discount > 0 
        ? updateData.price - (updateData.price * updateData.discount) / 100 
        : updateData.price;

      // Handle image updates
      const imagesToDelete = [];
      
      // Upload new cover image if provided
      if (files && files.cover && files.cover[0]) {
        console.log("Uploading new cover image...");
        
        // Mark old cover image for deletion
        if (existingDress.images.cover) {
          imagesToDelete.push(existingDress.images.cover);
        }
        
        // Upload new cover image
        const coverImage = await cloudinary.uploader.upload(
          `data:${files.cover[0].mimetype};base64,${files.cover[0].buffer.toString("base64")}`,
          { folder: "dresses" }
        );
        updateData.images.cover = coverImage.secure_url;
      }
      
      // Handle gallery images
      if (files && files.gallery) {
        console.log(`Uploading ${files.gallery.length} new gallery images...`);
        
        // Mark all old gallery images for deletion
        if (existingDress.images.gallery && existingDress.images.gallery.length > 0) {
          imagesToDelete.push(...existingDress.images.gallery);
        }
        
        // Upload new gallery images
        const galleryImages = await Promise.all(
          files.gallery.map(async (file) => {
            return cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
              { folder: "dresses" }
            );
          })
        );
        
        updateData.images.gallery = galleryImages.map(img => img.secure_url);
      }

      // Update the dress
      const updatedDress = await Dress.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      // Delete old images from Cloudinary
      if (imagesToDelete.length > 0) {
        await deleteCloudinaryImages(imagesToDelete);
      }

      console.log("✅ Dress updated successfully:", updatedDress._id);
      res.status(200).json({
        success: true,
        message: "Dress updated successfully",
        dress: updatedDress
      });
    } catch (error) {
      console.error("❌ Error updating dress:", error);
      res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * DELETE DRESS
 * Important: Delete all images from Cloudinary before deleting the dress
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("========== DELETE DRESS REQUEST ==========");
    console.log("Dress ID:", id);
    
    // Find the dress first
    const dress = await Dress.findById(id);
    
    if (!dress) {
      return res.status(404).json({
        success: false,
        message: "Dress not found"
      });
    }
    
    // Collect all image URLs to delete
    const imagesToDelete = [];
    
    if (dress.images.cover) {
      imagesToDelete.push(dress.images.cover);
    }
    
    if (dress.images.gallery && dress.images.gallery.length > 0) {
      imagesToDelete.push(...dress.images.gallery);
    }
    
    // Delete images from Cloudinary
    if (imagesToDelete.length > 0) {
      await deleteCloudinaryImages(imagesToDelete);
    }
    
    // Delete the dress from database
    await Dress.findByIdAndDelete(id);
    
    console.log("✅ Dress deleted successfully:", id);
    res.status(200).json({
      success: true,
      message: "Dress deleted successfully",
      deletedId: id
    });
  } catch (error) {
    console.error("❌ Error deleting dress:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});
/**
 * GET SINGLE DRESS BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const dress = await Dress.findById(req.params.id);
    
    if (!dress) {
      return res.status(404).json({
        success: false,
        message: "Dress not found"
      });
    }
    
    console.log("✅ Dress fetched successfully:", dress._id);
    res.status(200).json({
      success: true,
      dress: dress
    });
  } catch (error) {
    console.error("❌ Error fetching dress:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});
export default router;