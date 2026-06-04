import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Dimensions  } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import Header from '../../components/header';
import DishCard from '../../components/DishCard';
import AddToCartModal from '../../components/AddToCartModal';
import { useWindowDimensions } from 'react-native';



const MenuScreen = () => {
    const { width } = useWindowDimensions();
    const { theme, t, language } = useContext(ThemeContext);
    const { user, token } = useContext(AuthContext);
    const { getProducts, createOrder } = useContext(ServerContext);
    const navigation = useNavigation();
    const { tableNumber, dinersCount , viewOnly} = useLocalSearchParams(); // מושך פרמטרים ממסך השולחנות (אם מלצר פתח את זה)
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    // ניהול מודל ועגלה
    const [selectedDish, setSelectedDish] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [localWaiterCart, setLocalWaiterCart] = useState([]);  // עגלה מקומית רק עבור המלצר שעובד על שולחן ספציפי
    const isRtl = language === 'he';
    const textAlign = isRtl ? 'right' : 'left';

    // טעינת התפריט
    useEffect(() => {
        const fetchMenu = async () => {
            const data = await getProducts();
            if (data) {
                setProducts(data);
                const uniqueCategories = ['All', ...new Set(data.map(p => p.category).filter(Boolean))];
                setCategories(uniqueCategories);
            }
        };
        fetchMenu();
    }, []);


    const filteredProducts = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);  //  סינון מנות לפי קטגוריה

    // הוספת מנה לעגלת המלצר או ל CartContext של הלקוח הרגיל
    const handleAddDish = (dishData) => {
        if (tableNumber) {
            setLocalWaiterCart(prev => [...prev, dishData]);  // אם זה מלצר שעובד על שולחן - שומרים בעגלה המקומית
        }
    };

    //  שליחת ההזמנה של השולחן למטבח
    const submitOrderToKitchen = async () => {
        const itemsPayload = localWaiterCart.map(item => ({
            product: item._id,
            quantity: item.quantity,
            notes: item.notes || ""
        }));

        const totalPrice = localWaiterCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const orderData = {
            items: itemsPayload,
            totalPrice: totalPrice,
            tableNumber: Number(tableNumber), 
            dinersCount: Number(dinersCount) || 1, 
            isPaid: false
        };

        const res = await createOrder(orderData, token);
        
        if (res.success) {
            Alert.alert(t('success'), t('order_sent_success'));
            setLocalWaiterCart([]); // איפוס
            navigation.reset({ index: 0, routes: [{ name: '(screens)/tablesScreen' }], }); // חזרה למסך השולחנות מאפסים אותו קודם שנראה את השינויים 
        } 
        else {
            Alert.alert(t('error'), res.error);
        }
    };


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={tableNumber ? `${t('table')} ${tableNumber}` : t('menu')} />       
            <View style={styles.content}>
                {/* שורת קטגוריות נגללת */}
                <View style={{ height: 60, marginBottom: 10 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {categories.map((cat, index) => (
                            <TouchableOpacity key={index} style={[styles.categoryBtn, { backgroundColor: activeCategory === cat ? theme.primary : theme.card, borderColor: theme.border }]} onPress={() => setActiveCategory(cat)} >
                                <Text style={{ color: activeCategory === cat ? '#fff' : theme.text, fontWeight: 'bold' }}> {cat === 'All' ? t('all_categories') : cat} </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* רשימת המנות */}
                <FlatList 
                    data={filteredProducts}
                    keyExtractor={item => item._id}
                    key={`num-cols-${activeCategory}`} 
                    numColumns={2} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 5 }}
                    columnWrapperStyle={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-start' }}
                    renderItem={({ item }) => (
                        <View style={{ width: (width / 2) - 10, marginHorizontal: 5, marginBottom: 15 }}> 
                            <DishCard 
                                product={item} 
                                onAddPress={ viewOnly ? null : (dish) => {
                                    setSelectedDish(dish);
                                    setModalVisible(true);
                                }} 
                            />
                        </View>
                    )}
                />
            </View>

            {/* פופאפ הוספה לסל  */}
            <AddToCartModal  visible={isModalVisible} dish={selectedDish} onClose={() => setModalVisible(false)} onAddToCart={handleAddDish} />

            {/* כפתור "שלח למטבח" - מופיע רק למלצר שיש לו מנות בעגלה המקומית */}
            {tableNumber && localWaiterCart.length > 0 && (
                <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, textAlign }}> {localWaiterCart.length} {t('items_selected')}</Text>
                        <Text style={{ color: theme.text, opacity: 0.7, textAlign }}>{t('total')}: ₪{localWaiterCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</Text>
                    </View>
                    
                    <TouchableOpacity  style={[styles.sendBtn, { backgroundColor: '#2ECC71' }]}  onPress={submitOrderToKitchen}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('send_to_kitchen')} </Text>
                    </TouchableOpacity>
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    categoryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2},
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',borderTopWidth: 1,elevation: 15,shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1,shadowRadius: 5},
    sendBtn: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15,elevation: 3}
});

export default MenuScreen;