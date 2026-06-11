import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import { CartContext } from '../../context/CartContext';
import { useNavigation } from 'expo-router';
import Header from '../../components/header';
import DishCard from '../../components/DishCard';
import AddToCartModal from '../../components/AddToCartModal';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

const CustomerMenuScreen = () => {
    const { width } = useWindowDimensions();
    const { theme, t, language } = useContext(ThemeContext);
    const { user , token } = useContext(AuthContext);
    const { getProducts } = useContext(ServerContext);
    const { cart, addToCart } = useContext(CartContext);
    const navigation = useNavigation();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);    
    // ניהול סינונים
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceSort, setPriceSort] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);   
    // מודלים
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isAddToCartModalVisible, setAddToCartModalVisible] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    // Toast
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const isRtl = language === 'he';

    useEffect(() => {
        const fetchMenu = async () => {
            const data = await getProducts();
            if (data) {
                const availableData = data.filter(p => p.isAvailable !== false);
                setProducts(availableData);
                const uniqueCategories = ['All', ...new Set(availableData.map(p => p.category).filter(Boolean))]; // not null/undefined categories
                setCategories(uniqueCategories);
                setFilteredProducts(availableData);
            }
        };
        fetchMenu();
    }, []);


    // הלוגיקה החכמה שמכסה את כל התגיות - בחירה מרשימה 
    const applyFilters = useCallback(() => {
        let result = [...products];

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(p => 
                p.name?.he?.includes(query) || 
                p.name?.en?.toLowerCase().includes(query) ||
                p.tags?.some(tagObj => 
                    tagObj.he?.includes(query) || 
                    tagObj.en?.toLowerCase().includes(query)
                )
            );
        }

        //  סינון קטגוריה
        if (activeCategory !== 'All') {
            result = result.filter(p => p.category === activeCategory);
        }

        //  סינון לפי התגיות שבחרנו
        const specialTags = ['recommended', 'chef'];
        const standardTags = selectedTags.filter(t => !specialTags.includes(t));
        
        // סינון תגיות רגילות (טבעוני, חלבי, אלכוהול וכו')
        if (standardTags.length > 0) {
            result = result.filter(p => 
                standardTags.every(selectedTag => 
                    p.tags?.some(tagObj => {
                        const enTag = tagObj.en?.toLowerCase() || '';
                        return enTag === selectedTag || enTag.includes(selectedTag);
                    })
                )
            );
        }

        if (selectedTags.includes('recommended')) {
            const hasRecTag = products.some(p => p.tags?.some(t => t.en?.toLowerCase() === 'recommended'));
            if (hasRecTag) {
                result = result.filter(p => p.tags?.some(t => t.en?.toLowerCase() === 'recommended'));
            } else {
                result = result.slice(0, 5); // גיבוי
            }
        }

        // סינון להמלצת שף
        if (selectedTags.includes('chef')) {
            const hasChefTag = products.some(p => p.tags?.some(t => t.en?.toLowerCase() === 'chef'));
            if (hasChefTag) {
                result = result.filter(p => p.tags?.some(t => t.en?.toLowerCase() === 'chef'));
            } else {
                result = result.filter((p, index) => index % 3 === 0); // גיבוי
            }
        }

        //  מיון מחירים
        if (priceSort === 'asc') result.sort((a, b) => a.price - b.price);
        if (priceSort === 'desc') result.sort((a, b) => b.price - a.price);

        setFilteredProducts(result);
    }, [products, searchQuery, activeCategory, selectedTags, priceSort]);


    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // פונקציה לטוגל של תגיות - מוסיפה או מסירה מהסט של התגיות שנבחרו
    const toggleTag = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    // הוספה לעגלה - סגירת המודל, הצגת טוסט ואפשרות להוספה של הערות
    const handleAddToCart = (orderData) => {
        //addToCart(orderData);
        setAddToCartModalVisible(false);
        setToastMessage(t('item_added_to_cart'));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const cartItemsCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const cartTotalPrice = cart.reduce((sum, item) => {
        const itemPrice = item.product?.price ? Number(item.product.price) : 0;
        const itemQuantity = item.quantity ? Number(item.quantity) : 0;
        return sum + (itemPrice * itemQuantity);
    }, 0);

    const filterTags = ["recommended", "chef", "vegan", "vegetarian", "gf", "alcoholic", "meat", "healthy", "fish", "dairy"];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('menu')} />           
            <View style={styles.content}>
                <View style={[styles.controlsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    
                    <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="search" size={20} color={theme.text} style={{ opacity: 0.5 }} />
                        <TextInput style={[styles.searchInput, { color: theme.text, textAlign: 'center' }]} placeholder={t('search_dish')} placeholderTextColor={theme.text + '80'} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={theme.text} style={{ opacity: 0.5 }} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 20 }} />
                        )}
                    </View>

                    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setCategoryModalVisible(true)}>
                            <Ionicons name="grid-outline" size={20} color={theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setFilterModalVisible(true)}>
                            <Ionicons name="options-outline" size={22} color={theme.text} />
                            {(priceSort || selectedTags.length > 0) && <View style={styles.filterDot} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {activeCategory !== 'All' && (
                    <View style={{ alignItems: 'center', marginTop: 25, marginBottom: -10 }}>
                        <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 }}>
                            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                                {activeCategory === 'starters' ? (isRtl ? 'ראשונות' : 'Starters') : 
                                 activeCategory === 'main' ? (isRtl ? 'עיקריות' : 'Mains') : 
                                 activeCategory === 'desserts' ? (isRtl ? 'קינוחים' : 'Desserts') : 
                                 activeCategory === 'drinks' ? (isRtl ? 'שתייה' : 'Drinks') : activeCategory}
                            </Text>
                        </View>
                    </View>
                )}

                <FlatList 
                    data={filteredProducts}
                    keyExtractor={item => item._id}
                    key={`num-cols-${activeCategory}`} 
                    numColumns={2} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 5, marginTop: 30 }}
                    columnWrapperStyle={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'flex-start' }}
                    renderItem={({ item }) => (
                        <View style={{ width: (width / 2) - 10, marginHorizontal: 5, marginBottom: 15 }}> 
                            <DishCard product={item} onAddPress={(dish) => { setSelectedDish(dish); setAddToCartModalVisible(true); }} />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Ionicons name="restaurant-outline" size={50} color={theme.text} style={{ opacity: 0.2, marginBottom: 10 }} />
                            <Text style={{ color: theme.text, opacity: 0.6, fontSize: 16 }}>{t('no_dishes_found')}</Text>
                        </View>
                    }
                />
            </View>

            {showToast && (
                <View style={styles.toastContainer}>
                    <View style={styles.toast}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                </View>
            )}

            <AddToCartModal visible={isAddToCartModalVisible} dish={selectedDish} onClose={() => setAddToCartModalVisible(false)} onAddToCart={handleAddToCart} />

            <Modal visible={isCategoryModalVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} accessible={false} onPress={() => setCategoryModalVisible(false)}>
                    <View style={[styles.categoryModalContent, { backgroundColor: theme.card }]}>
                        {categories.map((cat, index) => (
                            <TouchableOpacity  key={index}  style={[styles.categoryListItem, activeCategory === cat && { backgroundColor: theme.primary + '20' }, index === categories.length - 1 && { borderBottomWidth: 0 }]}  onPress={() => { setActiveCategory(cat); setCategoryModalVisible(false); }} >
                                <Text style={{ color: activeCategory === cat ? theme.primary : theme.text, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                                    {cat === 'All' ? t('all_categories') : 
                                     cat === 'starters' ? (isRtl ? 'ראשונות' : 'Starters') : 
                                     cat === 'main' ? (isRtl ? 'עיקריות' : 'Mains') : 
                                     cat === 'desserts' ? (isRtl ? 'קינוחים' : 'Desserts') : 
                                     cat === 'drinks' ? (isRtl ? 'שתייה' : 'Drinks') : cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={isFilterModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlayFlexEnd}>
                    <View style={[styles.filterModalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('sort_and_filter')}</Text>                        
                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRtl ? 'right' : 'left' }]}>{t('sort_by_price')}:</Text>
                        <View style={[styles.filterRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.filterChip, priceSort === 'asc' && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => setPriceSort(priceSort === 'asc' ? null : 'asc')}>
                                <Text style={{ color: priceSort === 'asc' ? '#fff' : theme.text }}>{t('price_low_to_high')} ⬆️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterChip, priceSort === 'desc' && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => setPriceSort(priceSort === 'desc' ? null : 'desc')}>
                                <Text style={{ color: priceSort === 'desc' ? '#fff' : theme.text }}>{t('price_high_to_low')} ⬇️</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRtl ? 'right' : 'left' }]}>{t('dietary_tags')}:</Text>
                        <View style={[styles.filterRow, { flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}>
                            {filterTags.map(tag => (
                                <TouchableOpacity key={tag} style={[styles.filterChip, selectedTags.includes(tag) && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => toggleTag(tag)}>
                                    <Text style={{ color: selectedTags.includes(tag) ? '#fff' : theme.text }}>{t(tag)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.closeModalButton, { backgroundColor: theme.primary }]} onPress={() => setFilterModalVisible(false)}>
                            <Text style={styles.closeModalText}>{t('show_results')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {cart.length > 0 && (
                <TouchableOpacity style={[styles.floatingCart, { backgroundColor: theme.primary, flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={() => navigation.navigate('(screens)/cartScreen')}>
                    <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartItemsCount}</Text></View>
                    <Text style={styles.floatingCartText}>{t('view_cart')}</Text>
                    <Text style={styles.floatingCartPrice}>₪{cartTotalPrice.toFixed(2)}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    controlsRow: {  marginTop: 30,  width: '85%', alignSelf: 'center', justifyContent: 'center',  alignItems: 'center', gap: 10},
    searchBar: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', paddingHorizontal: 15 },
    searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15 },
    smallBtn: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    filterDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E63946' },
    toastContainer: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
    toast: { backgroundColor: '#2ECC71', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
    toastText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalOverlayFlexEnd: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    categoryModalContent: { width: '70%', borderRadius: 20, overflow: 'hidden', elevation: 10 },
    categoryListItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#eee' },
    filterModalContent: { padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, minHeight: 300 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 10, opacity: 0.8 },
    filterRow: { gap: 10, marginBottom: 10 },
    filterChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
    closeModalButton: { marginTop: 30, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    closeModalText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    floatingCart: { position: 'absolute', bottom: 20, left: '5%', right: '5%', height: 60, borderRadius: 30, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    cartBadge: { backgroundColor: '#fff', borderRadius: 15, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    cartBadgeText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
    floatingCartText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    floatingCartPrice: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default CustomerMenuScreen;