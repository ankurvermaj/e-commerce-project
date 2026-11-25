import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api";

export function useAdminData(user) {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [adminOrders, setAdminOrders] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [pendingCost, setPendingCost] = useState(null);
  const [cancelledCost, setCancelledCost] = useState(null);
  const [orderRatio, setOrderRatio] = useState(null);
  const [categorySales, setCategorySales] = useState(null);

  const loadAdminStats = useCallback(() => {
    api.get("/api/admin/stats").then((res) => setStats(res.data));
    api.get("/api/admin/stats/monthly").then((res) => setMonthly(res.data));
  }, []);

  const loadAdminOrders = useCallback(() => {
    api
      .get("/api/admin/orders")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.orders || [];
        setAdminOrders(data);
      })
      .catch((err) => console.error("Admin orders failed:", err));
  }, []);

  const loadBestSellers = useCallback(() => {
    api
      .get("/api/admin/stats/bestsellers")
      .then((res) => setBestSellers(res.data.products || []))
      .catch((err) => console.error("Bestsellers failed:", err));
  }, []);

  const loadPendingCost = useCallback(() => {
    api
      .get("/api/admin/stats/pending")
      .then((res) => setPendingCost(res.data))
      .catch((err) => console.error("pending_cost:", err));
  }, []);

  const loadCancelledCost = useCallback(() => {
    api
      .get("/api/admin/stats/cancelled")
      .then((res) => setCancelledCost(res.data))
      .catch((err) => console.error("Cancelled_cost:", err));
  }, []);

  const loadOrderRatio = useCallback(() => {
    api
      .get("/api/admin/stats/order-ratio")
      .then((res) => setOrderRatio(res.data))
      .catch((err) => console.error(err));
  }, []);

  const loadCategorySales = useCallback(() => {
    api
      .get("/api/admin/stats/category_sales")
      .then((res) => setCategorySales(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      loadAdminStats();
      loadAdminOrders();
      loadBestSellers();
      loadPendingCost();
      loadCancelledCost();
      loadOrderRatio();
      loadCategorySales();
    }
  }, [
    user,
    loadAdminStats,
    loadAdminOrders,
    loadBestSellers,
    loadPendingCost,
    loadCancelledCost,
    loadOrderRatio,
    loadCategorySales,
  ]);

  const updateOrderStatus = (orderId, newStatus) => {
    api
      .put(`/api/admin/orders/${orderId}/status`, null, { params: { status: newStatus } })
      .then(() => {
        toast.success("Status updated");
        loadAdminOrders();
      })
      .catch((err) => toast.error(err.response?.data?.detail || "Update failed"));
  };

  return {
    stats,
    monthly,
    adminOrders,
    bestSellers,
    pendingCost,
    cancelledCost,
    orderRatio,
    categorySales,
    loadAdminStats,
    loadAdminOrders,
    loadBestSellers,
    loadPendingCost,
    loadCancelledCost,
    loadOrderRatio,
    loadCategorySales,
    updateOrderStatus,
  };
}

