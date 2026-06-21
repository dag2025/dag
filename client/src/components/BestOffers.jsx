import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// ==================== DEBUG SETUP ====================
const DEBUG = true;

const debugLog = (component, message, data = null) => {
    if (!DEBUG) return;
    console.log(`🔍 [${component}] ${message}`, data || '');
};

const debugError = (component, error) => {
    console.error(`❌ [${component}] Error:`, error);
    if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
    }
};

// ==================== BEST OFFERS FOR DRESS ====================
export function BestOfferForDress() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debug, setDebug] = useState({});

    useEffect(() => {
        debugLog('BestOfferForDress', 'Component mounted');
        fetchBestOfferForDress();
    }, []);

    const fetchBestOfferForDress = async () => {
        debugLog('BestOfferForDress', 'Fetching dresses...');
        try {
            setLoading(true);
            const [dressesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/dresses')
            ]);

            debugLog('BestOfferForDress', 'API Response:', dressesRes.data);

            // Get dresses and add type
            const dresses = dressesRes.data.dresses?.map(d => ({ ...d, type: 'dress' })) || [];
            debugLog('BestOfferForDress', `Fetched ${dresses.length} dresses`);

            // Calculate discounts for all dresses
            const dressesWithDiscount = dresses.map(item => ({
                ...item,
                discountPercent: calculateDiscount(item.price, item.finalPrice)
            }));
            
            debugLog('BestOfferForDress', 'Discounts calculated:', dressesWithDiscount.map(d => ({
                name: d.name,
                price: d.price,
                finalPrice: d.finalPrice,
                discount: d.discountPercent
            })));

            // Filter products with any discount (> 0%)
            const hasDiscount = dressesWithDiscount.filter(item => item.discountPercent > 0);
            debugLog('BestOfferForDress', `Products with discount: ${hasDiscount.length}`);

            // Sort by highest discount first and take first 10
            const sorted = hasDiscount
                .sort((a, b) => b.discountPercent - a.discountPercent)
                .slice(0, 10);

            debugLog('BestOfferForDress', `Top 10 offers:`, sorted.map(s => ({
                name: s.name,
                discount: s.discountPercent + '%'
            })));

            setProducts(sorted);
            setDebug({
                totalDresses: dresses.length,
                withDiscount: hasDiscount.length,
                topOffers: sorted.length
            });

        } catch (err) {
            debugError('BestOfferForDress', err);
            setError('Failed to load best offers');
        } finally {
            setLoading(false);
        }
    };

    const calculateDiscount = (price, finalPrice) => {
        if (!price || !finalPrice || price === finalPrice) return 0;
        return Math.round(((price - finalPrice) / price) * 100);
    };

    const styles = {
        container: {
            maxWidth: '98%',
            margin: '0 auto',
            padding: '5px',
           marginTop: '10px',
        },
        debugPanel: {
            background: '#f0f0f0',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: '1px solid #ddd'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
        },
        title: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#333',
            position: 'relative',
            paddingLeft: '15px'
        },
        titleAccent: {
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '24px',
            background: 'linear-gradient(135deg, #ed3545, #ff6b6b)',
            borderRadius: '2px'
        },
        viewAll: {
            color: '#ed3545',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        scrollContainer: {
            display: 'flex',
            overflowX: 'auto',
            gap: '20px',
            padding: '10px 0 20px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#ed3545 #f0f0f0',
            WebkitOverflowScrolling: 'touch'
        },
        card: {
            flex: '0 0 auto',
            width: '250px',
            background: 'white',
            borderRadius: '5px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        imageContainer: {
            position: 'relative',
            width: '100%',
            height: '300px',
            overflow: 'hidden'
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
        },
        offerBadge: {
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(135deg, #ffc107, #ff9800)',
            color: '#333',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(255,193,7,0.3)'
        },
        discountBadge: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#28a745',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(40,167,69,0.3)'
        },
        Bestoverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 3,
            borderRadius: '16px'
        },
        BestviewBtn: {
            background: '#ed3545',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            transform: 'translateY(20px)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'inline-block'
        },
        content: {
            padding: '16px'
        },
        productName: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            margin: '0 0 5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        type: {
            fontSize: '13px',
            color: '#999',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        typeIcon: {
            fontSize: '14px'
        },
        priceContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            flexWrap: 'wrap'
        },
        finalPrice: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#ed3545'
        },
        originalPrice: {
            fontSize: '14px',
            color: '#999',
            textDecoration: 'line-through'
        },
        metaContainer: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
        },
        metaTag: {
            background: '#f0f0f0',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#666'
        },
        loadingContainer: {
            textAlign: 'center',
            padding: '40px'
        },
        spinner: {
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #ed3545',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
        },
        errorContainer: {
            textAlign: 'center',
            padding: '40px',
            color: '#dc3545'
        },
        emptyContainer: {
            textAlign: 'center',
            padding: '40px',
            color: '#999'
        },
        Link:{
textDecoration:'none',
        },
    };

    // Add global styles
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .offer-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 24px rgba(237,53,69,0.15);
            }
            
            .offer-card:hover .card-image {
                transform: scale(1.08);
            }
            
            .offer-card:hover .card-overlay {
                opacity: 1;
            }
            
            .offer-card:hover .view-btn {
                transform: translateY(0);
            }
            
            .scroll-container::-webkit-scrollbar {
                height: 6px;
            }
            
            .scroll-container::-webkit-scrollbar-track {
                background: #f0f0f0;
                border-radius: 10px;
            }
            
            .scroll-container::-webkit-scrollbar-thumb {
                background: #ed3545;
                border-radius: 10px;
            }
            
            .scroll-container::-webkit-scrollbar-thumb:hover {
                background: #d42c3a;
            }
            
            .view-all-link:hover {
                color: #d42c3a !important;
            }
        `;
        document.head.appendChild(styleSheet);

        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading best offers for dresses...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '40px' }}></i>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
  

            <div style={styles.header}>
                <div style={styles.title} className="text-uppercase">
                    <span style={styles.titleAccent}></span>
                    Best Offers on Dresses
                </div>
                <Link to="/dress" style={{...styles.viewAll, className: "view-all-link"}}>
                    View All <i className="bi bi-arrow-right"></i>
                </Link>
            </div>

            {products.length === 0 ? (
                <div style={styles.emptyContainer}>
                    <i className="bi bi-tag" style={{ fontSize: '40px', color: '#ccc' }}></i>
                    <p>No special offers available at the moment</p>
                </div>
            ) : (
                <div className="scroll-container" style={styles.scrollContainer}>
                    {products.map((product) => {
                        const discountPercent = calculateDiscount(product.price, product.finalPrice);

                        return (
                            <div 
                                key={product._id} 
                                className="offer-card"
                                style={styles.card}
                            >
                                  <Link 
                                            to={`/dress/${product._id}`} 
                                          style={styles.Link}
                                        >
                                <div style={styles.imageContainer}>
                                    <img 
                                        className="card-image"
                                        src={product.images?.cover || 'https://via.placeholder.com/280x300'} 
                                        alt={product.name}
                                        style={styles.image}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/280x300'}
                                    />
                                    
                                    <span style={styles.offerBadge}> BEST OFFER</span>
                                    {discountPercent > 0 && (
                                        <span style={styles.discountBadge}>{discountPercent} % OFF</span>
                                    )}
                                    
                                    
                                </div>

                                <div style={styles.content}>
                                    <h4 style={styles.productName}>{product.name}</h4>
                                    <p style={styles.type}>
                                       
                                        Dress
                                    </p>
                                    
                                    <div style={styles.priceContainer}>
                                        <span style={styles.finalPrice}>₹{product.finalPrice}</span>
                                        {discountPercent > 0 && (
                                            <span style={styles.originalPrice}>₹{product.price}</span>
                                        )}
                                    </div>

                                </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ==================== BEST OFFERS FOR JEWELLERY ====================
export function BestOfferForJewel() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debug, setDebug] = useState({});

    useEffect(() => {
        debugLog('BestOfferForJewel', 'Component mounted');
        fetchBestOfferForJewel();
    }, []);

    const fetchBestOfferForJewel = async () => {
        debugLog('BestOfferForJewel', 'Fetching jewellery...');
        try {
            setLoading(true);
            const [jewelleryRes] = await Promise.all([
                axios.get('http://localhost:5000/api/jewellery')
            ]);

            debugLog('BestOfferForJewel', 'API Response:', jewelleryRes.data);

            // Get jewellery and add type
            const jewellery = jewelleryRes.data.jewellery?.map(j => ({ ...j, type: 'jewellery' })) || [];
            debugLog('BestOfferForJewel', `Fetched ${jewellery.length} jewellery items`);

            // Calculate discounts for all jewellery
            const jewelleryWithDiscount = jewellery.map(item => ({
                ...item,
                discountPercent: calculateDiscount(item.price, item.finalPrice)
            }));
            
            debugLog('BestOfferForJewel', 'Discounts calculated:', jewelleryWithDiscount.map(d => ({
                name: d.name,
                price: d.price,
                finalPrice: d.finalPrice,
                discount: d.discountPercent
            })));

            // Filter products with any discount (> 0%)
            const hasDiscount = jewelleryWithDiscount.filter(item => item.discountPercent > 0);
            debugLog('BestOfferForJewel', `Jewellery with discount: ${hasDiscount.length}`);

            // Sort by highest discount first and take first 10
            const sorted = hasDiscount
                .sort((a, b) => b.discountPercent - a.discountPercent)
                .slice(0, 10);

            debugLog('BestOfferForJewel', `Top 10 offers:`, sorted.map(s => ({
                name: s.name,
                discount: s.discountPercent + '%'
            })));

            setProducts(sorted);
            setDebug({
                totalJewellery: jewellery.length,
                withDiscount: hasDiscount.length,
                topOffers: sorted.length
            });

        } catch (err) {
            debugError('BestOfferForJewel', err);
            setError('Failed to load best offers');
        } finally {
            setLoading(false);
        }
    };

    const calculateDiscount = (price, finalPrice) => {
        if (!price || !finalPrice || price === finalPrice) return 0;
        return Math.round(((price - finalPrice) / price) * 100);
    };

    const styles = {
        container: {
            maxWidth: '98%',
            margin: '0 auto',
            padding: '5px',
            marginTop: '10px',
        },
        debugPanel: {
            background: '#f0f0f0',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: '1px solid #ddd'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
        },
        title: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#333',
            position: 'relative',
            paddingLeft: '15px'
        },
        titleAccent: {
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '24px',
            background: 'linear-gradient(135deg, #ed3545, #ff6b6b)',
            borderRadius: '2px'
        },
        viewAll: {
            color: '#ed3545',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        scrollContainer: {
            display: 'flex',
            overflowX: 'auto',
            gap: '20px',
            padding: '10px 0 20px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#ed3545 #f0f0f0',
            WebkitOverflowScrolling: 'touch'
        },
        card: {
            flex: '0 0 auto',
            width: '250px',
            background: 'white',
            borderRadius: '5px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        imageContainer: {
            position: 'relative',
            width: '100%',
            height: '280px',
            overflow: 'hidden'
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
        },
        offerBadge: {
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(135deg, #ffc107, #ff9800)',
            color: '#333',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(255,193,7,0.3)'
        },
        discountBadge: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#28a745',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(40,167,69,0.3)'
        },
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 3,
            borderRadius: '16px'
        },
        viewBtn: {
            background: '#ed3545',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            transform: 'translateY(20px)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'inline-block'
        },
        content: {
            padding: '16px'
        },
        productName: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            margin: '0 0 5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        type: {
            fontSize: '13px',
            color: '#999',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        typeIcon: {
            fontSize: '14px'
        },
        priceContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
        },
        finalPrice: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#ed3545'
        },
        originalPrice: {
            fontSize: '14px',
            color: '#999',
            textDecoration: 'line-through'
        },
        metaContainer: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
        },
        metaTag: {
            background: '#f0f0f0',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#666'
        },
        loadingContainer: {
            textAlign: 'center',
            padding: '40px'
        },
        spinner: {
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #ed3545',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
        },
        errorContainer: {
            textAlign: 'center',
            padding: '40px',
            color: '#dc3545'
        },
        emptyContainer: {
            textAlign: 'center',
            padding: '40px',
            color: '#999'
        },
        Link:{
            textDecoration:'none',
        },
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading best offers for jewellery...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '40px' }}></i>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            

            <div style={styles.header}>
                <div style={styles.title} className="text-uppercase">
                    <span style={styles.titleAccent}></span>
                    Best Offers on Jewellery
                </div>
                <Link to="/jewellery" style={{...styles.viewAll, className: "view-all-link"}}>
                    View All <i className="bi bi-arrow-right"></i>
                </Link>
            </div>

            {products.length === 0 ? (
                <div style={styles.emptyContainer}>
                    <i className="bi bi-tag" style={{ fontSize: '40px', color: '#ccc' }}></i>
                    <p>No special offers available at the moment</p>
                </div>
            ) : (
                <div className="scroll-container" style={styles.scrollContainer}>
                    {products.map((product) => {
                        const discountPercent = calculateDiscount(product.price, product.finalPrice);

                        return (
                            <div 
                                key={product._id} 
                                className="offer-card"
                                style={styles.card}
                            >
                                   <Link 
                                            to={`/jewellery/${product._id}`} 
                                            
                                            style={styles.Link}
                                        >
                                <div style={styles.imageContainer}>
                                    <img 
                                        className="card-image"
                                        src={product.image || 'https://via.placeholder.com/280x280'} 
                                        alt={product.name}
                                        style={styles.image}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/280x280'}
                                    />
                                    
                                    <span style={styles.offerBadge}>BEST OFFER</span>
                                    {discountPercent > 0 && (
                                        <span style={styles.discountBadge}>{discountPercent} % OFF</span>
                                    )}
                                    
                                    
                                     
                                          
                                       
                                   
                                </div>

                                <div style={styles.content}>
                                    <h4 style={styles.productName}>{product.name}</h4>
                                    <p style={styles.type}>
                                       
                                        Jewellery
                                    </p>
                                    
                                    <div style={styles.priceContainer}>
                                        <span style={styles.finalPrice}>₹{product.finalPrice}</span>
                                        {discountPercent > 0 && (
                                            <span style={styles.originalPrice}>₹{product.price}</span>
                                        )}
                                    </div>

                                 
                                </div>
                                 </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Export both components
export default {
    BestOfferForDress,
    BestOfferForJewel
};