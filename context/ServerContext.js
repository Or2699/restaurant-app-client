import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';


export const ServerContext = createContext();

export const ServerProvider = ({ children }) => { // config 
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const API_URL = 'http://10.0.0.6:3020/api'; 
    
    const getProducts = async () => {
        try {
            const response = await axios.get(`${API_URL}/products`);
            return response.data;
        } catch (error) { return []; }
    }


    const connectServer = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/products`); 
            if (response.status === 200) {
                setIsConnected(true);
                console.log("Connected to Server Successfully!");
            }
        } 
        catch (error) {
            setIsConnected(false);
            console.error("Server connection failed:", error.message);
        } 
        finally {
            setLoading(false);
        }
    };


    // פונקציה להחלפת סטטוס משמרת (כניסה/יציאה) 
    const toggleShift = async (userId) => {
        try {
            const response = await axios.patch(`${API_URL}/auth/toggle-shift/${userId}`);
            return response.data;
        } 
        catch (err) { console.error("Error toggling shift:", err); return { success: false }; }
    };


    //  פונקציה למשיכת עובדים פעילים
    const getActiveStaff = async (token) => {
        try {
           const response = await axios.get(`${API_URL}/auth/active-staff`, { headers: { Authorization: `Bearer ${token}`} });            
           return response.data; 
        } catch (error) {
            console.error("Error fetching staff:", error);
            return [];
        }
    };

    useEffect(() => {
        connectServer();
    }, []);


    // פונקציה למשיכת שולחנות פעילים 
    const getActiveOrders = async (token) => {
        try {
            const response = await axios.get(`${API_URL}/orders/active`, { headers: { Authorization: `Bearer ${token}`}});
            return response.data;
        } 
        catch (error) {
            console.error("Error fetching active orders:", error);
            return [];
        }
    };


    // פונקציה לעדכון סטטוס של הזמנה קיימת 
    const updateOrderStatus = async (orderId , newStatus , token) => {
        try {
            const response = await axios.patch( `${API_URL}/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` }} );
            if(response.status === 200){
                const updatedOrders = await getActiveOrders(token);
                return { success: true, data: updatedOrders };
            }
        } 
        catch (err) {
            console.error("Update status error:", err.response?.data || err.message);
            return {
                success : false ,
                error : err.response?.data?.message || "Failed to update status"
            }
        }
    };


    // משיכת ההודעה לבאנר הרץ התחתון
    const getAnnouncement = async() => {
        try {
            const res = await axios.get(`${API_URL}/settings/announcement`);
            return res.data;
        } 
        catch (err) {
            console.error("Error fetching announcement:", err);
            return { he: "ברוכים הבאים!", en: "Welcome!" };
        }
    };


    // עדכון הודעת הבאנר - רק למנהל 
    const updateAnnouncement = async (announcementData, token) => {
        try {
            const res = await axios.patch(`${API_URL}/settings/announcement` , announcementData, { headers: { Authorization: `Bearer ${token}` }});
            return { success: true, data: res.data };
        } 
        catch (err) { return { success: false, message: err.message }; }
    };


    // משיכת עובדים שממתינים לאישור 
    const getPendingStaff = async (token) => {
        try {
            console.log("Token going to server:", token);
            const response = await axios.get(`${API_URL}/auth/pending-staff`, { headers: { Authorization: `Bearer ${token}` }});
            return response.data;
        } 
        catch (err) {
            console.error("Error fetching pending staff:", err);
            return [];
        }
    };


    // אישור או דחייה של עובד
    const approveStaffMember = async (userId, token, isApproved) => {
        try {
            const response = await axios.patch(`${API_URL}/auth/approve-staff/${userId}`, { isApproved },{ headers: { Authorization: `Bearer ${token}` } });
            return { success: true, data: response.data };
        } 
        catch (err) { return { success: false, message: err.message }; }
    };


    // משיכת כל חברי הצוות המאושרים 
    const getAllStaff = async (token) => {
        try {
            const response = await axios.get(`${API_URL}/auth/all-staff`, { headers: { Authorization: `Bearer ${token}`}});
            return response.data;
        } 
        catch (error) {
            console.error("Error fetching all staff:", error);
            return [];
        }
    };

    // עדכון שכר שעתי לעובד
    const updateStaffWage = async (userId, newWage, token) => {
        try {
            const response = await axios.patch(`${API_URL}/auth/update-wage/${userId}`,{ hourlyWage: newWage },{ headers: { Authorization: `Bearer ${token}` } });
            return { success: true, data: response.data };
        } 
        catch (error) {
            console.error("Error updating wage:", error);
            return { success: false, message: error.response?.data?.message || "Failed to update wage" };
        }
    };


    // מתן בונוס לעובד
    const addStaffBonus = async (userId, bonusAmount, token) => {
        try {
            const response = await axios.patch(`${API_URL}/auth/add-bonus/${userId}`, { bonusAmount }, { headers: { Authorization: `Bearer ${token}` } });
            return { success: true, data: response.data };
        } 
        catch (err) {
            return { success: false, message: err.response?.data?.message || err.message };
        }
    };

    // סגירת חודש ותשלום לכולם
    const resetAllWages = async (token) => {
        try {
            const response = await axios.post(`${API_URL}/auth/reset-wages`, {}, { headers: { Authorization: `Bearer ${token}` } });
            return { success: true, data: response.data };
        } 
        catch (err) {
            return { success: false, message: err.response?.data?.message || err.message };
        }
    };


    // משיכת היסטוריית הזמנות ללוח הבקרה
    const getOrderHistory = async(token) => {
        try {
            const response = await axios.get(`${API_URL}/orders/history`, {headers: { Authorization: `Bearer ${token}`}});
            return response.data;
        } 
        catch (err) {
            console.error("Error fetching order history:", err);
            return [];
        }
    };


    // הוספת מנה חדשה
    const createProduct = async (token, productData) => {
        try {
            const response = await axios.post(`${API_URL}/products`, productData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error creating product:", error.response?.data || error.message);
            return null;
        }
    };

    // עדכון מנה קיימת
    const updateProduct = async (token, productId, productData) => {
        try {
            const response = await axios.put(`${API_URL}/products/${productId}`, productData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating product:", error.response?.data || error.message);
            return null;
        }
    };

    // מחיקת מנה
    const deleteProduct = async (token, productId) => {
        try {
            const response = await axios.delete(`${API_URL}/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error deleting product:", error.response?.data || error.message);
            return null;
        }
    };


    // עדכון מנות בתוך הזמנה פתוחה (מחיקה/עריכה)
    const updateOrderItems = async (orderId, updatedItems, token) => {
        try {
            const response = await axios.put(`${API_URL}/orders/${orderId}/items`, 
                { items: updatedItems },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Error updating order items:", error);
            return { success: false, error: error.response?.data?.message || 'Update failed' };
        }
    };


    // יצירת הזמנה חדשה או הוספה לשולחן קיים שליחה למטבח 
    const createOrder = async (orderData, token) => {
        try {
            const response = await axios.post(`${API_URL}/orders`, orderData,{ headers: { Authorization: `Bearer ${token}` } });
            return { success: true, data: response.data };
        } 
        catch (error) {
            console.error("Error creating order:", error);
            return { success: false, error: error.response?.data?.message || 'Failed to send order' };
        }
    };


    // פונקציה לשיוך הזמנה לשולחן קיים למלצר שמטפל בו
    const assignWaiterToOrder = async (orderId, token) => {
        try {
            const response = await axios.patch(`${API_URL}/orders/${orderId}/assign`, {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return { success: true, data: response.data }; 
            
        } 
        catch (error) {
            console.error("Error assigning waiter:", error.response?.data?.message || error.message);
            return { success: false };
        }
    };


    // ביטול ומחיקת הזמנה שלמה (רק לממתינות)
    const deleteOrder = async (orderId, token) => {
        try {
            const response = await axios.delete(`${API_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Error deleting order:", error.response?.data?.message || error.message);
            return { success: false };
        }
    };


    return (
        <ServerContext.Provider value={{ API_URL, isConnected, loading, connectServer , getProducts , toggleShift, getActiveStaff , getActiveOrders , updateOrderStatus , getAnnouncement , updateAnnouncement , getPendingStaff , approveStaffMember , getAllStaff , updateStaffWage , addStaffBonus , resetAllWages , getOrderHistory , createProduct , updateProduct , deleteProduct , updateOrderItems , createOrder , assignWaiterToOrder , deleteOrder }}>
            {children}
        </ServerContext.Provider>
    );
};