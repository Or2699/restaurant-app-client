import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert , Platform } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import { CartContext } from '../../context/CartContext';
import { useNavigation } from 'expo-router';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';


const CartScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const { cart, updateQuantity, removeFromCart, clearCart } = useContext(CartContext); 
    const { user, token } = useContext(AuthContext);
    const { createOrder , getMyOrders } = useContext(ServerContext);
    const navigation = useNavigation();
    const isRtl = language === 'he';
    const textAlign = isRtl ? 'right' : 'left';

    // חישוב סך הכל
    const totalPrice = cart.reduce((sum, item) => {
        const itemPrice = item.product?.price ? Number(item.product.price) : 0;
        const itemQuantity = item.quantity ? Number(item.quantity) : 0;
        return sum + (itemPrice * itemQuantity);
    }, 0);

    // התראת אישור לפני מחיקת כל העגלה
    const handleClearCart = () => {
        if (Platform.OS === 'web') {
            const confirmMsg = language === 'he' ? 'האם אתה בטוח שברצונך לבטל את ההזמנה?' : 'Are you sure you want to cancel the order?';
            if (window.confirm(confirmMsg)) {
                clearCart();
            }
        } 
        else {
            Alert.alert(
                t('clear_cart_title') || (language === 'he' ? 'ריקון העגלה' : 'Clear Cart'),
                t('clear_cart_confirm') || (language === 'he' ? 'האם אתה בטוח שברצונך לבטל את ההזמנה ולרוקן את העגלה?' : 'Are you sure you want to empty the cart?'),
                [
                    { text: t('cancel') || (language === 'he' ? 'ביטול' : 'Cancel'), style: 'cancel' },
                    { text: t('yes_clear') || (language === 'he' ? 'כן, רוקן עגלה' : 'Yes, clear'), onPress: () => clearCart(), style: 'destructive' }
                ]
            );
        }
    };


    // שליחת ההזמנה לשרת (מטבח)
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            const myOrders = await getMyOrders(token);
            const activeOrder = myOrders ? myOrders.find(o => o.status !== 'paid') : null;
            const finalTableNumber = activeOrder ? activeOrder.tableNumber : (user?.tableNumber || Math.floor(Math.random() * 100) + 1);

            const orderPayload = {
                items: cart.map(item => ({
                    product: item.product._id, 
                    quantity: item.quantity,
                    notes: item.notes || ""
                })),
                totalPrice: totalPrice,
                tableNumber: finalTableNumber 
            };

            const res = await createOrder(orderPayload, token);          
            
            if (res.success) { 
                clearCart(); 
                
                if (Platform.OS === 'web') 
                    window.alert(language === 'he' ? `ההזמנה נשלחה! (שולחן ${orderPayload.tableNumber})` : `Order Sent! (Table ${orderPayload.tableNumber})`);
                else {
                    Alert.alert(
                        language === 'he' ? 'הזמנה נשלחה!' : 'Order Sent!',
                        language === 'he' ? `ההזמנה שלך (שולחן ${orderPayload.tableNumber}) הועברה למטבח 🧑‍🍳` : `Your order (Table ${orderPayload.tableNumber}) has been sent to the kitchen 🧑‍🍳`
                    );
                }

                if (navigation.canGoBack()) {
                    navigation.goBack();
                } 
                else {
                    navigation.navigate('(screens)/customerMenuScreen');
                }
            } 
            else {
                if (Platform.OS === 'web') {
                    window.alert(res.error || 'שגיאה בשליחת ההזמנה');
                } 
                else {
                    Alert.alert(language === 'he' ? 'שגיאה' : 'Error', res.error || 'Failed to send order');
                }
            }
        } 
        catch (error) {
            console.error("Checkout Error:", error);
            if (Platform.OS === 'web') {
                window.alert('שגיאה בתקשורת מול השרת');
            } 
            else {
                Alert.alert(language === 'he' ? 'שגיאה' : 'Error', 'הייתה בעיה בשליחת ההזמנה');
            }
        }
    };



    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('my_orders') || 'העגלה שלי'} />

            {cart.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={theme.text} style={{ opacity: 0.2, marginBottom: 20 }} />
                    <Text style={{ color: theme.text, fontSize: 18, opacity: 0.6 }}> {language === 'he' ? 'העגלה שלך ריקה כרגע' : 'Your cart is currently empty'}  </Text>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() =>{ if (navigation.canGoBack()) {navigation.goBack();} else {navigation.navigate('(screens)/customerMenuScreen');}}} >
                        <Text style={styles.backBtnText}> {language === 'he' ? 'חזרה לתפריט' : 'Back to Menu'}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* כפתור רוקן עגלה למעלה */}
                    <TouchableOpacity style={{ padding: 15, alignSelf: isRtl ? 'flex-start' : 'flex-end' }} onPress={handleClearCart} >
                        <Text style={{ color: '#E63946', fontWeight: 'bold', fontSize: 14 }}> {t('clear_cart') || (language === 'he' ? 'ביטול הזמנה 🗑️' : 'Cancel Order 🗑️')}</Text>                    
                    </TouchableOpacity>

                    <FlatList 
                        data={cart}
                        keyExtractor={(item, index) => item.product._id + index.toString()}
                        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <View style={[styles.cartItem, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]}>                               
                                {item.product.image ? (
                                    <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                                ) : (
                                    <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.background }]}>
                                        <Ionicons name="restaurant" size={24} color={theme.text} opacity={0.3} />
                                    </View>
                                )}
                                
                                {/* פרטי המנה וכפתורי פלוס/מינוס */}
                                <View style={[styles.itemInfo, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                                    <Text style={[styles.itemName, { color: theme.text, textAlign }]}>{item.product.name?.[language] || item.product.name?.he}</Text>                                   
                                    {item.notes ? (
                                        <Text style={{ color: '#E63946', fontSize: 12, marginTop: 4 }}>* {item.notes}</Text>
                                    ) : null}

                                    {/* בקרת כמויות */}
                                    <View style={[styles.quantityControl, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <TouchableOpacity onPress={() => updateQuantity(item.product._id, item.notes, item.quantity - 1)} style={[styles.qtyBtn, { borderColor: theme.border }]} >
                                            <Ionicons name="remove" size={16} color={theme.text} />
                                        </TouchableOpacity>                                       
                                        <Text style={{ marginHorizontal: 12, fontWeight: 'bold', color: theme.text, fontSize: 16 }}> {item.quantity}</Text>                                       
                                        <TouchableOpacity onPress={() => updateQuantity(item.product._id, item.notes, item.quantity + 1)} style={[styles.qtyBtn, { borderColor: theme.border }]}>
                                            <Ionicons name="add" size={16} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                {/* מחיר וכפתור מחיקה */}
                                <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }}>
                                    <TouchableOpacity onPress={() => removeFromCart(item.product._id, item.notes)} style={{ marginBottom: 15 }} >
                                        <Ionicons name="trash-outline" size={22} color="#E63946" />
                                    </TouchableOpacity>
                                    
                                    <Text style={[styles.itemPrice, { color: theme.primary }]}>₪{item.product.price * item.quantity}</Text>
                                </View>
                            </View>
                        )}
                    />

                    {/* שורת סיכום ותשלום למטה */}
                    <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                            <Text style={{ color: theme.text, opacity: 0.7, fontSize: 14 }}>{language == 'he' ? 'סך הכל לתשלום:' : 'Total to Pay:'}</Text>
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 22 }}>₪{totalPrice.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: '#2ECC71' }]} onPress={handleCheckout} >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}> {language == 'he' ? 'סיום ההזמנה' : 'Checkout'}</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backBtn: { marginTop: 20, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cartItem: { padding: 10, borderRadius: 15, borderWidth: 1, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    itemImage: { width: 70, height: 70, borderRadius: 10, marginHorizontal: 10, alignSelf: 'center' },
    itemImagePlaceholder: { width: 70, height: 70, borderRadius: 10, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
    itemInfo: { flex: 1, paddingHorizontal: 5, justifyContent: 'center' },
    itemName: { fontSize: 16, fontWeight: 'bold' },
    quantityControl: { marginTop: 10, alignItems: 'center' },
    qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    itemPrice: { fontSize: 16, fontWeight: 'bold' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 5 },
    checkoutBtn: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 15, elevation: 3 }
});

export default CartScreen;