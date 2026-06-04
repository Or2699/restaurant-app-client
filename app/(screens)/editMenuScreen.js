import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image } from 'react-native';
import { ServerContext } from '../../context/ServerContext';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';
import useMenuFilter from '../hooks/useMenuFilter';

const EditMenuScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const { getProducts, createProduct, updateProduct, deleteProduct } = useContext(ServerContext);
    const { token } = useContext(AuthContext);
    
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const isRtl = language === 'he';

    // מצבי הפופאפים
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    
    const [isSortOpen, setIsSortOpen] = useState(false);
    
    // שדות הטופס
    const [formNameHe, setFormNameHe] = useState('');
    const [formNameEn, setFormNameEn] = useState('');
    const [formDescHe, setFormDescHe] = useState('');
    const [formDescEn, setFormDescEn] = useState(''); // תיאור המנה באנגלית 
    const [formPrice, setFormPrice] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formImage, setFormImage] = useState('');

    const { // פירוק 
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortOrder,
        setSortOrder,
        filteredProducts
    } = useMenuFilter(allProducts);

    const sortOptions = {
        'default': t('sort_default'),
        'price_desc': t('sort_desc'),
        'price_asc': t('sort_asc')
    };

    // טוען את כל המוצרים 
    const fetchProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setAllProducts(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))]; // set שלא יהיו כפילויות boolean לוקח רק את הערכים האמיתיים ולא undefined

    // פותח את מודל הוספת המוצר ומנקה את כל השדות 
    const openAddModal = () => {
        setEditingProduct(null);
        setFormNameHe('');
        setFormNameEn('');
        setFormDescHe('');
        setFormDescEn('');
        setFormPrice('');
        setFormCategory('');
        setFormImage('');
        setModalVisible(true);
    };


    // פותח את מודל עריכת מוצר עם הפרטים שיש עליו כרגע ואופציה לשנות 
    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormNameHe(product.name?.he || '');
        setFormNameEn(product.name?.en || '');
        setFormDescHe(product.description?.he || '');
        setFormDescEn(product.description?.en || '');
        setFormPrice(product.price ? product.price.toString() : '');
        setFormCategory(product.category || '');
        setFormImage(product.image || '');
        setModalVisible(true);
    };

    // פונקציה לשמירת הנתונים המעודכנים על המנות 
    const handleSave = async () => {
        if (!formNameHe || !formPrice || !formDescHe) {
            alert('אנא וודא שמילאת שם בעברית, מחיר ותיאור בעברית (שדות חובה).');
            return;
        }

        const productData = {
            name: { he: formNameHe, en: formNameEn || formNameHe },
            description: { he: formDescHe, en: formDescEn || formDescHe },
            price: Number(formPrice),
            category: formCategory || 'main',
            image: formImage
        };

        if (editingProduct) {
            await updateProduct(token, editingProduct._id, productData);
        } else {
            await createProduct(token, productData);
        }

        setModalVisible(false);
        fetchProducts(); 
    };

    // מחיקת מוצר 
    const confirmDelete = (productId) => {
        setProductToDelete(productId);
        setDeleteModalVisible(true);
    };

    const executeDelete = async () => {
        if (productToDelete) {
            await deleteProduct(token, productToDelete);
            setDeleteModalVisible(false);
            setProductToDelete(null);
            fetchProducts(); 
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('edit_menu')} />
            <View style={[styles.filtersContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.topControlsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    {/* חיפוש מוצרים*/}
                    <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row', marginHorizontal: 10 }]}>
                        <Ionicons name="search" size={20} color={theme.text} opacity={0.5} />
                        <TextInput style={[styles.searchInput, { color: theme.text, textAlign: isRtl ? 'right' : 'left' }]} placeholder={t('search_dish')} placeholderTextColor={theme.text + '80'} value={searchQuery} onChangeText={setSearchQuery} />
                    </View>

                    {/* סינון מחיר */}
                    <View style={styles.sortDropdownContainer}>
                        <TouchableOpacity style={[styles.customDropdownHeader, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={() => setIsSortOpen(!isSortOpen)}>
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '500' }} numberOfLines={1} adjustsFontSizeToFit>{sortOptions[sortOrder]}</Text>
                            <Ionicons name={isSortOpen ? "chevron-up" : "chevron-down"} size={16} color={theme.primary} />
                        </TouchableOpacity>

                        {isSortOpen && (
                            <View style={[styles.customDropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                {Object.keys(sortOptions).map((key) => (
                                    <TouchableOpacity 
                                        key={key} 
                                        style={[styles.customDropdownItem, sortOrder === key && { backgroundColor: theme.primary + '15' }]}
                                        onPress={() => {
                                            setSortOrder(key);
                                            setIsSortOpen(false);
                                        }}
                                    >
                                        <Text style={{ color: sortOrder === key ? theme.primary : theme.text, textAlign: isRtl ? 'right' : 'left', fontWeight: sortOrder === key ? 'bold' : 'normal', fontSize: 13 }}>{sortOptions[key]}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* קטגוריות */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={{ paddingHorizontal: 15 }}>
                    {categories.map((cat, index) => (
                        <TouchableOpacity key={index} style={[styles.categoryBtn, selectedCategory === cat ? { backgroundColor: theme.primary } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setSelectedCategory(cat)}>
                            <Text style={[styles.categoryBtnText, selectedCategory === cat ? { color: '#fff' } : { color: theme.text }]}> {cat === 'All' ? t('all_categories') : cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* רשימת המנות */}
            <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 80 }} showsVerticalScrollIndicator={false} style={{ zIndex: 1 }}>
                {filteredProducts.map(product => (
                    <View key={product._id} style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <View style={styles.imageContainer}>
                            {product.image ? (
                                <Image source={{ uri: product.image }} style={styles.productImage} />
                            ) : (
                                <View style={[styles.productImagePlaceholder, { backgroundColor: theme.background }]}>
                                    <Ionicons name="restaurant" size={24} color={theme.text} opacity={0.3} />
                                </View>
                            )}
                        </View>

                        <View style={[styles.productInfo, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.productName, { color: theme.text }]}>{product.name?.[language] || product.name?.he} </Text>
                            <Text style={[styles.productPrice, { color: theme.primary }]}> ₪{product.price}</Text>
                        </View>
                        
                        <View style={[styles.actionsContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: '#3498DB', borderWidth: 1 }]} onPress={() => openEditModal(product)}>
                                <Ionicons name="pencil" size={18} color="#3498DB" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: '#E63946', borderWidth: 1 }]} onPress={() => confirmDelete(product._id)}>
                                <Ionicons name="trash" size={18} color="#E63946" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* כפתור ההוספה */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={openAddModal}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* פופאפ עריכה/הוספה */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{editingProduct ? t('edit_dish') : t('add_dish')}</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left' }]} placeholder={t('dish_name_he')} placeholderTextColor={theme.text + '80'} value={formNameHe} onChangeText={setFormNameHe} />
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left', height: 70 }]} placeholder="תיאור המנה (עברית) *" placeholderTextColor={theme.text + '80'} value={formDescHe} onChangeText={setFormDescHe} multiline />
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left' }]} placeholder={t('dish_name_en')} placeholderTextColor={theme.text + '80'} value={formNameEn} onChangeText={setFormNameEn} />
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left', height: 70 }]} placeholder="תיאור המנה (אנגלית)" placeholderTextColor={theme.text + '80'} value={formDescEn} onChangeText={setFormDescEn} multiline />
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left' }]} placeholder={t('price')} placeholderTextColor={theme.text + '80'} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left' }]} placeholder={t('category')} placeholderTextColor={theme.text + '80'} value={formCategory} onChangeText={setFormCategory} />
                            <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: isRtl ? 'right' : 'left' }]} placeholder="לינק לתמונה (URL)" placeholderTextColor={theme.text + '80'} value={formImage} onChangeText={setFormImage} />
                        </ScrollView>

                        <View style={[styles.modalButtons, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E63946' }]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalBtnText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2ECC71' }]} onPress={handleSave}>
                                <Text style={styles.modalBtnText}>{t('save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* פופאפ מחיקה מאובטחת */}
            <Modal visible={deleteModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border, paddingVertical: 30 }]}>
                        <Ionicons name="warning" size={50} color="#E63946" style={{ alignSelf: 'center', marginBottom: 15 }} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('delete_title')}</Text>
                        <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 25, fontSize: 16 }}>{t('delete_confirm')}</Text>
                        
                        <View style={[styles.modalButtons, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E63946' }]} onPress={executeDelete}>
                                <Text style={styles.modalBtnText}>{t('delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    filtersContainer: { paddingVertical: 15, borderBottomWidth: 1, borderColor: '#ccc3', zIndex: 9999, elevation: 10 },
    topControlsRow: { paddingHorizontal: 15, marginBottom: 15, justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    searchBox: { width: '70%', maxWidth: 600, minWidth: 220, borderRadius: 25, borderWidth: 1, paddingHorizontal: 15, height: 60, alignItems: 'center' },
    searchInput: { flex: 1, marginHorizontal: 10, fontSize: 14, fontFamily: 'Rubik-Regular' },
    sortDropdownContainer: { width: 90, height: 40, zIndex: 9999 },
    customDropdownHeader: { height: 40, borderRadius: 15, borderWidth: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'space-between' },
    customDropdownList: { position: 'absolute', top: 55, left: 0, right: 0, borderRadius: 12, borderWidth: 1, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999 },
    customDropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#ccc2' },
    categoriesScroll: { flexDirection: 'row', zIndex: 1 },
    categoryBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent: 'center' },
    categoryBtnText: { fontSize: 12, fontWeight: 'bold' },
    productCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12, justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
    imageContainer: { width: 50, height: 50, marginRight: 15, marginLeft: 15 },
    productImage: { width: 50, height: 50, borderRadius: 8 },
    productImagePlaceholder: { width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc3' },
    productInfo: { flex: 1 },
    productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    productPrice: { fontSize: 14, fontWeight: 'bold' },
    actionsContainer: { gap: 10 },
    actionBtn: { padding: 8, borderRadius: 8 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, zIndex: 10000 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalContent: { width: '90%', padding: 20, borderRadius: 15, borderWidth: 1, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalInput: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 12, fontSize: 14, fontFamily: 'Rubik-Regular' },
    modalButtons: { justifyContent: 'space-between', marginTop: 15 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
    modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});

export default EditMenuScreen;