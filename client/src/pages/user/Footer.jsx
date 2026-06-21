import {useState} from 'react';

function Footer() {
    const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

    const handleSubmit = (e) => {
    e.preventDefault(); // Prevents page reload
    
    // Regex for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email)) {
      setMessage('Success! Your email has been submitted. you will receive updates on exclusive offers and events.');
      setIsError(false);
    } else {
      setMessage('Please enter a valid email address.');
      setIsError(true);
    }
  };
  return (
    <>
      <style>
        {`
          footer {
            background-color: #ed3545;
            color: #ffffff;
            padding: 60px 0 20px 0; /* More breathing room */
          margin-top:-23px;
          }
          footer a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: all 0.3s ease;
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
          }
          footer a:hover {
            color: #ffffff;
            padding-left: 5px; /* Subtle slide effect */
            text-decoration:underline white;
          }
          footer strong {
            display: block;
            margin-bottom: 20px;
            font-size: 16px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .footer-input-group {
            display: flex;
            margin-bottom: 15px;
          }
          footer input {
            padding: 10px 15px;
            border: none;
            border-radius: 4px 0 0 4px;
            font-size: 14px;
            width: 100%;
            outline: none;
          }
          .footer-btn {
            background-color: #333;
            color: white;
            border: none;
            padding: 0 15px;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
            transition: background 0.3s;
          }
          .footer-btn:hover {
            background-color: #000;
          }
          .social-icons .bi {
            color: #ffffff;
            font-size: 22px;
            transition: transform 0.3s ease, opacity 0.3s;
            opacity: 0.8;
          }
          .social-icons .bi:hover {
            opacity: 1;
            transform: translateY(-3px);
          }
          .copyright-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-style: italic;
            opacity: 0.7;
            font-size: 13px;
          }
        `}
      </style>

      <footer className="container-fluid">
        <div className="container"> {/* Added inner container for better alignment */}
          <div className="row g-4">
            {/* Column 1 */}
            <div className="col-md-3">
              <strong>Customer Service</strong>
              <a href={`/contact`}>Contact Us</a>
              <a href={`/contact`}>FAQs & Help</a>
              <a href={`/contact`}>Returns & Exchanges</a>
            </div>

            {/* Column 2 */}
            <div className="col-md-3">
              <strong>Company</strong>
              <a href={`/about`}>About Us</a>
              <a href={`/about`}>Privacy Policy</a>
              <a href={`/about`}>Shipping Policy</a>
              <a href={`/about`}>Terms of Service</a>
            </div>

            {/* Column 3 - Newsletter/WhatsApp */}
            <div className="col-md-6 col-lg-4 ms-auto">
              <strong>Stay Connected</strong>
              <p style={{fontSize: '14px', marginBottom: '15px'}}>
                Join our membership for exclusive deals and events.
              </p>
              <div className="footer-input-group">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="footer-btn" onClick={handleSubmit}>
                  Join
                </button><br />
                     {/* Show message below */}
 
              </div>
              <div>
                     {message && (
        <small className='' style={{ color: isError ? 'black' : 'lightgreen' , fontSize: '11px', marginBottom: '15px' }}>
          {message}
        </small>
      )}
              </div>
              <div className="social-icons d-flex gap-4 mt-4">
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="#"><i className="bi bi-instagram"></i></a>
                <a href="#"><i className="bi bi-linkedin"></i></a>
                <a href="#"><i className="bi bi-youtube"></i></a>
              </div>
            </div>
          </div>

          <div className="row copyright-section">
            <div className="col-12 text-center">
              <p className="mb-0">&copy; {new Date().getFullYear()} DAG. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;