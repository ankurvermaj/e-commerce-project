import { Search, X } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import ProductDetailView from "./ProductDetailView";

const CATEGORIES = ["All", "Electronics", "Clothing", "Books", "Home", "Sports"];

export default function ShopPage({
  products,
  selectedProduct,
  setSelectedProductId,
  reviews,
  selectedCategory,
  onCategoryChange,
  psearch,
  onProductSearch,
  onClearSearch,
  page,
  totalPages,
  onPageChange,
  onLoadReview,
  getCartItem,
  onAddToCart,
  onIncreaseQty,
  onDecreaseQty,
  onAddToWishlist,
}) {
  return (
    <div className="container">
      {selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          reviews={reviews}
          cartItem={getCartItem(selectedProduct.product_id)}
          onBack={() => setSelectedProductId(null)}
          onAddToCart={onAddToCart}
          onIncreaseQty={onIncreaseQty}
          onDecreaseQty={onDecreaseQty}
          onAddToWishlist={onAddToWishlist}
        />
      ) : (
        <>
          <div className="category-container scroll-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => onCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-bar">
            <Search className="search-icon-inner" size={18} />
            <input placeholder="search products" value={psearch} onChange={onProductSearch} />
            {psearch && <X className="clear-search" size={18} onClick={onClearSearch} />}
          </div>

          <h2>{selectedCategory === "All" ? "All Products" : `${selectedCategory} Products`}</h2>

          <div className="products-grid">
            {products.map((p) => {
              const cartItem = getCartItem(p.product_id);
              const qty = cartItem ? cartItem.qty : 0;
              return (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="product-card glass"
                  key={p.product_id}
                  onClick={() => onLoadReview(p.product_id)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={p.image} width="80" alt={p.name} />
                  <p className="name">
                    <strong>{p.name}</strong>
                  </p>
                  <p className="price">₹{p.price}</p>
                  <p className="qty">Stock: {p.qty}</p>
                  {qty === 0 ? (
                    <button
                      disabled={p.qty <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(p.product_id);
                      }}
                    >
                      {p.qty <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  ) : (
                    <div className="qty-controls">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDecreaseQty(p.product_id);
                        }}
                      >
                        -
                      </button>
                      <span>{qty}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onIncreaseQty(p.product_id);
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div
            className="pagination-controls"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
