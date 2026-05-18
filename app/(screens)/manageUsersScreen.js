import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal , TextInput , Alert} from 'react-native';
import { ServerContext } from '../../context/ServerContext';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';


const ManageUsersScreen = () => {
    const { user, token } = useContext(AuthContext);
    const { theme, t, language } = useContext(ThemeContext);
    const { getPendingStaff, approveStaffMember , getAllStaff, updateStaffWage , addStaffBonus, resetAllWages} = useContext(ServerContext);
    
    const [activeTab, setActiveTab] = useState('pending'); // 'active' או 'pending' לפי זה נחליף בין התצוגות
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStaff, setActiveStaff] = useState([]); // רשימת העובדים המאושרים
    const [wageModal, setWageModal] = useState({ visible: false, userId: null, fullName: '', currentWage: '' }); // מודל עריכת שכר
    const [newWageInput, setNewWageInput] = useState(''); // קלט השכר החדש
    const [wageError, setWageError] = useState(''); // שגיאה בקלט השכר החדש
    const [bonusModal, setBonusModal] = useState({ visible: false, userId: null, fullName: '' }); 
    const [bonusInput, setBonusInput] = useState('');
    const isRtl = language === 'he';
     
    //  useEffect(() => {
    //     console.log("Token in ManageUsersScreen:", token);
    // }, []);

    // סטייט לניהול מודל האישור/דחייה החכם
    const [actionModal, setActionModal] = useState({
        visible: false,
        userId: null,
        fullName: '',
        isApproved: true
    });


    // פונקציה לטעינת משתמשים ממתינים לאישור בעת כניסה לטאב המתאים
    const loadPendingUsers = async () => {
        setLoading(true);
        const data = await getPendingStaff(token);
        setPendingUsers(data);
        setLoading(false);
    };


    // פונקציה לטעינת רשימת העובדים המאושרים והפעילים במערכת
    const loadActiveStaff = async () => {
        setLoading(true);
        const data = await getAllStaff(token);
        setActiveStaff(data);
        setLoading(false);
    };

    useEffect(() => {
        if(token){
            if (activeTab === 'pending') 
                loadPendingUsers();
            else if (activeTab === 'active') 
                loadActiveStaff();
        }
        
    }, [activeTab , token]);


    // פונקציה לפתיחת המודל של האישור או דחיית משתמשים חדשים 
    const openActionModal = (userId, fullName, isApproved) => {
        setActionModal({
            visible: true,
            userId,
            fullName,
            isApproved
        });
    };


   // פונקציה לטיפול באישור או דחיית משתמשים חדשים לאחר אישור הפעולה במודל
    const handleConfirmAction = async () => {
        const { userId, isApproved } = actionModal;
        setActionModal(prev => ({ ...prev, visible: false }));
        const res = await approveStaffMember(userId, token, isApproved);
        if (res.success) {
            setPendingUsers(prev => prev.filter(user => user._id !== userId));
            if (actionModal.isApproved) loadActiveStaff();
        } 
        else {
            alert(res.message || t('error'));
        }
    };


    // פונקציה לרינדור כל פריט ברשימת המשתמשים שממתינים לאישור - מיני קומפוננטה למשתמש 
    const renderPendingItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.cardHeader, { flexDirection: language === 'he' ? 'row-reverse' : 'row' }]}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>{item.fullName ? item.fullName.charAt(0) : 'U'}</Text>
                </View>
                <View style={[styles.userInfo, { alignItems: language === 'he' ? 'flex-end' : 'flex-start', marginRight: language === 'he' ? 12 : 0, marginLeft: language === 'he' ? 0 : 12 }]}>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.fullName}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.roleText, { color: theme.primary }]}>{t(item.role) || item.role}</Text>
                    </View>
                    <Text style={[styles.userEmail, { color: theme.text, opacity: 0.6 }]}>{item.email}</Text>
                </View>
            </View>

            <View style={[styles.actions, { flexDirection: language === 'he' ? 'row-reverse' : 'row' }]}>
                {/*  כפתור אישור */}
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => openActionModal(item._id, item.fullName, true)}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}>{t('approve_employee')}</Text>
                </TouchableOpacity>

                {/* כפתור דחייה */}
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => openActionModal(item._id, item.fullName, false)}>
                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}>{t('reject')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


    // פונקציה לטיפול בשמירת השכר החדש לאחר עדכון במודל
    const handleSaveWage = async () => {
        if (!newWageInput || isNaN(newWageInput)) {
            setWageError(t('invalid_wage_error'));
            return;
        }
        const { userId } = wageModal;
        const res = await updateStaffWage(userId, Number(newWageInput), token);
        if (res.success) {
            setActiveStaff(prev => prev.map(user => user._id === userId ? { ...user, hourlyWage: Number(newWageInput) } : user));
            setWageModal(prev => ({ ...prev, visible: false }));
            setWageError(''); // איפוס השגיאה להבא
        } 
        else {
            setWageError(res.message || t('error'));
        }
    };


    // פונקציית שמירת בונוס
    const handleSaveBonus = async () => {
        if (!bonusInput || isNaN(bonusInput)) {
            Alert.alert(t('error'), t('invalid_number'));
            return;
        }
        const res = await addStaffBonus(bonusModal.userId, Number(bonusInput), token);
        if (res.success) {
            loadActiveStaff(); // מרענן את הרשימה מהשרת כדי להציג את הבונוס החדש
            setBonusModal({ visible: false, userId: null, fullName: '' });
            setBonusInput('');
        } 
        else {
            Alert.alert(t('error'), res.message);
        }
    };

    // פונקציית איפוס ותשלום לכולם
    const handleResetAllWages = async () => {
        const res = await resetAllWages(token);
        if (res.success) {
            setActiveStaff(res.data.staff); // מעדכן את המסך עם הנתונים המאופסים
            Alert.alert(t('success'), t('payout_success'));
        } 
        else {
            Alert.alert(t('error'), res.message);
        }
    };



    // פונקציה לרינדור כרטיס עובד מאושר (טאב צוות ושכר)
    const renderActiveStaffItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.cardHeader, { flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%' }]}>
                <View style={[styles.avatar, { backgroundColor: '#34495E' }]}>
                    <Text style={styles.avatarText}>{item.fullName ? item.fullName.charAt(0) : 'E'}</Text>
                </View>
                <View style={[styles.userInfo, { alignItems: isRtl ? 'flex-end' : 'flex-start', marginRight: isRtl ? 12 : 0, marginLeft: isRtl ? 0 : 12, flex: 1 }]}>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.fullName}</Text>
                    <Text style={[styles.userEmail, { color: theme.text, opacity: 0.5, marginBottom: 5 }]}>{item.email}</Text>
                    
                    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
                        <Text style={{ color: theme.text, fontSize: 13 }}>{t('hourly_wage_label')} <Text style={{ fontWeight: 'bold', color: theme.primary }}>{item.hourlyWage || 0}₪</Text></Text>
                        <TouchableOpacity style={{ marginHorizontal: 8 }} 
                            onPress={() => { 
                                setWageModal({ visible: true, userId: item._id, fullName: item.fullName, currentWage: item.hourlyWage }); 
                                setNewWageInput(String(item.hourlyWage));
                                setWageError(''); 
                            }}
                        >
                            <Ionicons name="pencil-outline" size={16} color={theme.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginHorizontal: 8 }} onPress={() => { setBonusModal({ visible: true, userId: item._id, fullName: item.fullName }); setBonusInput(''); }}>
                            <Ionicons name="gift-outline" size={16} color="#F1C40F" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.text, opacity: 0.5 }}>{t('monthly_earnings_label')}</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2ECC71' }}>₪{item.monthlyEarnings || 0}</Text>
                </View>
            </View>
        </View>
    );


   

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('manage_users')} />
            <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity style={[styles.tab, activeTab === 'active' && [styles.activeTab, { backgroundColor: theme.primary }]]} onPress={() => setActiveTab('active')}>
                    <Text style={[styles.tabText, activeTab === 'active' ? styles.activeTabText : { color: theme.text }]}> {t('staff_and_wages')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.tab, activeTab === 'pending' && [styles.activeTab, { backgroundColor: theme.primary }]]} onPress={() => setActiveTab('pending')}>
                    < Text style={[styles.tabText, activeTab === 'pending' ? styles.activeTabText : { color: theme.text }]}> {t('waiting_for_approval')} </Text>
                </TouchableOpacity>
            </View>

            {/* תוכן הטאב הנבחר */}
            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
                ) : activeTab === 'pending' ? (
                    /* רשימת הממתינים לאישור */
                    <FlatList data={pendingUsers} keyExtractor={(item) => item._id} renderItem={renderPendingItem} 
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={70} color={theme.text} style={{ opacity: 0.15 }} />
                                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_pending_users')}</Text>
                            </View>
                        } 
                        contentContainerStyle={{ paddingBottom: 20 }} 
                    />
                ) : (
                    /* רשימת העובדים המאושרים והשכר שלהם */
                    <FlatList data={activeStaff} keyExtractor={(item) => item._id} renderItem={renderActiveStaffItem} 
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="cash-outline" size={70} color={theme.text} style={{ opacity: 0.15 }} />
                                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_active_staff')}</Text>
                            </View>
                        } 
                       ListFooterComponent={
                            activeStaff.length > 0 ? (
                                <TouchableOpacity style={{ backgroundColor: '#2ECC71', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 }} onPress={handleResetAllWages}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('pay_all_btn')}</Text>
                                </TouchableOpacity>
                            ) : null
                        }
                        contentContainerStyle={{ paddingBottom: 20 }} 
                    />
                )}
            </View>

            {/* מודל אישור/דחייה מעוצב בהתאמה אישית */}
            <Modal visible={actionModal.visible} transparent={true} animationType="fade" onRequestClose={() => setActionModal(prev => ({ ...prev, visible: false }))}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={[styles.modalIconCircle, { backgroundColor: actionModal.isApproved ? '#2ECC71' + '20' : '#E63946' + '20' }]}>
                            <Ionicons name={actionModal.isApproved ? "checkmark-circle-outline" : "alert-circle-outline"} size={40} color={actionModal.isApproved ? '#2ECC71' : '#E63946'} />
                        </View>
                        <Text style={[styles.modalTitle, { color: theme.text }]}> {actionModal.isApproved ? t('approve_title') : t('reject_title')} </Text>
                        <Text style={[styles.modalDescription, { color: theme.text, opacity: 0.7 }]}> {actionModal.isApproved ? t('approve_question') : t('reject_question')} <Text style={{ fontWeight: 'bold' }}>{actionModal.fullName}</Text>? </Text>

                        <View style={[styles.modalButtons, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setActionModal(prev => ({ ...prev, visible: false }))} >
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: actionModal.isApproved ? '#2ECC71' : '#E63946' }]} onPress={handleConfirmAction}>
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* מודל עריכת שכר שעתי לעובד קיים */}
            <Modal visible={wageModal.visible} transparent={true} animationType="slide" onRequestClose={() => setWageModal(prev => ({ ...prev, visible: false }))}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Ionicons name="cash-outline" size={40} color={theme.primary} style={{ marginBottom: 10 }} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('update_wage_title')}</Text>
                        <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 15, textAlign: 'center' }}>{t('for_employee')} <Text style={{ fontWeight: 'bold' }}>{wageModal.fullName}</Text></Text>
                        <TextInput 
                            style={{ backgroundColor: theme.background, color: theme.text, padding: 12, borderRadius: 10, width: '100%', textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 10, borderWidth: 1, borderColor: theme.border }}
                            keyboardType="numeric"
                            value={newWageInput}
                            onChangeText={(text) => {
                                setNewWageInput(text);
                                if(wageError) setWageError(''); 
                            }}
                            autoFocus
                        />

                        {wageError ? (
                            <Text style={{ color: '#E63946', fontSize: 13, marginBottom: 15, fontWeight: '600', textAlign: 'center' }}> {wageError}</Text>
                        ) : null}

                        <View style={[styles.modalButtons, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setWageModal(prev => ({ ...prev, visible: false }))}>
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleSaveWage}>
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/*  מודל חלוקת בונוס */}
            <Modal visible={bonusModal.visible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Ionicons name="gift-outline" size={40} color="#F1C40F" style={{ marginBottom: 10 }} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('give_bonus_title')}</Text>
                        <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 15, textAlign: 'center' }}>{t('for_employee')} <Text style={{ fontWeight: 'bold' }}>{bonusModal.fullName}</Text></Text>
                        <TextInput style={{ backgroundColor: theme.background, color: theme.text, padding: 12, borderRadius: 10, width: '100%', textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 20, borderWidth: 1, borderColor: theme.border }} keyboardType="numeric" placeholder={t('bonus_amount_placeholder')} value={bonusInput} onChangeText={setBonusInput} autoFocus/>

                        <View style={[styles.modalButtons, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setBonusModal(prev => ({ ...prev, visible: false }))}>
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1C40F' }]} onPress={handleSaveBonus}>
                                <Text style={[styles.modalBtnText, { color: '#000' }]}>{t('confirm')}</Text>
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
    content: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
    tabContainer: { margin: 15, borderRadius: 12, padding: 4, borderWidth: 1 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.16, shadowRadius: 2 },
    tabText: { fontSize: 14, fontWeight: '600' },
    activeTabText: { color: '#fff', fontWeight: 'bold' },
    card: { padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
    cardHeader: { alignItems: 'center' },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    roleText: { fontSize: 11, fontWeight: '700' },
    userEmail: { fontSize: 12 },
    actions: { justifyContent: 'space-between', marginTop: 15 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, marginHorizontal: 4 },
    approveBtn: { backgroundColor: '#2ECC71' },
    rejectBtn: { backgroundColor: '#E63946' },
    btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
    emptyState: { alignItems: 'center', marginTop: 120 },
    emptyText: { marginTop: 12, fontSize: 15, opacity: 0.4, fontWeight: '500', textAlign: 'center' },
    
    // עיצוב שכבת המודל המותאם אישית
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', padding: 25, borderRadius: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
    modalIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    modalDescription: { fontSize: 15, textAlign: 'center', marginBottom: 25, paddingHorizontal: 10, lineHeight: 22 },
    modalButtons: { justifyContent: 'space-between', width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
    modalBtnText: { fontWeight: 'bold', fontSize: 15 }
});

export default ManageUsersScreen;