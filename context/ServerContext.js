import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ServerContext = createContext();

export const ServerProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const API_URL = 'http://10.0.0.9:3020/api'; 

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


    useEffect(() => {
        connectServer();
    }, []);

    return (
        <ServerContext.Provider value={{ API_URL, isConnected, loading, connectServer }}>
            {children}
        </ServerContext.Provider>
    );
};