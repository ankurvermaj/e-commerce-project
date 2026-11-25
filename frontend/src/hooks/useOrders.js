import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api";

export function useOrders(user) {
  const [orders, setOrders] = useState([]);
  const [cancelingId, setCancelingId] = useState(null);

  const loadOrders = useCallback(() => {
    return api.get("/api/orders").then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data.orders || [];
      setOrders(data);
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  const cancelOrder = async (orderId) => {
    if (cancelingId === orderId) return;
    setCancelingId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      toast.success("Order cancelled");
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cancel failed");
    } finally {
      setCancelingId(null);
    }
  };

  return {
    orders,
    setOrders,
    loadOrders,
    cancelOrder,
  };
}

