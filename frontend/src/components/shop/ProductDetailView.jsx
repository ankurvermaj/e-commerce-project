export default function ProductDetailView({
  product,
  reviews,
  cartItem,
  onBack,
  onAddToCart,
  onIncreaseQty,
  onDecreaseQty,
  onAddToWishlist,
}) {
  return (
    <div className="product-detail-view-container">
      <div className="product-detail-view glass">
        <button className="back-btn" onClick={onBack}>
          ← Back to Products
        </button>
        <div className="detail-layout">
          <img src={product.image} alt={product.name} className="detail-img-large" />
          <div className="detail-info-content">
            <h2>{product.name}</h2>
            <div className="price-stock-row">
              <p className="price">₹{product.price}</p>
              <p className="qty">Stock: {product.qty}</p>
            </div>
            <div className="detail-actions">
              {cartItem ? (
                <div className="qty-controls">
                  <button onClick={() => onDecreaseQty(product.product_id)}>-</button>
                  <span>{cartItem.qty}</span>
                  <button onClick={() => onIncreaseQty(product.product_id)}>+</button>
                </div>
              ) : (
                <button
                  disabled={product.qty <= 0}
                  onClick={() => onAddToCart(product.product_id)}
                >
                  {product.qty <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              )}
              <button onClick={() => onAddToWishlist(product.product_id)}>Wishlist</button>
            </div>
            <div className="description-section">
              <h3>Description</h3>
              <p>{product.description || "No description available."}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="reviews-section">
        <h3>Customer Reviews</h3>
        {reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r._id} className="review-item">
              <p>
                <strong>{r.username}</strong> - {r.rating} ⭐
              </p>
              <p>{r.comment || <em>No written comment.</em>}</p>
            </div>
          ))
        ) : (
          <p>No reviews yet for this product.</p>
        )}
      </div>
    </div>
  );
}

