import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Ad from "../models/Ads.js";
import Dress from "../models/Dress.js";
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
 * Helper function to delete media from Cloudinary
 */
const deleteCloudinaryMedia = async (url) => {
  if (!url) return;
  const publicId = extractPublicId(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted ad media: ${publicId}`);
    } catch (error) {
      console.error(` Error deleting media ${publicId}:`, error);
    }
  }
};

/**
 * GET ALL PRODUCTS FOR LINKING (Dresses & Jewellery)
 */
router.get("/products", async (req, res) => {
  try {
    const [dresses, jewellery] = await Promise.all([
      Dress.find().select('name category images.cover price finalPrice'),
      Jewellery.find().select('name category image price finalPrice')
    ]);

    const products = [
      ...dresses.map(d => ({
        _id: d._id,
        name: d.name,
        category: d.category,
        image: d.images?.cover || null,
        price: d.price,
        finalPrice: d.finalPrice,
        type: 'dress'
      })),
      ...jewellery.map(j => ({
        _id: j._id,
        name: j.name,
        category: j.category,
        image: j.image || null,
        price: j.price,
        finalPrice: j.finalPrice,
        type: 'jewellery'
      }))
    ];

    res.status(200).json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error(" Error fetching products:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * CREATE AD
 */
router.post(
  "/",
  upload.single("media"),
  async (req, res) => {
    try {
      const { body, file } = req;
      
      console.log("========== CREATE AD REQUEST ==========");
      console.log("Body fields:", Object.keys(body));
      console.log("Media Type:", body.mediaType);
      console.log("File:", file ? file.originalname : "No file");

      // Validate required fields
      if (!body.title) {
        return res.status(400).json({
          success: false,
          message: "Ad title is required"
        });
      }

      if (!body.mediaType || !['image', 'video'].includes(body.mediaType)) {
        return res.status(400).json({
          success: false,
          message: "Valid media type (image/video) is required"
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Media file is required"
        });
      }

      // Upload media to Cloudinary
      console.log("Uploading ad media to Cloudinary...");
      const uploadedMedia = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        { 
          folder: "ads",
          resource_type: body.mediaType === 'video' ? 'video' : 'image'
        }
      );

      // Create ad WITHOUT linked product initially
      const ad = await Ad.create({
        title: body.title,
        mediaType: body.mediaType,
        mediaUrl: uploadedMedia.secure_url,
        mediaPublicId: uploadedMedia.public_id,
        //  Don't include linkedProduct here
        status: body.status || 'active'
      });

      console.log(" Ad created successfully:", ad._id);
      res.status(201).json({
        success: true,
        message: "Ad created successfully. You can now link a product.",
        ad: ad
      });
    } catch (error) {
      console.error(" Error creating ad:", error);
      res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET ALL ADS
 */
router.get("/", async (req, res) => {
  try {
    const ads = await Ad.find()
      .sort({ createdAt: -1 })
      .populate('productDetails');
    
    res.status(200).json({
      success: true,
      count: ads.length,
      ads: ads
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * GET SINGLE AD BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('productDetails');
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }
    
    res.status(200).json({
      success: true,
      ad: ad
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * LINK PRODUCT TO AD
 */
router.put("/:id/link-product", async (req, res) => {
  try {
    const { id } = req.params;
    const { productType, productId } = req.body;

    console.log("========== LINK PRODUCT TO AD ==========");
    console.log("Ad ID:", id);
    console.log("Product Type:", productType);
    console.log("Product ID:", productId);

    // Validate product type
    if (!productType || !['dress', 'jewellery'].includes(productType)) {
      return res.status(400).json({
        success: false,
        message: "Valid product type (dress/jewellery) is required"
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Check if product exists
    const ProductModel = productType === 'dress' ? Dress : Jewellery;
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `${productType} not found with ID: ${productId}`
      });
    }

    // Update ad with linked product
    const ad = await Ad.findByIdAndUpdate(
      id,
      {
        linkedProduct: {
          productType,
          productId
        }
      },
      { new: true, runValidators: true }
    ).populate('productDetails');

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }

    console.log("Product linked to ad successfully:", ad._id);
    res.status(200).json({
      success: true,
      message: "Product linked successfully",
      ad: ad
    });
  } catch (error) {
    console.error("Error linking product to ad:", error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * UPDATE AD
 */
router.put(
  "/:id",
  upload.single("media"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { body, file } = req;
      
      console.log("========== UPDATE AD REQUEST ==========");
      console.log("Ad ID:", id);
      console.log("File:", file ? file.originalname : "No new file");

      // Find existing ad
      const existingAd = await Ad.findById(id);
      if (!existingAd) {
        return res.status(404).json({
          success: false,
          message: "Ad not found"
        });
      }

      // Handle media update
      let mediaUrl = existingAd.mediaUrl;
      let mediaPublicId = existingAd.mediaPublicId;

      if (file) {
        // Delete old media from Cloudinary
        if (existingAd.mediaPublicId) {
          await deleteCloudinaryMedia(existingAd.mediaUrl);
        }
        
        // Upload new media
        console.log("Uploading new ad media to Cloudinary...");
        const uploadedMedia = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { 
            folder: "ads",
            resource_type: body.mediaType === 'video' ? 'video' : 'image'
          }
        );
        mediaUrl = uploadedMedia.secure_url;
        mediaPublicId = uploadedMedia.public_id;
      }

      // Update ad
      const updatedAd = await Ad.findByIdAndUpdate(
        id,
        {
          title: body.title || existingAd.title,
          mediaType: body.mediaType || existingAd.mediaType,
          mediaUrl: mediaUrl,
          mediaPublicId: mediaPublicId,
          status: body.status || existingAd.status
        },
        { new: true, runValidators: true }
      ).populate('productDetails');

      console.log("Ad updated successfully:", updatedAd._id);
      res.status(200).json({
        success: true,
        message: "Ad updated successfully",
        ad: updatedAd
      });
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(400).json({ 
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * DELETE AD
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("========== DELETE AD REQUEST ==========");
    console.log("Ad ID:", id);
    
    // Find the ad first
    const ad = await Ad.findById(id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }
    
    // Delete media from Cloudinary
    if (ad.mediaPublicId) {
      await deleteCloudinaryMedia(ad.mediaUrl);
    }
    
    // Delete the ad from database
    await Ad.findByIdAndDelete(id);
    
    console.log("Ad deleted successfully:", id);
    res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
      deletedId: id
    });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * TRACK AD CLICK
 */
router.post("/:id/click", async (req, res) => {
  try {
    const { id } = req.params;
    
    const ad = await Ad.findByIdAndUpdate(
      id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Click tracked successfully",
      clicks: ad.clicks
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

/**
 * TRACK AD VIEW
 */
router.post("/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    
    const ad = await Ad.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "View tracked successfully",
      views: ad.views
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

export default router;