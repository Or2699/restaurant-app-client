import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ServerContext = createContext();

export const ServerProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const API_URL = 'http://10.0.0.9:3020/api'; 
    
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
    const getActiveStaff = async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/active-staff`);
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
    const getActiveOrders = async () => {
        try {
             const response = await axios.get(`${API_URL}/orders/active`);
            return response.data;
        } 
        catch (error) {
            console.error("Error fetching active orders:", error);
            return [];
        }
    };

    return (
        <ServerContext.Provider value={{ API_URL, isConnected, loading, connectServer , getProducts , toggleShift, getActiveStaff , getActiveOrders}}>
            {children}
        </ServerContext.Provider>
    );
};