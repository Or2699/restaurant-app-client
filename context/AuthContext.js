import React , { createContext ,  useState , useEffect , useContext } from 'react';
import axios from 'axios';
import { ServerContext } from './ServerContext.js';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { API_URL } = useContext(ServerContext); // שימוש בכתובת מה-ServerContext
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null); // הוספת ה-State של השגיאה
    const [loading, setLoading] = useState(true); 

    // const themeColors = {
    //     background: isDark ? '#121212' : '#ffffff',
    //     text: isDark ? '#ffffff' : '#000000',
    //     inputBackground: isDark ? '#2c2c2c' : '#ffffff',
    //     placeholder: isDark ? '#aaaaaa' : '#888888',
    // };

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');
                if(savedToken && savedUser){
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`; //הגדרות טוקן לברירת מחדל לכל הבקשות של אקסיוס 
                }

              
            } 
            catch (err) { console.error("Failed to load stored auth data"); }
            finally{ setLoading(false); }
        };
        loadUserData();
    } , []);


    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { token: recievedToken, user: userData } = response.data;

            await AsyncStorage.setItem('token' , recievedToken); //שמירה 
            await AsyncStorage.setItem('user' , JSON.stringify(userData));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${recievedToken}`;

            setToken(recievedToken);
            setUser(userData);
            
            return { success: true };
        } 
        catch (err) {
            const errorMessage = err.response?.data?.message || "שגיאה בחיבור לשרת";
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } 
        finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, error, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};