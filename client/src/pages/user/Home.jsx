import React, { useState, useEffect } from 'react';
import VideoAds from "../../components/VideoAd";
import ImageAd from "../../components/ImageAd";
import OutfitRecommendations from "../../AI/OutfitRecommendation";
import AIChat from "../../AI/AIChat";
import { BestOfferForDress, BestOfferForJewel } from "../../components/BestOffers";
import NewArrivalsDress from '../../components/NewArrivalsDress';
import NewArrivalsJewellery from '../../components/NewArrivalsJewellery';
import BestSellers from '../../components/BestSellers';
import JewellweyBanner from '../../assets/jewel-banner.svg';
import DressBanner from '../../assets/dress-banner.svg';
import Image1 from "../../assets/img1.png";
import Image2 from "../../assets/img2.png";
import Image3 from "../../assets/img3.png";
import Image4 from "../../assets/img4.png";
import Image5 from "../../assets/img5.png";
import '../../styles/Home.css';

function Home() {
  const images = [Image1, Image2, Image3, Image4, Image5];
  const [index, setIndex] = useState(0);
  const [isGradient, setIsGradient] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      // Rotate image index
      setIndex((prev) => (prev + 1) % images.length);
      // Toggle gradient
      setIsGradient((prev) => !prev);
    }, 2000); // Set to 2s to match your image timing or 5000 for 5s
    
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="container-fluid mb-3 ">
      <div className="image-ad">
        <ImageAd />
      </div>

      <div className="p-2">
        <BestSellers />
        <div className="mt-2 mb-2">
          <img src={JewellweyBanner} alt="Jewellery-Banner" className="img-fluid Jewellery-Banner" style={{ borderRadius: '0px' }} />
        </div>
        <BestOfferForJewel />
        <NewArrivalsJewellery />
        
        <VideoAds />

        <div className="mt-2 mb-2">
          <img src={DressBanner} alt="Dress-Banner" className="img-fluid Dress-Banner" style={{ borderRadius: '0px' }} />
        </div>
        <BestOfferForDress />
        <NewArrivalsDress />

        <OutfitRecommendations />
        <AIChat />

        {/* Hero Section with Swapping and Gradient Logic */}
        <div className="row hero-section-wrapper mb-1">
          <div className="col left-col d-flex justify-content-center">
            <div className="hero-wrapper">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="hero"
                  className={index === i ? "hero-section-img active" : "hero-section-img"}
                />
              ))}
            </div>
          </div>

          <div className={`col mt-5 hero-section-text right-col gradient-section ${isGradient ? 'text-gradient-active' : ''}`}>
            <h1 className='text-center'>DAG</h1><br />
            <strong>The Story :</strong><br />
            <small className='text-small'>
              Founded in 2023, DAG Fashion emerged from a passion for bringing exceptional style to fashion enthusiasts across India. We believe that fashion is more than just clothing—it's a form of self-expression, confidence, and art.
              <br /><br />
              Our journey began with a simple mission: to curate the finest collection of designer dresses and exquisite jewellery that blend traditional craftsmanship with contemporary design.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
