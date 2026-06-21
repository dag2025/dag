import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext';
import { PublicRoute, PrivateRoute, AdminRoute } from './components/ProtectedRoute'
import { OrderProvider } from './context/OrderContext';

import Logo from './assets/logo.png'

import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'

// user pages
import Home from './pages/user/Home'
import Dress from './pages/user/Dress'
import ViewDress from './pages/user/ViewDress'
import Jewellery from './pages/user/Jewellery'
import ViewJewellery from './pages/user/ViewJewellery'
import Login from './pages/user/Login'
import SignUp from './pages/user/SignUp'
import Cart from './pages/user/Cart'
import Combo from './pages/user/Combo'
import Profile from './pages/user/Profile'
import Search from './pages/user/Search'
import Checkout from './pages/user/Checkout'
import Order from './pages/user/Order'
import Category from './pages/user/Category';
import Wishlist from './pages/user/Wishlist';
import About from './pages/user/About';
import Contact from './pages/user/Contact';

// admin pages
import Dashboard from './pages/admin/Dashboard'
import DressManagement from './pages/admin/DressManagement'
import JewelleryManagement from './pages/admin/JewelleryManagement'
import AdsManagement from './pages/admin/AdManagement'
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';


import { useEffect } from 'react';

const PageTitle = ({ title, children }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return children;
};



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
        <Routes>
          {/* USER ROUTES - Public Layout */}
          <Route path="/" element={<UserLayout />}>
            {/* Public Routes - accessible to everyone */}
            <Route index element={ <PageTitle title="DAG | Home"><Home /></PageTitle>} />
            <Route path='dress' element={<PageTitle title="DAG | Dress Collections"><Dress /></PageTitle>} />
            <Route path="dress/:id" element={ <PageTitle title="DAG | Dress Details"><ViewDress /></PageTitle> } />
            <Route path='jewellery' element={<PageTitle title="DAG | Jewellery Collections"><Jewellery /></PageTitle>} />
            <Route path="jewellery/:id" element={<PageTitle title="DAG | Jewellery Details"><ViewJewellery /></PageTitle>} />
              <Route path="search" element={<PageTitle title="DAG | Search "><Search /></PageTitle>} />
               <Route path='contact' element={<PageTitle title="DAG | Contact"><Contact /></PageTitle>} />
              <Route path='about' element={<PageTitle title="DAG | About"><About /></PageTitle>} />
              <Route path="category" element={<PageTitle title="DAG | Category"><Category /></PageTitle>} />
            <Route path='cart' element={<PrivateRoute><PageTitle title="DAG | Cart"><Cart /></PageTitle></PrivateRoute>} />
            <Route path='combos' element={<PrivateRoute> <PageTitle title="DAG | Combos & Gifts"><Combo /></PageTitle></PrivateRoute>} />
            {/* Auth Routes - redirect to home if already logged in */}
            <Route path='login' element={
              <PublicRoute>
                 <PageTitle title="DAG | Login"><Login /></PageTitle>
              </PublicRoute>
            } />
            <Route path='signup' element={
              <PublicRoute>
                <PageTitle title="DAG | Sign Up"><SignUp /></PageTitle>
              </PublicRoute>
            } />
<Route path="profile" element={ <PrivateRoute> <PageTitle title="DAG | Profile"><Profile /></PageTitle></PrivateRoute>} />
<Route path="wishlist" element={ <PrivateRoute> <PageTitle title="DAG | Wishlist"><Wishlist /></PageTitle></PrivateRoute>} />
 <Route path="checkout" element={ <PrivateRoute> <PageTitle title="DAG | Checkout"><Checkout /></PageTitle></PrivateRoute>} />    
 
  <Route path="orders" element={ <PrivateRoute><OrderProvider>   <PageTitle title="DAG | Orders"><Order /></PageTitle> </OrderProvider>   </PrivateRoute>} />  
  
          </Route>

          {/* ADMIN ROUTES - require admin role */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={ <PageTitle title="DAG | Dashboard"><Dashboard /></PageTitle>} />
            <Route path="dress-management" element={ <PageTitle title="DAG | Dress Management"><DressManagement /></PageTitle> }/>
            <Route path="jewellery-management" element={ <PageTitle title="DAG | Jewellery Management"><JewelleryManagement /></PageTitle>} />
            <Route path="ads-management" element={ <PageTitle title="DAG | Ads Management"><AdsManagement /></PageTitle> } />
             <Route path="order-management" element={ <PageTitle title="DAG | Order Management"><OrderManagement /></PageTitle> } />
            {/* Optional admin routes (uncomment when created) */}
            <Route path="user-management" element={ <PageTitle title="DAG | User Management"><UserManagement /></PageTitle> }/>
           
          </Route>

          {/* 404 Route - catch all unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Simple 404 component
const NotFound = () => (
  <div className="text-center text-white mt-5 m-5 py-5 d-flex flex-column align-items-center justify-content-center bg-dark " >
    <img src={Logo} alt="Logo"  className="mb-4 " style={{ width: '150px' }} />
    <h1 className="display-1 fw-bold">404</h1>
    <p className="lead">Page not found</p>
    <a href="/" className="btn btn-outline-light mt-3"> <i className="bi bi-house-door text-white"></i> Go Home</a>
  </div>
)

export default App