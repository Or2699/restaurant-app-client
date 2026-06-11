import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Platform, Modal, ScrollView } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import { useNavigation, useFocusEffect } from 'expo-router';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const OrdersScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const { token } = useContext(AuthContext);
    const { getMyOrders, updateOrderItems, updateOrderStatus, deleteOrder } = useContext(ServerContext);
    const navigation = useNavigation();

    const isRtl = language === 'he';
    const textAlign = isRtl ? 'right' : 'left';

    const [activeOrder, setActiveOrder] = useState(null);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);

    //  פונקציה שמביאה את פרטי ההזמנות 
    const fetchOrders = async () => {
        if (!token) return;
        const allOrders = await getMyOrders(token);
        const active = allOrders.find(o => o.status !== 'paid');
        const history = allOrders.filter(o => o.status === 'paid');
        setActiveOrder(active || null);
        setHistoryOrders(history);
    };

    useFocusEffect(useCallback(() => { fetchOrders(); }, [token]));

    // פונקציה לעדכון כמות פריט בהזמנה
    const handleUpdateQuantity = async (index, newQuantity) => {
        if (!activeOrder || activeOrder.status !== 'pending') return;
        let updatedItems = [...activeOrder.items];
        if (newQuantity <= 0) {
            updatedItems.splice(index, 1);
        } else {
            updatedItems[index] = { ...updatedItems[index], quantity: newQuantity };
        }

        const newTotalPrice = updatedItems.reduce((sum, item) => sum + (Number(item.product?.price || 0) * item.quantity), 0);
        setActiveOrder(prev => ({ ...prev, items: updatedItems, totalPrice: newTotalPrice }));

        const payloadItems = updatedItems.map(item => ({
            product: item.product._id || item.product,
            quantity: item.quantity,
            notes: item.notes || ""
        }));

        const res = await updateOrderItems(activeOrder._id, payloadItems, token);
        if (!res || (!res.success && !res.data)) { fetchOrders(); }
    };

    // פונקציה למחיקת הזמנה 
    const handleDeleteOrder = () => {
        Alert.alert(t('delete_order') || 'ביטול הזמנה', t('confirm_delete') || 'האם אתה בטוח?', [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), onPress: async () => { await deleteOrder(activeOrder._id, token); fetchOrders(); }, style: 'destructive' }
        ]);
    };

    // פונקציה לתשלום של הזמנה 
    const handlePayOrder = async () => {
        const res = await updateOrderStatus(activeOrder._id, 'paid', token);
        if (res.success || res._id) {
            Alert.alert(t('thank_you'), t('order_paid'));
            fetchOrders();
        }
    };

    // פונקציה להבדלה בין סטטוסים באמצעות צבעים 
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#F39C12';
            case 'preparing': return '#3498DB';
            case 'served': return '#2ECC71';
            case 'paid': return '#95a5a6';
            default: return '#95a5a6';
        }
    };


    // פונקציה לדיבוב קולי של פרטי המנה 
    const handleSpeak = (text) => {
        if (!text) return;
        Speech.stop(); 
        Speech.speak(text, {
            language: language === 'he' ? 'he-IL' : 'en-US',
            pitch: 1.0,
            rate: 0.9 
        });
    };


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('my_orders')} />

            <TouchableOpacity style={[styles.historyBtn, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={() => setHistoryModalVisible(true)}>
                <Ionicons name="time-outline" size={20} color={theme.text} />
                <Text style={{ color: theme.text, fontWeight: 'bold', marginHorizontal: 8 }}>{t('order_history')}</Text>
            </TouchableOpacity>

            {!activeOrder ? (
                <View style={[styles.container, styles.emptyContainer]}>
                    <Ionicons name="receipt-outline" size={80} color={theme.text} style={{ opacity: 0.2, marginBottom: 20 }} />
                    <Text style={{ color: theme.text, fontSize: 18, opacity: 0.6 }}>{t('no_active_order') || 'אין הזמנה פעילה'}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
                    <View style={[styles.activeOrderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={[styles.orderHeader, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>{t('table')} {activeOrder.tableNumber}</Text>
                                <Text style={{ color: theme.text, opacity: 0.6 }}>{t('waiter')}: {activeOrder.assignedWaiter?.fullName || t('unassigned')}</Text>
                            </View>
                            <View style={{ backgroundColor: getStatusColor(activeOrder.status), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 22}}>
                                <Text style={{ color: '#fff', fontSize: 12 , alignContent:'center' }}>{t(activeOrder.status)}</Text>
                            </View>                        
                        </View>

                        {activeOrder.items.map((item, index) => (
                            <View key={index} style={[styles.itemRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                {/* טקסט ודיבוב קולי */}
                                <View style={{ flex: 1, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                    <Text style={{ color: theme.text, textAlign }}>{item.quantity}x {item.product?.name?.[language] || item.product?.name?.he}</Text>
                                    <TouchableOpacity onPress={() => handleSpeak(item.product?.name?.[language] || item.product?.name?.he)} style={{ marginHorizontal: 10 }}>
                                        <Ionicons name="volume-medium-outline" size={20} color={theme.primary} />
                                    </TouchableOpacity>
                                </View>
                                {activeOrder.status === 'pending' && (
                                    <View style={[styles.quantityControl, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <TouchableOpacity onPress={() => handleUpdateQuantity(index, item.quantity - 1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color={theme.text} /></TouchableOpacity>
                                        <Text style={{ marginHorizontal: 10, fontWeight: 'bold', color: theme.text }}>{item.quantity}</Text>
                                        <TouchableOpacity onPress={() => handleUpdateQuantity(index, item.quantity + 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color={theme.text} /></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleUpdateQuantity(index, 0)} style={{ marginLeft: 8 }}><Ionicons name="trash-outline" size={18} color="#E63946" /></TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}

                        <View style={styles.divider} />

                        <View style={styles.footerContainer}>
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 20 }}>{t('total')}: ₪{activeOrder.totalPrice}</Text>
                            <TouchableOpacity 
                                style={[styles.payBtn, { backgroundColor: activeOrder.status === 'served' ? '#2ECC71' : '#ccc' }]} 
                                onPress={activeOrder.status === 'served' ? handlePayOrder : null}
                                disabled={activeOrder.status !== 'served'}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                                    {activeOrder.status === 'served' ? t('pay_now') : t('wait_for_serve')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            )}

            <Modal visible={isHistoryModalVisible} animationType="slide">
                <Header title={t('order_history')} />
                <FlatList data={historyOrders} renderItem={({ item }) => (
                    <View style={styles.historyCard}>
                        <Text style={{ fontWeight: 'bold' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        {item.items.map((i, idx) => <Text key={idx}>{i.quantity}x {i.product?.name?.[language]}</Text>)}
                        <Text style={{ marginTop: 5, fontWeight: 'bold' }}>₪{item.totalPrice}</Text>
                    </View>
                )} />
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setHistoryModalVisible(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    historyBtn: { margin: 15, padding: 12, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
    activeOrderCard: { padding: 20, borderRadius: 20, borderWidth: 1, margin: 15, elevation: 3 },
    orderHeader: { justifyContent: 'space-between', marginBottom: 15 },
    itemRow: { alignItems: 'center', marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#ccc', opacity: 0.3, marginVertical: 10 },
    quantityControl: { flexDirection: 'row', alignItems: 'center' },
    qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    footerContainer: { marginTop: 20, alignItems: 'center' },
    payBtn: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12, marginTop: 10 },
    historyCard: { padding: 15, borderBottomWidth: 1, borderColor: '#ccc' },
    closeModalBtn: { padding: 20, alignItems: 'center' }
});

export default OrdersScreen;