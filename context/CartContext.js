// הצלחת של המשתמש 

import React , {createContext , useContext , useState , useEffect} from "react";
import { AuthContext } from "./AuthContext.js";

export const CartContext = createContext();

export const CartProvider = ({children}) => {
    const[cart , setCart] = useState([]);
    const { user } = useContext(AuthContext);

    // הוספת מנה לעגלה
    const addToCart = (product, quantity, notes = "") => {
        setCart((prevCart) => {
            const existingItemIndex = prevCart.findIndex((item) => item.product._id === product._id); // // בדיקה אם המנה כבר קיימת בעגלה (עם אותן הערות)
            if(existingItemIndex > -1) {
                const newCart =[...prevCart];
                newCart[existingItemIndex].quantity += quantity; // מוסיפים את הכמות שהועברה כפרמטר 
                 return newCart;
            } 
            else { return [... prevCart , { product, quantity, notes }]; } //הוספת פריט חדש לעגלה 
        });
    };


    // הסרת מנה מהעגלה
    const removeFromCart = (productId , notes) => {
        setCart((prevCart) => prevCart.filter((item) => !(item._id === productId && item.notes === notes))); // מסננים את העגלה ומחזירים רק את הפריטים שלא תואמים למנה ולערות שהועברו כפרמטר
    };


    // עדכון כמות של פריט ספציפי
    const updateQuantity = (productId , notes , newQuantity) => {
        if(newQuantity <= 0){
            removeFromCart(productId , notes); // אם הכמות החדשה היא 0 או פחות, נסיר את הפריט מהעגלה
            return;
        }

         setCart((prevCart) => {
            prevCart.map((item) => (item._id === productId && item.notes === notes) ? {...item , quantity : newQuantity} : item); 
         });
   };


   // ניקוי העגלה (למשל אחרי ביצוע הזמנה)
   const clearCart = () => { setCart([]); };

   // חישוב סכום כולל
   const totalPrice = cart.reduce((total , item) => total + item.product.price * item.quantity , 0);

   // איפוס עגלה כשהמשתמש מתנתק
   useEffect(() => {
        if(!user) 
            setCart([]);
   }, [user]);


   return(
        <CartContext.Provider value = {{ cart , addToCart , removeFromCart , updateQuantity , clearCart , totalPrice}}>
            {children}
        </CartContext.Provider>
   );
};
