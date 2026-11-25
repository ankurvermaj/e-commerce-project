import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api";

export function useCart({ user, loadProducts, loadOrders }) {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    phone: "",
    city: "",
    pincode: "",
  });
  const navigate = useNavigate();

  const loadCart = useCallback(() => {
    return api.get("/api/cart").then((res) => setCart(res.data.items || []));
  }, []);

  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user, loadCart]);

  const getCartItem = (productId) => cart.find((item) => item.product_id === productId);

  const addtocart = (productId) => {
    if (!user) return toast.error("Please login first");
    api
      .post("/api/cart", null, { params: { product_id: productId } })
      .then(() => {
        loadCart();
        loadProducts();
      })
      .catch((err) => toast.error(err.response?.data?.detail || "Error"));
  };

  const increaseQty = (productId) => {
    api
      .put("/api/cart/increase", null, { params: { product_id: productId } })
      .then(() => {
        loadCart();
        loadProducts();
      });
  };

  const decreaseQty = (productId) => {
    api
      .put("/api/cart/decrease", null, { params: { product_id: productId } })
      .then(() => {
        loadCart();
        loadProducts();
      });
  };

  const checkout = async () => {
    try {
      const profileRes = await api.get("/api/auth/user/profile");
      const shippingDetails = profileRes.data;
      if (!shippingDetails.address || !shippingDetails.phone) {
        toast.error("Please complete your profile details before checking out!");
        navigate("/profile");
        return;
      }
      const storageKey = `checkout_idempotency_key_${user?.user_id || "anon"}`;
      let idempotencyKey = sessionStorage.getItem(storageKey);
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        sessionStorage.setItem(storageKey, idempotencyKey);
      }

      await api.post("/api/checkout", shippingDetails, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      sessionStorage.removeItem(storageKey);
      toast.success("Order Placed Successfully!");
      setCart([]);
      loadOrders();
      navigate("/orders");
    } catch (err) {
      toast.error("Checkout failed: " + (err.response?.data?.detail || "Error"));
    }
  };

  return {
    cart,
    setCart,
    formData,
    setFormData,
    getCartItem,
    addtocart,
    increaseQty,
    decreaseQty,
    checkout,
  };
}

