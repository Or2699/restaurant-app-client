import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator , TouchableOpacity} from 'react-native';
import { ServerContext } from '../../context/ServerContext';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen = () => {
    const { token } = React.useContext(AuthContext);
    const { theme , t , language } = React.useContext(ThemeContext);
    const { getOrderHistory , getAllStaff , getProducts } = React.useContext(ServerContext);

    const [orders,setOrders] = useState([]);
    const [staff, setStaff] = useState([]); // עובדים 
    const [loading, setLoading] = useState(true);

    const [totalIncome, setTotalIncome] = useState(0); // הכנסה כוללת
    const [totalExpenses, setTotalExpenses] = useState(0); // הוצאות כוללות (משכורות + בונוסים)
    const [topDishCount, setTopDishCount] = useState(null); // כמות ההזמנות של המנה המובילה
    const [topDishRev, setTopDishRev] = useState(null); // הכנסה מהמנה המובילה
    const [topWaiter, setTopWaiter] = useState(null); // המלצר המוביל
    const [allPayouts, setAllPayouts] = useState([]); // כל התשלומים (משכורות + בונוסים) לכל העובדים
    const [top5Dishes, setTop5Dishes] = useState([]); // לטובת הגרף עמודות
    const [selectedStaffForHistory, setSelectedStaffForHistory] = useState(null); // הצגת משכורות לעובד ספציפי
    const [showOrdersHistory, setShowOrdersHistory] = useState(false);
    const [showStaffHistory, setShowStaffHistory] = useState(false);
    const [topPriceDish, setTopPriceDish] = useState(null); // המנה היקרה ביותר שנמכרה
    const [allProducts, setAllProducts] = useState([]);
    const [waitersTableStats, setWaitersTableStats] = useState({});

    const isRtl = language === 'he';
    
    // טעינת נתונים מהשרת היסטוריית הזמנות ועובדים וכולי 
    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            const historyData = await getOrderHistory(token);
            const staffData = await getAllStaff(token);
            const productsData = await getProducts();
            
            setOrders(historyData || []);
            setStaff(staffData || []);
            setAllProducts(productsData || []);
            setLoading(false);
        };
        if (token) loadDashboardData();
    }, [token]);


    // חישוב הסטטיסטיקות (מופעל מחדש בכל פעם שהנתונים משתנים)
    useEffect(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let currentIncome = 0; 
        let currentExpenses = 0; 
        const dishStats = {}; 
        const waiterStats = {}; 

        orders.forEach(order => { 
            currentIncome += (order.totalPrice || 0);
            if (order.createdAt) {
                const orderDate = new Date(order.createdAt);
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    const waiterId = order.user?._id || order.user;
                    if (order.user) {
                        const waiterId = order.user._id || order.user;
                        const employee = staff.find(s => s._id === waiterId);
                        
                        if (employee) {
                            if (!waiterStats[waiterId]) {
                                waiterStats[waiterId] = { name: employee.fullName, tables: 0 };
                            }
                            waiterStats[waiterId].tables += 1;
                        }
                    }

                    order.items.forEach(item => {
                        if (item.product) {
                            const pId = item.product._id;
                            if (!dishStats[pId]) {
                                dishStats[pId] = { name: item.product.name?.[language] || item.product.name?.he || t('dish'), count: 0, revenue: 0 };
                            }
                            dishStats[pId].count += item.quantity;
                            dishStats[pId].revenue += (item.quantity * (item.product.price || 0));
                        }
                    });
                }
            }
        });

        setWaitersTableStats(waiterStats);
        const dishArray = Object.values(dishStats);
        dishArray.sort((a, b) => b.count - a.count);
        setTop5Dishes(dishArray.slice(0, 5));
        let mostExpensive = null;
        let maxP = 0;
        allProducts.forEach(product => {
            const price = parseFloat(product.price) || 0;
            if (price > maxP) {
                maxP = price;
                mostExpensive = { 
                    name: product.name?.[language] || product.name?.he || t('dish'), 
                    price: maxP 
                };
            }
        });
        setTopPriceDish(mostExpensive);
        const bestCount = dishArray.length > 0 ? dishArray[0] : null;
        dishArray.sort((a, b) => b.revenue - a.revenue);
        const bestRev = dishArray.length > 0 ? dishArray[0] : null;
        const waiterArray = Object.values(waiterStats);
        waiterArray.sort((a, b) => b.tables - a.tables);
        const bestWaiter = waiterArray.length > 0 ? waiterArray[0] : null;
        const payoutsTemp = [];
        staff.forEach(member => {
            if (member.payoutHistory && member.payoutHistory.length > 0) {
                member.payoutHistory.forEach(payout => {
                    currentExpenses += (payout.amount || 0);
                    payoutsTemp.push({ ...payout, staffName: member.fullName });
                });
            }
        });
        
        payoutsTemp.sort((a, b) => new Date(b.date) - new Date(a.date));

        setTotalIncome(currentIncome);
        setTopDishCount(bestCount);
        setTopDishRev(bestRev);
        setTopWaiter(bestWaiter);
        setTotalExpenses(currentExpenses);
        setAllPayouts(payoutsTemp);

    }, [orders, staff, language]);

    
    const netProfit = totalIncome - totalExpenses; // חישוב רווח נקי רגיל פשוט
    const profitColor = netProfit >= 0 ? '#2ECC71' : '#E63946';


    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

 

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('dashboard_title')} />

            {/* הכנסות והוצאות */}
            <ScrollView contentContainerStyle={{ padding: 15 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.budgetContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.budgetMiniCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.budgetLabel, { color: theme.text }]}>{t('total_income')}</Text>
                        <Text style={[styles.budgetAmount, { color: '#2ECC71' }]}>₪{Math.round(totalIncome)}</Text>
                    </View>
                    <View style={[styles.budgetMiniCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.budgetLabel, { color: theme.text }]}>{t('total_expenses')}</Text>
                        <Text style={[styles.budgetAmount, { color: '#E63946' }]}>₪{Math.round(totalExpenses)}</Text>
                    </View>
                    <View style={[styles.budgetMiniCard, { backgroundColor: theme.primary + '20', borderColor: profitColor, borderWidth: 1.5 }]}>
                        <Text style={[styles.budgetLabel, { color: theme.text }]}>{t('net_profit')}</Text>
                        <Text style={[styles.budgetAmount, { color: profitColor }]}>₪{Math.round(netProfit)}</Text>
                    </View>
                </View>

                {/* כרטיסיות בינה עסקית */}
                <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRtl ? 'right' : 'left' }]}>{t('business_intelligence')} 🧠</Text>
                <View style={[styles.biHorizontalContainer, { flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}>
                    <View style={[styles.biSquare, { backgroundColor: theme.card, borderColor: theme.border }]}><Ionicons name="star" size={20} color="#F39C12" /><Text style={[styles.biTitle, { color: theme.text }]} numberOfLines={1}>{topDishCount?.name || '-'}</Text><Text style={[styles.biSub, { color: theme.text }]}>{t('best_seller')}</Text></View>
                    <View style={[styles.biSquare, { backgroundColor: theme.card, borderColor: theme.border }]}><Ionicons name="cash" size={20} color="#2ECC71" /><Text style={[styles.biTitle, { color: theme.text }]} numberOfLines={1}>{topDishRev?.name || '-'}</Text><Text style={[styles.biSub, { color: theme.text }]}>{t('most_profitable')}</Text></View>
                    <View style={[styles.biSquare, { backgroundColor: theme.card, borderColor: theme.border }]}><Ionicons name="pricetag" size={20} color="#E67E22" /><Text style={[styles.biTitle, { color: theme.text }]} numberOfLines={1}>{topPriceDish?.name || '-'}</Text><Text style={[styles.biSub, { color: theme.text }]}>{t('most_expensive_dish')}</Text></View>
                    <View style={[styles.biSquare, { backgroundColor: theme.card, borderColor: theme.border }]}><Ionicons name="person" size={20} color="#9B59B6" /><Text style={[styles.biTitle, { color: theme.text }]} numberOfLines={1}>{topWaiter?.name || '-'}</Text><Text style={[styles.biSub, { color: theme.text }]}>{t('top_waiter')}</Text></View>
                </View>

                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={[styles.chartWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.chartTitle, { color: theme.text, textAlign: 'center' }]}>{t('dish_revenue')}</Text>
                        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <View style={styles.yAxis}>{(() => {const max = Math.max(...top5Dishes.map(d => d.revenue), 100); return (<><Text style={[styles.yAxisText, { color: theme.text }]}>{Math.round(max)}</Text><Text style={[styles.yAxisText, { color: theme.text }]}>{Math.round(max / 2)}</Text><Text style={[styles.yAxisText, { color: theme.text }]}>0</Text></>); })()}</View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-end', padding: 10 }}>
                                {top5Dishes.map((dish, i) => {
                                    const max = Math.max(...top5Dishes.map(d => d.revenue), 100);
                                    return (
                                        <TouchableOpacity key={i} style={styles.barColumn} onPress={() => alert(`${t('dish')}: ${dish.name}\n${t('amount')}: ${dish.count}`)}>
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.text, marginBottom: 5 }}>₪{Math.round(dish.revenue)}</Text>
                                            <View style={{ height: (dish.revenue / max) * 150, width: 25, backgroundColor: theme.primary, borderRadius: 4 }} />
                                            <Text style={styles.barLabel} numberOfLines={2} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{dish.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>

                    {/* גרף השכר והבונוסים */}
                    <View style={[styles.chartWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.chartTitle, { color: theme.text, textAlign: 'center' }]}>{t('salary_bonus')}</Text>
                        <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <View style={[styles.yAxis, { marginBottom: 35 }]}>{(() => {const currentMonth = new Date().getMonth(); const currentYear = new Date().getFullYear(); const max = Math.max(...staff.map(s => s.payoutHistory?.filter(p => new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear).reduce((a, b) => a + (b.amount || 0), 0) || 0), 100); return (<><Text style={[styles.yAxisText, { color: theme.text }]}>{Math.round(max)}</Text><Text style={[styles.yAxisText, { color: theme.text }]}>{Math.round(max / 2)}</Text><Text style={[styles.yAxisText, { color: theme.text }]}>0</Text></>); })()}</View>         
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-end', padding: 10 }}>
                                {staff.map((member) => {
                                    const currentMonth = new Date().getMonth();
                                    const currentYear = new Date().getFullYear();
                                    // סינון מקומי לחישוב סכומים רק לחודש הנוכחי
                                    const monthlyPayouts = member.payoutHistory?.filter(p => new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear) || [];
                                    const total = monthlyPayouts?.reduce((a, b) => a + (b.amount || 0), 0) || 0;
                                    const bonus = monthlyPayouts?.reduce((a, b) => a + (b.bonuses || 0), 0) || 0;
                                    const salary = Math.max(0, total - bonus);
                                    const max = Math.max(...staff.map(s => s.payoutHistory?.filter(p => new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear).reduce((a, b) => a + (b.amount || 0), 0) || 1), 1);                                    
                                    const servedTables = waitersTableStats[member._id]?.tables || 0;
                                    return (
                                        <TouchableOpacity key={member._id} style={styles.barColumn} onPress={() => alert(`${t('salary')}: ₪${Math.round(salary)}\n${t('bonus')}: ₪${Math.round(bonus)}\n${t('tables_served')}: ${servedTables}`)}>
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.text, marginBottom: 5 }}>₪{Math.round(total)}</Text>
                                            <View style={{ width: 25, alignItems: 'center' }}>
                                                {bonus > 0 && <View style={{ height: (bonus / max) * 150, width: 25, backgroundColor: '#2ECC71', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />}
                                                <View style={{ height: (salary / max) * 150, width: 25, backgroundColor: theme.primary, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                                            </View>
                                            <Text style={styles.barLabel} numberOfLines={2} adjustsFontSizeToFit={true} minimumFontScale={0.7}>{member.fullName.split(' ')[0]}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </View>

                <View style={styles.historyButtonsContainer}>
                    <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: theme.primary }]} onPress={() => setShowStaffHistory(!showStaffHistory)}><Ionicons name="people" size={18} color="#fff" /><Text style={styles.toggleBtnText}>{showStaffHistory ? t('hide_salary') : t('show_salary')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: theme.primary }]} onPress={() => setShowOrdersHistory(!showOrdersHistory)}><Ionicons name="receipt" size={18} color="#fff" /><Text style={styles.toggleBtnText}>{showOrdersHistory ? t('hide_orders') : t('show_orders')}</Text></TouchableOpacity>
                </View>

                  {/* היסטוריית המשכורות והבונוסים */}
                 {showStaffHistory && (
                    <View style={[styles.historyContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'center' }]}>{t('staff_salary_details')}</Text>
                        {staff.map(member => (
                            <View key={member._id} style={{ marginBottom: 15, borderBottomWidth: 1, borderColor: '#ccc3', paddingBottom: 10 }}>
                                <Text style={{ fontWeight: 'bold', color: theme.primary, textAlign: isRtl ? 'right' : 'left' }}>{member.fullName}</Text>
                                {member.payoutHistory?.length > 0 ? member.payoutHistory.sort((a,b) => new Date(b.date) - new Date(a.date)).map((p, i) => (
                                    <View key={i} style={[styles.historyItemRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={{ color: theme.text, fontSize: 12 }}>{new Date(p.date).toLocaleDateString()}</Text>
                                        <Text style={{ color: '#E63946', fontWeight: 'bold', fontSize: 12 }}>₪{Math.round(p.amount)}</Text>
                                    </View>
                                )) : <Text style={{ fontSize: 11, color: theme.text, opacity: 0.5, textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? 'אין נתוני שכר לעובד זה' : 'No salary data for this employee'}</Text>}
                            </View>
                        ))}
                    </View>
                )}

                {/* היסטוריית ההזמנות */}
                {showOrdersHistory && (
                    <View style={[styles.historyContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'center' }]}>{t('recent_closed_orders')}</Text>
                        {[...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => (
                            <View key={o._id} style={{ marginBottom: 15, borderBottomWidth: 1, borderColor: '#ccc3', paddingBottom: 10 }}>
                                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>{t('table')} {o.tableNumber}</Text>
                                    <Text style={{ color: '#2ECC71', fontWeight: 'bold' }}>+₪{Math.round(o.totalPrice)}</Text>
                                </View>
                                <Text style={{ color: theme.text, fontSize: 10, opacity: 0.7, textAlign: isRtl ? 'right' : 'left', marginBottom: 5 }}>{new Date(o.createdAt).toLocaleString()}</Text>
                                {o.items?.map((item, idx) => (<Text key={idx} style={{ color: theme.text, fontSize: 11, textAlign: isRtl ? 'right' : 'left' }}>• {item.product?.name?.[language] || item.product?.name?.he || t('dish')} x{item.quantity}</Text>))}
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    budgetContainer: { justifyContent: 'space-between', marginBottom: 15 },
    budgetMiniCard: { width: '31%', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, elevation: 1 },
    budgetLabel: { fontSize: 11, opacity: 0.8, fontWeight: '600' },
    budgetAmount: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
    biHorizontalContainer: { flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    biSquare: { width: '22%', height: 110, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 5, elevation: 1, marginBottom: 15 },    
    biTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
    biSub: { fontSize: 9, opacity: 0.6, marginTop: 2, textAlign: 'center' },
    chartWrapper: { width: '48%', height: 320, padding: 10, borderRadius: 12, borderWidth: 1, elevation: 1 },
    chartTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
    yAxis: { height: 150, justifyContent: 'space-between', alignItems: 'center', borderRightWidth: 1, borderColor: '#ccc3', paddingRight: 5, marginBottom: 35 },    yAxisText: { fontSize: 8, opacity: 0.7 },
    barColumn: { alignItems: 'center', marginHorizontal: 8, justifyContent: 'flex-end', width: 60 },
    barLabel: { fontSize: 8, marginTop: 6, textAlign: 'center', width: 60 },
    historyButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 15 },
    toggleBtn: { width: '48%', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    toggleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginHorizontal: 8 },
    historyContainer: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    historyItemRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ccc2' }
});

export default DashboardScreen;