import React, { useContext , useEffect , useState , useRef } from "react";
import { View, Text, StyleSheet, ScrollView , Animated, Easing, Dimensions, FlatList , TouchableOpacity , Alert } from "react-native";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { ServerContext } from "../../context/ServerContext";
import { CartContext } from "../../context/CartContext";
import { useNavigation } from "expo-router";
import Header from "../../components/header";
import DashboardCard from "../../components/DashboardCard";
import DishCard from "../../components/DishCard";
import AddToCartModal from "../../components/AddToCartModal";


const HomeScreen = () => {
    const {user} = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const { theme , t , language} = useContext(ThemeContext);
    const navigation = useNavigation();
    const { getProducts , getActiveStaff, toggleShift , getActiveOrders } = useContext(ServerContext);
    const [recommendedDishes, setRecommendedDishes] = useState([]);
    const [dailyUpdates, setDailyUpdates] = useState("");
    const [selectedDish, setSelectedDish] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [activeStaff, setActiveStaff] = useState([]); // רק למנהלים - רשימת עובדים במשמרת הנוכחית 
    const [activeOrders, setActiveOrders] = useState([]);
    const { width } = Dimensions.get('window'); // רוחב המסך לשימוש באנימציות
    const marqueeAnim = useRef(new Animated.Value(width)).current;
   

    useEffect(() => {
        Animated.loop(
            Animated.timing(marqueeAnim, {
                toValue: -width * 1.5,
                duration: 10000, // 10 שניות לסיבוב
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();
    }, []);


    // חסימת אבטחה אם המשתמש לא מחובר, מחזירים אותו מיד למסך הלוגין
    useEffect(() => {
        if(!user)
            navigation.replace('(screens)/index');

       // יצירת פונקציה אסינכרונית פנימית כדי שנוכל להשתמש ב-await לטעינת ההמלצות של השף
        const loadRecommendations = async () => {
            try {
                const allProducts = await getProducts();
                if (allProducts && allProducts.length > 0) {
                    const randomDishes = allProducts.sort(() => 0.5 - Math.random()).slice(0, 6); //חצי לסיכוי של 50 אחוז למנה להיבחר 
                    setRecommendedDishes(randomDishes);
                }
            } catch (error) {
                console.error("Failed to load recommendations:", error);
            }
        };

        loadRecommendations();
    } , [user]);

    // טעינת עובדים רק אם המשתמש הוא אדמין
    useEffect(() => {
        if( user && user.role === 'admin') {
            const loadData = async () =>{
                const staffData = await getActiveStaff();
                setActiveStaff(staffData);
                const ordersData = await getActiveOrders(); 
                setActiveOrders(ordersData);
            };
             loadData();
        }
    } , [user]);



    // מכין את רשימת המנות כטקסט
    const showOrderDetails = (order) => {
        console.log("Order pressed:", order);
        const itemsList = order.items.map(item => `${item.product?.name?.[language] || t('dish')} x${item.quantity}`).join('\n');        Alert.alert(
            `${t('table')} ${order.tableNumber}`,
            `${t('waiter')}: ${order.user?.fullName || t('unknown')}\n\n${t('items')}:\n${itemsList}`, //המלצר ששלח את ההזמנה הוא זה שמטפל בשולחן  
            [{ text: t('close') }]
        );
    };

    if (!user) return null;
    const textAlign = language === "he" ? "right" : "left";

    // useEffect(() => {
    //     console.log("🛒 המנות בצלחת שלי:", cart);
    // }, [cart]);


    return (
        <View style={[styles.container , { backgroundColor: theme.background }]}>
            <Header title = {t('home_title')} />
            
            <ScrollView style = {styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                 <View style={[styles.topRowContainer, { flexDirection: language === 'he' ? 'row-reverse' : 'row' }]}>
                    <View style={{ height: 200 }} />
                    {/* אזור קבלת הפנים */}
                    <View style={[styles.welcomeSection, { alignItems: language === 'he' ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.welcomeText, { color: theme.text, textAlign: textAlign }]}> {t('welcome_user')} {user.fullName}! </Text>
                        <Text style={[styles.roleText, { color: theme.primary, textAlign: textAlign }]}> {t('your_role')}: {t(user.role)}</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circlesScroll} contentContainerStyle={{ flexGrow: 1, justifyContent: language === 'he' ? 'flex-start' : 'flex-end' }}>
                         <View style={styles.dashboardContainer}>
                            {/* --- מסכים של לקוח  --- */}
                            {user.role === 'customer' && (
                                <>
                                    <DashboardCard title={t('menu')} subtitle={t('menu_description')}  icon="🍔"  theme={theme}  onPress={() => navigation.navigate('(screens)/menuScreen')}  />
                                    <DashboardCard  title={t('my_orders')} subtitle={t('orders_desc')} icon="📜" theme={theme}  onPress={() => navigation.navigate('(screens)/ordersScreen')}  />
                                    <DashboardCard title={t('profile')} subtitle={t('profile_desc')} icon="👤" theme={theme} onPress={() => navigation.navigate('(screens)/profileScreen')} />
                                    <DashboardCard title={t('about')} subtitle={t('about_desc')} icon="ℹ️" theme={theme} onPress={() => navigation.navigate('(screens)/aboutScreen')} />
                                </>
                            )}

                            {/* --- מסכים של מלצר / עובד  --- */}
                            {user.role === 'waiter' && (
                                <>
                                    <DashboardCard  title={t('active_tables')} subtitle={t('tables_desc')} icon="🍽️"  theme={theme} onPress={() => navigation.navigate('(screens)/tablesScreen')} />
                                    <DashboardCard title={t('my_bonuses')} subtitle={t('bonuses_desc')} icon="💰" theme={theme} onPress={() => navigation.navigate('(screens)/staffBonusesScreen')}/>
                                </>
                            )}

                            {/* --- מסכים של מנהל  --- */}
                            {user.role === 'admin' && (
                                <>
                                    <DashboardCard title={t('dashboard')} subtitle={t('dashboard_desc')}  icon="📊" theme={theme}  onPress={() => navigation.navigate('(screens)/dashboardScreen')} />
                                    <DashboardCard  title={t('manage_users')} subtitle={t('users_desc')} icon="👥" theme={theme} onPress={() => navigation.navigate('(screens)/manageUsersScreen')}  />
                                    <DashboardCard title={t('manage_menu')} subtitle={t('edit_menu_desc')} icon="📝" theme={theme} onPress={() => navigation.navigate('(screens)/editMenuScreen')} />
                                </>
                            )}
                        </View>
                    </ScrollView>
                </View>

                <View height = '20'></View>


                {user.role !== 'customer' && (
                    <View style={{ paddingHorizontal: 15 , marginTop: -40 , marginBottom: 10 , alignItems: language === 'he' ? 'flex-end' : 'flex-start'}}>
                        <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },shadowOpacity: 0.2,shadowRadius: 3,}} 
                            onPress={async () => {
                                const res = await toggleShift(user.id);
                                if(res.success) {
                                    const data = await getActiveStaff();
                                    setActiveStaff(data);
                                }
                            }}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{t('toggle_shift_status')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ marginTop: 10 }}>
                    {user.role === 'customer' && recommendedDishes.length > 0 ? (
                        <>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: textAlign }}>
                                {t('chef_recommendations')} ✨
                            </Text>
                            <View style={{ marginTop: 15 }}>
                                <FlatList data={recommendedDishes} keyExtractor={(item) => item._id} horizontal showsHorizontalScrollIndicator={false} renderItem={({ item }) => (
                                        <View style={{ width: width * 0.60, marginHorizontal: 5 }}> 
                                            <DishCard product={item} onAddPress={(dish) => {setSelectedDish(dish); setModalVisible(true);}} />
                                        </View>
                                    )}
                                />
                            </View>
                        </>

                    ) : user.role === 'admin' ? (
                        <View style={{ paddingHorizontal: 5 }}>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: textAlign, marginBottom: 15 }}>{t('live_monitor')} 📊</Text>
                            {/* רשימת עובדים במשמרת */}
                            <Text style={{ color: theme.text, opacity: 0.8, textAlign: textAlign, marginBottom: 10, fontWeight: '600' }}>{t('staff_on_duty')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                {activeStaff && activeStaff.length > 0 ? (
                                    activeStaff.map((staff) => (
                                        <View key={staff._id} style={{ alignItems: 'center', marginRight: 15 }}>
                                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}> {staff.fullName.substring(0, 1)}{staff.fullName.split(' ')[1]?.substring(0, 1) || ''} </Text>
                                            </View>
                                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '500' }}>{staff.fullName.split(' ')[0]}</Text>
                                            <Text style={{ color: theme.text, fontSize: 10, opacity: 0.6 }}>{staff.hourlyWage}₪/h</Text>
                                        </View>
                                    ))
                                ) : (
                                    /* מה יופיע כשאין אף אחד במשמרת */
                                    <Text style={{ color: theme.text, opacity: 0.5, marginVertical: 10 }}>{t('no_staff_online')}</Text>
                                )}
                            </ScrollView>

                            {/* שולחנות שביצעו הזמנה */}
                            <Text style={{ color: theme.text, opacity: 0.8, textAlign: textAlign, marginBottom: 10, fontWeight: '600' }}>{t('active_orders')}</Text>
                            {activeOrders && activeOrders.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    {activeOrders.map((order) => (
                                        <TouchableOpacity key={order._id} style={{ width: '48%', backgroundColor: theme.card, padding: 15, borderRadius: 15, marginBottom: 10, borderRightWidth: 4, borderRightColor: theme.primary, elevation: 2 }} onPress={() => showOrderDetails(order)}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}> {t('table')} {order.tableNumber}</Text>
                                            <Text style={{ fontSize: 12, color: theme.text, opacity: 0.7 }}>{order.items.length} {t('items')}</Text>
                                            <View style={{ marginTop: 8, backgroundColor: theme.primary + '20', padding: 4, borderRadius: 5, alignSelf: language === 'he' ? 'flex-end' : 'flex-start' }}>
                                                <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}> {t(order.status)} </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={{ padding: 40, backgroundColor: theme.card, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: theme.border }}>
                                    <Text style={{ color: theme.text, opacity: 0.6 }}>{t('no_active_tables_yet')}</Text>
                                </View>
                                )}
                            </View>
                    ) : null }
                </View>

            </ScrollView>

            {/* באנר רץ (Marquee) בתחתית המסך - מושך נתונים מהמנהל */}
            <View style={{ height: 45, backgroundColor: theme.primary, justifyContent: 'center' }}>
                <Animated.Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, transform: [{ translateX: marqueeAnim }] }}>{dailyUpdates || t('updates_title')}  </Animated.Text>
            </View>

            <AddToCartModal visible={isModalVisible} dish={selectedDish}  onClose={() => setModalVisible(false)}  onAddToCart={(orderData) => { console.log("הזמנה חדשה התקבלה במערכת:", orderData); setModalVisible(false);}}  />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { width: '100%' },
    scrollContent: { padding: 15 },
    topRowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 },
    welcomeSection: { width: '35%', paddingHorizontal: 5 },
    welcomeText: { fontSize: 24, fontWeight: 'bold', width: '100%' , letterSpacing: -0.5}, 
    roleText: { fontSize: 14, marginTop: 2, width: '100%', opacity: 0.6 , fontWeight: '500' },
    circlesScroll: { width: '65%' },
    dashboardContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }
});

export default HomeScreen;