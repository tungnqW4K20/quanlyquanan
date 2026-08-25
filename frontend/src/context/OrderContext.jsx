import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderCart, setOrderCart] = useState([]);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const { addToast } = useToast();

  const triggerTableRefresh = useCallback(() => {
    setTableRefreshKey((prev) => prev + 1);
  }, []);

  const openOrderDrawer = useCallback((table) => {
    setSelectedTable(table);
    setOrderCart([]);
    setIsOrderDrawerOpen(true);
  }, []);

  const closeOrderDrawer = useCallback(() => {
    setIsOrderDrawerOpen(false);
    setSelectedTable(null);
    setOrderCart([]);
  }, []);

  const openCheckoutModal = useCallback((table, order) => {
    setCheckoutTarget({ table, order });
    setIsCheckoutModalOpen(true);
  }, []);

  const closeCheckoutModal = useCallback(() => {
    setIsCheckoutModalOpen(false);
    setCheckoutTarget(null);
  }, []);

  const addToCart = useCallback((item, customNotes = '') => {
    setOrderCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === item.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
          notes: customNotes || updated[existingIdx].notes
        };
        addToast(`Đã tăng số lượng: ${item.name} (${updated[existingIdx].quantity})`, 'success');
        return updated;
      } else {
        addToast(`Đã thêm "${item.name}" vào giỏ`, 'success');
        return [
          ...prev,
          {
            id: item.id,
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            unit: item.unit,
            quantity: 1,
            notes: customNotes
          }
        ];
      }
    });
  }, [addToast]);

  const updateCartQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setOrderCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
    );
  }, []);

  const updateCartItemNotes = useCallback((itemId, notes) => {
    setOrderCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notes } : item))
    );
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setOrderCart((prev) => prev.filter((item) => item.id !== itemId));
    addToast('Đã bỏ món khỏi giỏ', 'info');
  }, [addToast]);

  const clearCart = useCallback(() => {
    setOrderCart([]);
  }, []);

  const cartTotal = orderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <OrderContext.Provider
      value={{
        selectedTable,
        orderCart,
        isOrderDrawerOpen,
        isCheckoutModalOpen,
        checkoutTarget,
        tableRefreshKey,
        cartTotal,
        openOrderDrawer,
        closeOrderDrawer,
        openCheckoutModal,
        closeCheckoutModal,
        addToCart,
        updateCartQuantity,
        updateCartItemNotes,
        removeFromCart,
        clearCart,
        triggerTableRefresh
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
