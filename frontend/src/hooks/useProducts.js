import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [psearch, setPsearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [homebestseller, sethomebestseller] = useState([]);
  const [storeinfo, setStoreinfo] = useState([]);
  const typingTimeoutRef = useRef(null);

  const loadProducts = useCallback(
    (targetPage = page, searchVal = psearch, catVal = selectedCategory) => {
      let endpoint = "/api/products";
      const params = { page: targetPage, limit: 20 };

      if (searchVal.trim()) {
        endpoint = "/api/products/search";
        params.q = searchVal.trim();
      } else if (catVal !== "All") {
        endpoint = `/api/products/category/${encodeURIComponent(catVal)}`;
      }

      api
        .get(endpoint, { params })
        .then((res) => {
          setProducts(res.data.products || []);
          setTotalPages(res.data.total_pages || 1);
        })
        .catch((err) => console.error(err));
    },
    [page, psearch, selectedCategory]
  );

  const loadbestsellerhome = useCallback(() => {
    api
      .get("/api/products/bestsellers")
      .then((res) => {
        const data = res.data.products ? res.data.products : res.data;
        sethomebestseller(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        sethomebestseller([]);
      });
  }, []);

  const loadstoreinfo = useCallback(() => {
    api
      .get("/api/products/store_details")
      .then((res) => setStoreinfo(res.data))
      .catch(() => console.log("failed to load details"));
  }, []);

  useEffect(() => {
    api
      .get("/api/products", { params: { page: 1, limit: 20 } })
      .then((res) => {
        setProducts(res.data.products || []);
        setTotalPages(res.data.total_pages || 1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    loadbestsellerhome();
    loadstoreinfo();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [loadbestsellerhome, loadstoreinfo]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
    loadProducts(1, psearch, cat);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    loadProducts(newPage, psearch, selectedCategory);
  };

  const handleProductSearch = (e) => {
    const value = e.target.value;
    setPsearch(value);
    setPage(1);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      loadProducts(1, value, selectedCategory);
    }, 500);
  };

  const clearSearch = () => {
    setPsearch("");
    setPage(1);
    loadProducts(1, "", selectedCategory);
  };

  const loadReview = (productId) => {
    if (selectedProductId === productId) {
      setSelectedProductId(null);
      setReviews([]);
      return;
    }
    api
      .get(`/api/reviews/${productId}`)
      .then((res) => {
        setReviews(res.data);
        setSelectedProductId(productId);
      })
      .catch((err) => console.error(err));
  };

  const selectedProduct = products.find((p) => p.product_id === selectedProductId);

  return {
    products,
    loading,
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
  };
}
