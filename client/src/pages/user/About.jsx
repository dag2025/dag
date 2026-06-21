import React, { useState, useEffect , useRef} from 'react';
import { Link } from 'react-router-dom';
import '../../styles/About.css';
import Img1 from "../../assets/img1.png";
import Img2 from  "../../assets/img2.png";
import Img3 from "../../assets/img3.png";
import Img4 from "../../assets/img4.png";
import Img5 from "../../assets/img5.png";

import audioFile from "../../assets/background.mp3"; // Replace with your music file path
// // Team Member Images (replace with actual image paths)
// import Founder1 from '../assets/team/founder1.jpg';
// import Founder2 from '../assets/team/founder2.jpg';
// import Founder3 from '../assets/team/founder3.jpg';
// import DeveloperImage from '../assets/team/developer.jpg';

// Default placeholder images (remove if you have actual images)
const defaultImages = {
  developer: 'https://via.placeholder.com/400x400?text=Developer',
  founder1: 'https://via.placeholder.com/300x300?text=Founder+1',
  founder2: 'https://via.placeholder.com/300x300?text=Founder+2',
  founder3: 'https://via.placeholder.com/300x300?text=Founder+3'
};

function About() {
  const [activeTab, setActiveTab] = useState('about');


  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Handle hash navigation
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveTab(hash);
      setTimeout(() => scrollToSection(hash), 100);
    }
  }, []);

    const audioRef = useRef(new Audio(audioFile)); // Replace with your music file path

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;

    // Start playing
    audio.play().catch(error => {
      console.log("Autoplay blocked by browser. User must click first.");
    });

    // Cleanup: Stops music when page/component closes
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return  (
    <div className="about-page container-fluid p-0">
{/* Hero Section */}
<section className="about-hero position-relative p-0 m-0">
  <div className="hero-img-section p-0">
    <img src={Img4} alt="Fashion collection 4" className='hero-img mt-4' style={{animationDelay: '0.5s'}} />
    <img src={Img1} alt="Fashion collection 1" className='hero-img mt-4' style={{animationDelay: '1.5s'}} />
    <img src={Img2} alt="Fashion collection 2" className='hero-img mt-4' style={{animationDelay: '2.5s'}} />
    <img src={Img3} alt="Fashion collection 3" className='hero-img mt-4' style={{animationDelay: '3.5s'}} />
    <img src={Img5} alt="Fashion collection 5" className='hero-img mt-4' style={{animationDelay: '4.5s'}} />
  </div>
  
  <div className="hero-content position-absolute top-50 start-50 translate-middle text-center w-100 container-fluid">
    <div className="container">
      <h1 className="hero-title text-white mt-4">DAG</h1>
      <p className="hero-subtitle ">Where Style Meets Excellence</p>
      <div className="hero-stats">
        <div className="stat-item">
          <span className="stat-number">10K+</span>
          <span className="stat-label text-white">Happy Customers</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">500+</span>
          <span className="stat-label text-white">Products</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">50+</span>
          <span className="stat-label text-white">Brands</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">24/7</span>
          <span className="stat-label text-white">Support</span>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Navigation Tabs */}
      <div className="about-nav  overflow-auto p-1 " >
        <div className="nav-container ">
          <button 
            className={`nav-btn ms-5 ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('about');
              scrollToSection('about');
            }}
          >
            <i className="bi bi-info-circle"></i> About Us
          </button>
          <button 
            className={`nav-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('privacy');
              scrollToSection('privacy');
            }}
          >
            <i className="bi bi-shield-lock"></i> Privacy Policy
          </button>
          <button 
            className={`nav-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('shipping');
              scrollToSection('shipping');
            }}
          >
            <i className="bi bi-truck"></i> Shipping Policy
          </button>
          <button 
            className={`nav-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('terms');
              scrollToSection('terms');
            }}
          >
            <i className="bi bi-file-text"></i> Terms of Service
          </button>
        </div>
      </div>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">About DAG Fashion</h2>
            <div className="title-underline"></div>
          </div>
          
          <div className="about-content">
            <div className="about-text">
              <h3>Our Story</h3>
              <p>
                Founded in 2023, DAG Fashion emerged from a passion for bringing 
                exceptional style to fashion enthusiasts across India. We believe 
                that fashion is more than just clothing—it's a form of self-expression, 
                confidence, and art.
              </p>
              <p>
                Our journey began with a simple mission: to curate the finest collection 
                of designer dresses and exquisite jewellery that blend traditional 
                craftsmanship with contemporary design. Today, we're proud to be a 
                trusted destination for fashion-forward individuals who seek quality, 
                style, and authenticity.
              </p>
              
              <div className="mission-vision">
                <div className="mission">
                  <i className="bi bi-bullseye"></i>
                  <h4>Our Mission</h4>
                  <p>To empower individuals through fashion by providing high-quality, 
                  trend-forward clothing and accessories that celebrate uniqueness and confidence.</p>
                </div>
                <div className="vision">
                  <i className="bi bi-eye"></i>
                  <h4>Our Vision</h4>
                  <p>To become India's most loved fashion destination, setting new standards 
                  in quality, customer experience, and sustainable fashion practices.</p>
                </div>
              </div>
            </div>
            
            <div className="about-image ">
              <img 
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3"
                alt="Fashion Boutique"
                onError={(e) => e.target.src = defaultImages.founder1}
                className='img-fluid'
              />
            </div>
          </div>

          {/* Values Section */}
          <div className="values-section">
            <h3 className="values-title">Our Core Values</h3>
            <div className="values-grid">
              <div className="value-card">
                <i className="bi bi-star-fill"></i>
                <h4>Quality First</h4>
                <p>We never compromise on quality, ensuring every product meets our highest standards.</p>
              </div>
              <div className="value-card">
                <i className="bi bi-heart-fill"></i>
                <h4>Customer Centric</h4>
                <p>Your satisfaction is our priority, and we go above and beyond to exceed expectations.</p>
              </div>
              <div className="value-card">
                <i className="bi bi-globe"></i>
                <h4>Sustainability</h4>
                <p>Committed to ethical sourcing and sustainable practices for a better tomorrow.</p>
              </div>
              <div className="value-card">
                <i className="bi bi-brush"></i>
                <h4>Innovation</h4>
                <p>Constantly evolving to bring you the latest trends and technologies.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="founders-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet Our Founders</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">The visionaries behind DAG Fashion</p>
          </div>
          
          <div className="founders-grid">
            <div className="founder-card">
              <div className="founder-image">
                <img src={ defaultImages.founder1} alt="Founder 1" />
                <div className="founder-social">
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i></a>
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-twitter"></i></a>
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-instagram"></i></a>
                </div>
              </div>
              <div className="founder-info">
                <h3>Divya Agarwal</h3>
                <span className="founder-role">CEO & Co-Founder</span>
                <p>A fashion enthusiast with 10+ years of experience in the fashion industry, 
                Divya brings creative vision and strategic leadership to DAG Fashion.</p>
              </div>
            </div>

            <div className="founder-card">
              <div className="founder-image">
                <img src={ defaultImages.founder2} alt="Founder 2" />
                <div className="founder-social">
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i></a>
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-twitter"></i></a>
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-instagram"></i></a>
                </div>
              </div>
              <div className="founder-info">
                <h3>Ankit Sharma</h3>
                <span className="founder-role">COO & Co-Founder</span>
                <p>Operations expert with a passion for logistics and customer experience, 
                ensuring seamless delivery and service excellence.</p>
              </div>
            </div>

            <div className="founder-card">
              <div className="founder-image">
                <img src={ defaultImages.founder3} alt="Founder 3" />
                <div className="founder-social">
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i></a>
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-twitter"></i></a>
                  <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-instagram"></i></a>
                </div>
              </div>
              <div className="founder-info">
                <h3>Riya Mehta</h3>
                <span className="founder-role">Creative Director & Co-Founder</span>
                <p>Award-winning fashion designer with a keen eye for trends, 
                curating collections that inspire and delight.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="developer-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet the Developer</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">The tech wizard behind DAG Fashion</p>
          </div>
          
          <div className="developer-card">
            <div className="developer-image">
              <img src={ defaultImages.developer} alt="Lead Developer" />
            </div>
            <div className="developer-info">
              <h3>Rahul Verma</h3>
              <span className="developer-role">Lead Full Stack Developer</span>
              <div className="developer-bio">
                <p>Rahul is a passionate software engineer with 6+ years of experience in 
                building scalable web applications. He specializes in React.js, Node.js, 
                and modern web technologies. At DAG Fashion, he's responsible for creating 
                seamless shopping experiences and innovative features like AI-powered styling 
                assistance and personalized recommendations.</p>
                <p>When not coding, Rahul enjoys contributing to open-source projects, 
                mentoring young developers, and exploring new technologies. He believes 
                in writing clean, maintainable code and delivering exceptional user experiences.</p>
              </div>
              <div className="developer-skills">
                <span className="skill-tag">React.js</span>
                <span className="skill-tag">Node.js</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">MongoDB</span>
                <span className="skill-tag">AWS</span>
                <span className="skill-tag">AI/ML</span>
              </div>
              <div className="developer-social">
                <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-github"></i> GitHub</a>
                <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i> LinkedIn</a>
                <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-twitter"></i> Twitter</a>
                <a href="#" target="_blank" rel="noopener noreferrer"><i className="bi bi-envelope"></i> Email</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy Section */}
      <section id="privacy" className="policy-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Privacy Policy</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">Last updated: March 2024</p>
          </div>
          
          <div className="policy-content">
            <div className="policy-block">
              <h3><i className="bi bi-info-circle"></i> Information We Collect</h3>
              <p>We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact customer support. This may include your name, email address, 
              shipping address, payment information, and browsing preferences.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-gear"></i> How We Use Your Information</h3>
              <ul>
                <li>Process your orders and payments</li>
                <li>Communicate with you about orders, products, and promotions</li>
                <li>Personalize your shopping experience</li>
                <li>Improve our website and services</li>
                <li>Protect against fraudulent transactions</li>
              </ul>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-shield-check"></i> Data Security</h3>
              <p>We implement industry-standard security measures to protect your personal information. 
              All transactions are encrypted using SSL technology, and we never store sensitive payment 
              information on our servers.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-cookie"></i> Cookies</h3>
              <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize 
              content. You can control cookie preferences through your browser settings.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-envelope"></i> Contact Us</h3>
              <p>For privacy-related inquiries, please contact us at: <strong>privacy@dagfashion.com</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Policy Section */}
      <section id="shipping" className="policy-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shipping Policy</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">Fast & Reliable Delivery Across India</p>
          </div>
          
          <div className="policy-content">
            <div className="policy-block">
              <h3><i className="bi bi-truck"></i> Shipping Options & Rates</h3>
              <ul>
                <li><strong>Standard Shipping:</strong> 3-5 business days - Free on orders above ₹999</li>
                <li><strong>Express Shipping:</strong> 1-2 business days - ₹99 flat rate</li>
                <li><strong>Same Day Delivery:</strong> Available in select cities - ₹199 flat rate</li>
              </ul>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-clock-history"></i> Order Processing Time</h3>
              <p>Orders are processed within 24 hours of confirmation. You will receive a confirmation 
              email with tracking information once your order ships.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-geo-alt"></i> Delivery Areas</h3>
              <p>We currently ship across all major cities in India. For remote areas, delivery may take 
              5-7 business days. International shipping coming soon!</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-box-seam"></i> Tracking Your Order</h3>
              <p>Track your order in real-time through our website or app. You'll receive SMS and email 
              updates at every stage of delivery.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-arrow-return-left"></i> Shipping Issues</h3>
              <p>If you experience any issues with your delivery, contact our support team within 48 hours 
              for immediate assistance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms of Service Section */}
      <section id="terms" className="policy-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Terms of Service</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">Last updated: March 2024</p>
          </div>
          
          <div className="policy-content">
            <div className="policy-block">
              <h3><i className="bi bi-file-text"></i> Acceptance of Terms</h3>
              <p>By accessing and using DAG Fashion, you agree to be bound by these Terms of Service. 
              If you do not agree, please do not use our services.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-cart"></i> Orders & Payments</h3>
              <ul>
                <li>All orders are subject to availability and confirmation</li>
                <li>Prices are subject to change without notice</li>
                <li>We accept all major credit cards, UPI, and net banking</li>
                <li>We reserve the right to refuse or cancel orders at our discretion</li>
              </ul>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-arrow-repeat"></i> Returns & Refunds</h3>
              <ul>
                <li>30-day return policy for unused items in original packaging</li>
                <li>Refunds processed within 7-10 business days</li>
                <li>Exchange available for size issues</li>
                <li>Clearance items are final sale</li>
              </ul>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-c-circle"></i> Intellectual Property</h3>
              <p>All content on this site, including images, text, logos, and designs, is the property 
              of DAG Fashion and protected by copyright laws.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-shield-exclamation"></i> Limitation of Liability</h3>
              <p>DAG Fashion shall not be liable for any indirect, incidental, or consequential damages 
              arising from the use of our services or products.</p>
            </div>

            <div className="policy-block">
              <h3><i className="bi bi-envelope"></i> Contact Information</h3>
              <p>For questions about these terms, contact us at: <strong>legal@dagfashion.com</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h3>Stay Updated with DAG Fashion</h3>
            <p>Subscribe to our newsletter for exclusive offers, style tips, and new arrivals</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;