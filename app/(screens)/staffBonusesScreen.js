import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import Header from '../../components/header';

const StaffBonusesScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const { token } = useContext(AuthContext);
    const { API_URL } = useContext(ServerContext);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('salary'); // זה או המשכורת או המשמרות 
    const isRtl = language === 'he';

    // שאיבת נתוני הבונוס, השכר, היסטוריית משמרות והיסטוריית משכורות של המשתמש הנוכחי מהשרת
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                //console.log("Token sent:", token);
                const userRes = await axios.get(`${API_URL}/auth/my-bonus-data`, { headers: { Authorization: `Bearer ${token}` }});
                setUserData(userRes.data);
            } 
            catch (err) { console.error("Error fetching staff data:", err); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [API_URL, token]);


    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const payoutHistory = userData?.payoutHistory ? [...userData.payoutHistory].reverse() : []; // היסטוריית תשלומים מהחדש לישן
    const shiftHistory = userData?.shiftHistory ? [...userData.shiftHistory].reverse() : []; // היסטוריית משמרות מהחדשה לישנה
    const managerBonuses = payoutHistory?.filter(item => item.isManagerBonus)?.reduce((sum, item) => sum + item.bonuses, 0) || 0; // החישוב של הבונוסים מהמנהל

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('my_bonuses')} />
            {/* <TouchableOpacity 
                style={{ backgroundColor: '#E63946', padding: 10, margin: 15, borderRadius: 10, alignItems: 'center' }}
                onPress={async () => {
                    try {
                        alert("מזריק נתונים... אנא המתיני");
                        await axios.post(`${API_URL}/auth/inject-test-data`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        alert("הנתונים הוזרקו! צאי מהמסך וכנסי אליו מחדש כדי לראות.");
                    } catch (e) {
                        alert("שגיאה בהזרקה: " + e.message);
                    }
                }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>🧪 לחצי כאן להזרקת נתונים לבדיקה 🧪</Text>
            </TouchableOpacity> */}
            
            {/* --- קופת החודש הנוכחי (סטטיסטיקה למעלה) --- */}
            {/* --- קופת החודש הנוכחי (סטטיסטיקה למעלה) --- */}
           <View style={[styles.statsContainer, { backgroundColor: theme.primary }]}>
                {/*  שכר לשעה ובונוס מהמנהל */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10 }}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.statsLabel}> {language === 'he' ? 'שכר לשעה' : 'Hourly Wage'}</Text>
                        <Text style={{color: '#fff', fontSize: 22, fontWeight: 'bold'}}> ₪{userData?.hourlyWage || 35}  </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.statsLabel}> {language === 'he' ? 'בונוס מנהל' : 'Manager Bonus'}</Text>
                        <Text style={{color: '#F1C40F', fontSize: 22, fontWeight: 'bold'}}> ₪{managerBonuses} </Text>
                    </View>
                </View>
                
                {/* שכר חודשי מצטבר */}
                <Text style={styles.statsLabel}> {language === 'he' ? 'שכר חודשי מצטבר' : 'Monthly Earnings'}</Text>
                <Text style={styles.statsValue}>{userData?.monthlyEarnings?.toFixed(2) || 0}₪</Text>
            </View>

            {/* תפריט טאבים */}
            <View style={[styles.tabContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity  style={[styles.tab, activeTab === 'salary' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}  onPress={() => setActiveTab('salary')} >
                    <Text style={{ color: activeTab === 'salary' ? theme.primary : theme.text, fontWeight: 'bold', fontSize: 16 }}> {t('tab_salaries')} </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'shifts' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]} onPress={() => setActiveTab('shifts')} >
                    <Text style={{ color: activeTab === 'shifts' ? theme.primary : theme.text, fontWeight: 'bold', fontSize: 16 }}> {t('tab_shifts')}</Text>
                </TouchableOpacity>
            </View>

            {/*  תוכן לפי הלשונית שנבחרה  */}

            {activeTab === 'salary' && (
                <FlatList 
                    data={payoutHistory}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ padding: 15 }}
                    renderItem={({ item }) => {
                        const baseSalary = (item.amount - item.bonuses).toFixed(2);
                        
                        return (
                            <View style={[styles.card, { backgroundColor: theme.card }]}>
                                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10, marginBottom: 10 }}>
                                    <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                        <Text style={{color: theme.text, fontWeight: 'bold', fontSize: 16}}>{t('monthly_salary_title')}</Text>
                                        <Text style={{color: theme.text, opacity: 0.6}}>{new Date(item.date).toLocaleDateString(isRtl ? 'he-IL' : 'en-US')}</Text>
                                    </View>
                                    <View style={{ justifyContent: 'center' }}>
                                        <Text style={{color: theme.text, opacity: 0.8}}>{t('tables_served')}: {item.tablesServed}</Text>
                                    </View>
                                </View>
                                
                                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}> {t('base_salary')}: ₪{baseSalary} </Text>
                                    <View style={{ backgroundColor: '#2ECC71' + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                        <Text style={{color: '#2ECC71', fontWeight: 'bold', fontSize: 16}}> {t('plus_bonus')}: ₪{item.bonuses} </Text>
                                    </View>
                                </View>
                                
                                {/* סה"כ לתשלום */}
                                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', marginTop: 10 }}>
                                    <Text style={{color: theme.primary, fontWeight: 'bold', fontSize: 20}}>{t('total_paid')}: ₪{item.amount?.toFixed(2)} </Text>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: theme.text, opacity: 0.6 }}>{t('no_salary_history')}</Text>}
                />
            )}

            {activeTab === 'shifts' && (
                <FlatList 
                    data={shiftHistory}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ padding: 15 }}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: theme.card, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' }]}>
                            {/* תאריך ושעות משמרת */}
                            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                <Text style={{color: theme.text, fontWeight: 'bold', fontSize: 16}}>{t('shift_summary')} • {new Date(item.date).toLocaleDateString(isRtl ? 'he-IL' : 'en-US')}</Text>
                                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', marginTop: 5 }}>
                                    <Text style={{color: theme.text, opacity: 0.8, marginLeft: isRtl ? 0 : 10, marginRight: isRtl ? 10 : 0}}> ⏱️ {item.hoursWorked} {t('hours')} </Text>
                                    <Text style={{color: theme.text, opacity: 0.8}}> 🍽️ {item.tablesServed} {t('tables')} </Text>
                                </View>
                            </View>
                            
                            {/* הבונוס של המשמרת */}
                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{color: theme.text, fontSize: 12, opacity: 0.8}}>{t('shift_bonus')}</Text>
                                <Text style={{color: item.shiftBonus > 0 ? '#F1C40F' : theme.text, fontWeight: 'bold', fontSize: 18, opacity: item.shiftBonus > 0 ? 1 : 0.4 }}> ₪{item.shiftBonus}</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: theme.text, opacity: 0.6 }}>{t('no_shift_history')}</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    statsContainer: { paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },    statsLabel: { color: '#fff', fontSize: 16, opacity: 0.9 },
    statsValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },    tabContainer: { flexDirection: 'row', marginTop: 15, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingHorizontal: 5 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    card: { padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
});

export default StaffBonusesScreen;