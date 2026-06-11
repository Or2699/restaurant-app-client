import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput , Alert , ActivityIndicator , Platform} from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useLocalSearchParams } from 'expo-router';

const TablesScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const { user, token } = useContext(AuthContext);
    const { getActiveOrders, updateOrderStatus , updateOrderItems , deleteOrder} = useContext(ServerContext);
    const navigation = useNavigation();
    const { orderId } = useLocalSearchParams();
    const [myTables, setMyTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isNewTableModalVisible, setNewTableModalVisible] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newDinersCount, setNewDinersCount] = useState(''); // מספר סועדים - אופציונאלי
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    const [allActiveTables, setAllActiveTables] = useState([]);
    const isRtl = language === 'he';
    const textAlign = isRtl ? 'right' : 'left';

    // מושך את ההזמנות של המלצר בכל פעם שהמסך עולה (כדי שיתעדכן אחרי בחירת מנות מהתפריט)
    const fetchMyTables = async () => {
        if (!user || !token) return;
        const allActive = await getActiveOrders(token);
        setAllActiveTables(allActive);

        // console.log("🎯 DEBUG DATA:", JSON.stringify({
        //     myID_from_Auth: user._id || user.id,
        //     ordersFromServer: allActive.map(o => ({
        //         orderId: o._id,
        //         table: o.tableNumber,
        //         assignedToUser: o.user?._id || o.user || "NO_USER_ATTACHED"
        //     }))
        // }, null, 2));

       
        const filtered = allActive.filter(order => {
            const currentWaiterId = String(order.assignedWaiter?._id || order.assignedWaiter);
            const myId = String(user._id || user.id);           
            const isMyOrder = currentWaiterId === myId;         
            const isActiveStatus = ['pending', 'preparing', 'served'].includes(order.status);
            return isMyOrder && isActiveStatus;
        });     
        const statusPriority = { 'pending': 1, 'preparing': 2, 'served': 3 };
        const sortedTables = filtered.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
        setMyTables(sortedTables);


        if (selectedTable) { // אם יש שולחן שנבחר, מעדכן אותו עם הנתונים החדשים 
             const updatedCurrent = filtered.find(o => o._id === selectedTable._id);
             setSelectedTable(updatedCurrent || null);
        }
        else if (orderId) {
            const specificOrder = filtered.find(o => o._id === orderId);
            if (specificOrder) setSelectedTable(specificOrder);
            navigation.setParams({ orderId: undefined });
        } 
        setIsLoadingTables(false);
    };

    // מפעיל את הרענון בכל פעם שהמסך מקבל פוקוס
    useFocusEffect(
        useCallback(() => { // useCallback כדי למנוע יצירת פונקציה חדשה בכל רינדור שימוש חוזר בפונקציה מהעבר לבנות פעם אחת Memoization
            fetchMyTables();
        }, [orderId, user, token])
    );

    // פונקציה עזר לקבלת צבע לפי סטטוס השולחן
    const getStatusColor = (status) => {
        switch (status) {
            case 'preparing': return '#4A90E2';
            case 'served': return '#2ECC71';
            case 'pending': return '#F1C40F';
            default: return theme.primary;
        }
    };

    // מעבר לתפריט
    const handleGoToMenu = (existingOrderId = null) => {
       if (existingOrderId) {
            const currentTable = myTables.find(t => t._id === existingOrderId);
            setSelectedTable(null);  // הוספה לשולחן שכבר קיים
            navigation.navigate('(screens)/menuScreen', {  orderId: existingOrderId, tableNumber: currentTable?.tableNumber  });
        }
        else {
            if (!newTableNumber) { // פתיחת שולחן מאפס
                const msg = isRtl ? 'אנא הזן מספר שולחן' : 'Please enter a table number';
                if (Platform.OS === 'web') { window.alert(msg); } 
                else { Alert.alert(isRtl ? 'שגיאה' : 'Error', msg); }
                return;
            }
            const tableExists = allActiveTables.some(table => String(table.tableNumber) === String(newTableNumber));           
            
            if (tableExists) {
                const msg = isRtl ? 'שולחן זה כבר פתוח. כדי להוסיף לו מנות, פשוט תלחצי עליו ברשימת השולחנות.' : 'This table is already open.';
                if (Platform.OS === 'web') { window.alert(msg); } 
                else { Alert.alert(isRtl ? 'שולחן תפוס' : 'Table in use', msg); }
                return;
            }

            setNewTableModalVisible(false);
            navigation.navigate('(screens)/menuScreen', { tableNumber: newTableNumber, dinersCount: newDinersCount || '1'  });
            // איפוס שדות לפעם הבאה
            setNewTableNumber('');
            setNewDinersCount('');
        }
    };


    // פונקציה לעדכון סטטוס של הזמנה קיימת
    const renderTableCard = ({ item }) => (
        <TouchableOpacity  style={[styles.tableCard, { backgroundColor: theme.card, borderColor: theme.border, borderRightWidth: 5, borderRightColor: getStatusColor(item.status) }]} onPress={() => setSelectedTable(item)} >
            <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{t('table')} {item.tableNumber}</Text>
                    <Text style={{ fontSize: 13, color: theme.text, opacity: 0.6, marginTop: 4 }}> {item.dinersCount || 1} {t('diners')} • {item.items?.length || 0} {t('items')} </Text>
                </View>
                <View style={{ backgroundColor: getStatusColor(item.status) + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold', fontSize: 12 }}>{t(item.status)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('active_tables')} /> 
            
            <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', padding: 10 }}>
                <TouchableOpacity onPress={() => navigation.navigate('(screens)/home')}>
                    <Ionicons name="home-outline" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginHorizontal: 15 }}> {t('active_tables')} </Text>
            </View>
            <View style={styles.content}>
               {isLoadingTables ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : myTables.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={60} color={theme.text} style={{ opacity: 0.2, marginBottom: 15 }} />
                        <Text style={{ color: theme.text, opacity: 0.5, textAlign: 'center', fontSize: 16 }}>{t('no_tables_waiter')}</Text>
                    </View>
                ) : (
                    <FlatList data={myTables} keyExtractor={item => item._id} renderItem={renderTableCard} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}/>
                )}
            </View>

            {/* כפתור פתיחת שולחן */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => setNewTableModalVisible(true)}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* מודל פתיחת שולחן חדש */}
            <Modal visible={isNewTableModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('open_table')}</Text>
                        
                        <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: textAlign }]} placeholder={t('table_number_placeholder')} placeholderTextColor={theme.text + '80'} keyboardType="numeric" value={newTableNumber} onChangeText={setNewTableNumber} />
                        <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, textAlign: textAlign }]} placeholder={t('diners_count_placeholder')} placeholderTextColor={theme.text + '80'} keyboardType="numeric" value={newDinersCount} onChangeText={setNewDinersCount}/>

                        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: 15 }}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setNewTableModalVisible(false)}>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={() => handleGoToMenu(null)}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('start_order')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* מודל פרטי שולחן פעיל */}
            {selectedTable && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.card, width: '90%', maxHeight: '80%' }]}>
                            <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>{t('table')} {selectedTable.tableNumber}</Text>
                                <View style={{ backgroundColor: getStatusColor(selectedTable.status) + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                                    <Text style={{ color: getStatusColor(selectedTable.status), fontWeight: 'bold', fontSize: 12 }}>{t(selectedTable.status)}</Text>
                                </View>
                            </View>

                            <FlatList 
                                data={selectedTable.items}
                                keyExtractor={(item, index) => index.toString()}
                                style={{ backgroundColor: theme.background, borderRadius: 10, padding: 10, marginBottom: 20 }}
                                renderItem={({ item, index }) => (
                                    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 }}>
                                        <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                            <Text style={{ color: theme.text, textAlign: textAlign, fontWeight: 'bold' }}> • {item.product?.name?.[language] || t('dish')} x{item.quantity}</Text>
                                            {item.notes ? (
                                                <Text style={{ color: '#E63946', opacity: 0.8, fontSize: 12, textAlign: textAlign, paddingHorizontal: 15, marginTop: 4 }}> * {t('note')}: {item.notes}</Text>
                                            ) : null}
                                        </View>

                                        {/* כפתור למחיקה יופיע רק אם הסטטוס כרגע הוא ממתין */ }
                                        {selectedTable.status === 'pending' && (
                                            <TouchableOpacity 
                                                style={[styles.modalBtn, { backgroundColor: '#E63946', flex: 1, marginHorizontal: 5 }]} 
                                                onPress={() => {
                                                    const confirmMsg = isRtl ? 'האם את בטוחה שברצונך למחוק את כל ההזמנה של שולחן זה?' : 'Are you sure you want to delete this entire order?';                                                  
                                                    const performFullDelete = async () => {
                                                        const res = await deleteOrder(selectedTable._id, token);
                                                        if (res.success) {
                                                            setSelectedTable(null);
                                                            fetchMyTables(); 
                                                        } 
                                                        else {
                                                            const errorMsg = isRtl ? 'לא ניתן למחוק את ההזמנה כרגע' : 'Could not delete order';
                                                            if (Platform.OS === 'web') { window.alert(errorMsg); }
                                                            else { Alert.alert(isRtl ? 'שגיאה' : 'Error', errorMsg); }
                                                        }
                                                    };

                                                    if (Platform.OS === 'web') {
                                                        const isConfirmed = window.confirm(confirmMsg);
                                                        if (isConfirmed) performFullDelete();
                                                    } else {
                                                        // קופץ באפליקציה בטלפון
                                                        Alert.alert(
                                                            isRtl ? 'ביטול הזמנה' : 'Cancel Order',
                                                            confirmMsg,
                                                            [
                                                                { text: t('cancel'), style: 'cancel' },
                                                                { text: isRtl ? 'מחק הכל' : 'Delete All', style: 'destructive', onPress: performFullDelete }
                                                            ]
                                                        );
                                                    }
                                                }}>
                                                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{isRtl ? 'ביטול הזמנה' : 'Cancel Order'}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            />

                            {/* כפתור להוספת עוד מנות לשולחן הזה */}
                            <TouchableOpacity style={{ backgroundColor: theme.primary + '20', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: theme.primary }} onPress={() => handleGoToMenu(selectedTable._id)} >
                                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>+ {t('add_more_items')}</Text>
                            </TouchableOpacity>
                            <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>     
                                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border, flex: 1, marginHorizontal: 5 }]} onPress={() => setSelectedTable(null)}>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', textAlign: 'center' }}>{t('close')}</Text>
                                </TouchableOpacity>

                                {/* כפתור מחיקת הזמנה שלמה - יופיע רק אם הסטטוס כרגע הוא ממתין */}
                                {selectedTable.status === 'pending' && (
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, { backgroundColor: '#E63946', flex: 1, marginHorizontal: 5 }]} 
                                        onPress={() => {
                                            const confirmMsg = isRtl ? 'האם את בטוחה שברצונך למחוק את כל ההזמנה של שולחן זה?' : 'Are you sure you want to delete this entire order?';                                      
                                            const performFullDelete = async () => {
                                                const res = await deleteOrder(selectedTable._id, token);
                                                if (res.success) {
                                                    setSelectedTable(null);
                                                    fetchMyTables(); 
                                                } 
                                                else {
                                                    const errorMsg = isRtl ? 'לא ניתן למחוק את ההזמנה כרגע' : 'Could not delete order';
                                                    if (Platform.OS === 'web') { window.alert(errorMsg); }
                                                    else { Alert.alert(isRtl ? 'שגיאה' : 'Error', errorMsg); }
                                                }
                                            };

                                            if (Platform.OS === 'web') {
                                                const isConfirmed = window.confirm(confirmMsg);
                                                if (isConfirmed) performFullDelete();
                                            } 
                                            else {
                                                Alert.alert(
                                                    isRtl ? 'ביטול הזמנה' : 'Cancel Order',
                                                    confirmMsg,
                                                    [
                                                        { text: t('cancel'), style: 'cancel' },
                                                        { text: isRtl ? 'מחק הכל' : 'Delete All', style: 'destructive', onPress: performFullDelete }
                                                    ]
                                                );
                                            }
                                        }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{isRtl ? 'ביטול הזמנה' : 'Cancel Order'}</Text>
                                    </TouchableOpacity>
                                )}

                                {/* כפתור בהכנה יופיע רק אם הסטטוס כרגע הוא ממתין */}
                                {selectedTable.status === 'pending' && (
                                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4A90E2', flex: 1, marginHorizontal: 5 }]} 
                                        onPress={async () => {
                                            const res = await updateOrderStatus(selectedTable._id, 'preparing', token);
                                            if(res.success) fetchMyTables(); // משאיר את המודל פתוח כדי לראות את השינוי
                                        }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('mark_as_preparing')}</Text>
                                    </TouchableOpacity>
                                )}
                                
                                {/* כפתור הוגש יופיע רק אם הסטטוס כרגע הוא בהכנה */}
                                {selectedTable.status === 'preparing' && (
                                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2ECC71', flex: 1, marginHorizontal: 5 }]} 
                                        onPress={async () => {
                                            const res = await updateOrderStatus(selectedTable._id, 'served', token);
                                            if(res.success) fetchMyTables();
                                            setSelectedTable(null); // סוגר את המודל כי סיימנו איתו
                                        }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{t('mark_as_served')}</Text>
                                    </TouchableOpacity>
                                )}
                                
                            </View>

                        </View>
                    </View>
                </Modal>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 15 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
    tableCard: { padding: 20, borderRadius: 15, borderWidth: 1, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },  
    fab: { position: 'absolute', bottom: 30, left: 30, width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 1000 },   
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { width: '85%', padding: 25, borderRadius: 20, elevation: 10 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    modalBtn: { width: '48%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }
});

export default TablesScreen;