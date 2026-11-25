import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api";

export function useWishlist(user) {
  const [wishlist, setWishlist] = useState([]);

  const loadwishlist = useCallback(() => {
    return api.get("/api/wishlist").then((res) => setWishlist(res.data.items || []));
  }, []);

  useEffect(() => {
    if (user) {
      loadwishlist();
    }
  }, [user, loadwishlist]);

  const addtowishlist = (productId) => {
    if (!user) return toast.error("Please login first");
    api
      .post("/api/wishlist", null, { params: { product_id: productId } })
      .then(() => loadwishlist())
      .catch((err) => toast.error(err.response?.data?.detail || "Error"));
  };

  const removeFromWishlist = (productId) => {
    api
      .delete(`/api/wishlist/${productId}`)
      .then(() => loadwishlist())
      .catch((err) => console.error("Failed to remove from wishlist", err));
  };

  return {
    wishlist,
    setWishlist,
    addtowishlist,
    removeFromWishlist,
  };
}

