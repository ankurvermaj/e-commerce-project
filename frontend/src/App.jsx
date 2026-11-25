import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import "./App.css";
import AdminDashboard from "./AdminDashboard";
import Navbar from "./Navbar";
import CartPage from "./CartPage";
import OrdersPage from "./OrdersPage";
import LoginPage from "./LoginPage";
import ProfilePage from "./ProfilePage";
import Wishlist from "./Wishlist";
import LandingPage from "./LandingPage";
import ForgotPassword from "./ForgotPassword";
import Aboutus from "./Aboutus";
import Register from "./Register";
import TicketRaiser from "./TicketRaiser";
import Pagenotfound from "./Pagenotfound";
import ShopPage from "./components/shop/ShopPage";
import SessionWarningModal from "./components/SessionWarningModal";
import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import { useOrders } from "./hooks/useOrders";
import { useCart } from "./hooks/useCart";
import { useWishlist } from "./hooks/useWishlist";
import { useAdminData } from "./hooks/useAdminData";

export default function App() {
  const {
    user,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    SetLoginError,
    showSessionWarning,
    setShowSessionWarning,
    login,
    handleLogout,
  } = useAuth();

  const {
    products,
    psearch,
    selectedCategory,
    page,
    totalPages,
    reviews,
    selectedProduct,
    setSelectedProductId,
    homebestseller,
    storeinfo,
    loadProducts,
    handleCategoryChange,
    handlePageChange,
    handleProductSearch,
    clearSearch,
    loadReview,
  } = useProducts();

  const { orders, loadOrders, cancelOrder } = useOrders(user);
  const {
    cart,
    formData,
    setFormData,
    getCartItem,
    addtocart,
    increaseQty,
    decreaseQty,
    checkout,
  } = useCart({ user, loadProducts, loadOrders });
  const { wishlist, addtowishlist, removeFromWishlist } = useWishlist(user);
  const adminData = useAdminData(user);

  return (
    <div>
      <Toaster position="top-right" />
      <Navbar
        user={user}
        cartCount={cart.length}
        onLogout={handleLogout}
        wishlistCount={wishlist.length}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Routes>
          <Route
            path="/"
            element={<LandingPage homebestseller={homebestseller} storeinfo={storeinfo} />}
          />
          <Route
            path="/shop"
            element={
              <ShopPage
                products={products}
                selectedProduct={selectedProduct}
                setSelectedProductId={setSelectedProductId}
                reviews={reviews}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                psearch={psearch}
                onProductSearch={handleProductSearch}
                onClearSearch={clearSearch}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onLoadReview={loadReview}
                getCartItem={getCartItem}
                onAddToCart={addtocart}
                onIncreaseQty={increaseQty}
                onDecreaseQty={decreaseQty}
                onAddToWishlist={addtowishlist}
              />
            }
          />
          <Route
            path="/cart"
            element={
              user ? (
                <CartPage
                  cart={cart}
                  checkout={checkout}
                  increaseQty={increaseQty}
                  decreaseQty={decreaseQty}
                  setFormData={setFormData}
                  formData={formData}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/orders"
            element={
              user ? (
                <OrdersPage orders={orders} cancelOrder={cancelOrder} reloadOrders={loadOrders} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/wishlist"
            element={
              user ? (
                <Wishlist
                  wishlist={wishlist}
                  removeFromWishlist={removeFromWishlist}
                  addtocart={addtocart}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/profile"
            element={user ? <ProfilePage user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={
              <LoginPage
                user={user}
                login={login}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loginError={loginError}
                SetLoginError={SetLoginError}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/aboutus" element={<Aboutus />} />
          <Route
            path="/support"
            element={user ? <TicketRaiser /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={
              user?.role === "admin" ? (
                <AdminDashboard
                  user={user}
                  stats={adminData.stats}
                  monthly={adminData.monthly}
                  adminOrders={adminData.adminOrders}
                  updateOrderStatus={adminData.updateOrderStatus}
                  bestSellers={adminData.bestSellers}
                  pendingCost={adminData.pendingCost}
                  cancelledCost={adminData.cancelledCost}
                  products={products}
                  loadProducts={loadProducts}
                  loadAdminStats={adminData.loadAdminStats}
                  loadAdminOrders={adminData.loadAdminOrders}
                  loadBestSellers={adminData.loadBestSellers}
                  loadPendingCost={adminData.loadPendingCost}
                  loadCancelledCost={adminData.loadCancelledCost}
                  loadOrderRatio={adminData.loadOrderRatio}
                  loadCategorySales={adminData.loadCategorySales}
                  orderRatio={adminData.orderRatio}
                  categorySales={adminData.categorySales}
                  showSessionWarning={showSessionWarning}
                  setShowSessionWarning={setShowSessionWarning}
                />
              ) : (
                <Pagenotfound />
              )
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Pagenotfound />} />
        </Routes>
        <SessionWarningModal
          show={showSessionWarning}
          onStayLoggedIn={() => setShowSessionWarning(false)}
          onLogout={handleLogout}
        />
      </motion.div>
    </div>
  );
}
