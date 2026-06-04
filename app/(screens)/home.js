import React, { useContext , useEffect , useState , useRef , useCallback} from "react";
import { View, Text, StyleSheet, ScrollView , Animated, Easing, Dimensions, FlatList , TouchableOpacity , Alert , TextInput} from "react-native";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { ServerContext } from "../../context/ServerContext";
import { CartContext } from "../../context/CartContext";
import { useNavigation  , useFocusEffect } from "expo-router";
import Header from "../../components/header";
import DashboardCard from "../../components/DashboardCard";
import DishCard from "../../components/DishCard";
import AddToCartModal from "../../components/AddToCartModal";
import { Ionicons } from '@expo/vector-icons';


const HomeScreen = () => {
    const {user , token} = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const { theme , t , language} = useContext(ThemeContext);
    const navigation = useNavigation();
    const { getProducts , getActiveStaff, toggleShift , getActiveOrders , updateOrderStatus , updateAnnouncement , getAnnouncement , assignWaiterToOrder } = useContext(ServerContext);
    const [recommendedDishes, setRecommendedDishes] = useState([]);
    const [dailyUpdates, setDailyUpdates] = useState("");
    const [selectedDish, setSelectedDish] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [activeStaff, setActiveStaff] = useState([]); // רק למנהלים - רשימת עובדים במשמרת הנוכחית 
    const [activeOrders, setActiveOrders] = useState([]);
    const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
    const [announcement, setAnnouncement] = useState({ he: "", en: "" }); // ההודעה שרצה כרגע
    const [inputHe, setInputHe] = useState(""); // קלט לעברית
    const [inputEn, setInputEn] = useState(""); // קלט לאנגלית
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
    const [selectedStaffMember, setSelectedStaffMember] = useState(null); // עובד שנבחר למעבר לפרופיל שלו (רק למנהלים)
    const [myStaffData, setMyStaffData] = useState(null); // שמירת הנתונים האישיים של המלצר כשהוא במשמרת    const { width } = Dimensions.get('window'); // רוחב המסך לשימוש באנימציות
    const [waiterOrders, setWaiterOrders] = useState([]); // שומר את השולחנות של המלצר
    const [unassignedOrders, setUnassignedOrders] = useState([]); // הזמנות של לקוחות ללא מלצר
    const { width } = Dimensions.get('window');
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


    // טעינת עובדים רק אם המשתמש הוא אדמין או השולחנות עבור אותו מלצר 
    useFocusEffect(
        useCallback(() => {
            if (user && user.role === 'admin' && token) {
                const loadData = async () => {
                    const staffData = await getActiveStaff(token);
                    setActiveStaff(staffData);
                    const ordersData = await getActiveOrders(token); 
                    setActiveOrders(ordersData);
                };
                loadData();
            }
            else if (user && user.role === 'waiter' && token) {
                const loadWaiterData = async () => {
                    const staffData = await getActiveStaff(token);  // בדיקה אם הוא במשמרת (isOnline)
                    const me = staffData.find(s => s._id === user.id);
                    setMyStaffData(me || null); 
                    const ordersData = await getActiveOrders(token); // משיכת ההזמנות שלו 
                    const myOrders = ordersData.filter(order => 
                        // String(order.user?._id) === String(user.id) || 
                        String(order.assignedWaiter?._id) === String(user.id) // אם אני המלצר המשויך
                    );                    
                    const newCustomerOrders = ordersData.filter(order => !order.assignedWaiter &&  ['pending', 'preparing', 'served'].includes(order.status));   // הזמנות של לקוחות ללא מלצר משויך - קריאות חדשות שצריך לטפל בהן               
                    setWaiterOrders(myOrders);
                    setUnassignedOrders(newCustomerOrders);
                };
                loadWaiterData();
            }
        }, [user, token])
    );


    //טעינת הנתונים להודעה של הבאנר
    useEffect(() => {
        const loadAnnouncement = async () => {
            const data = await getAnnouncement();
            setAnnouncement(data);
            setInputHe(data.he);
            setInputEn(data.en);
        };
        loadAnnouncement();
    } , []);


    // ברגע שרשימת העובדים מתעדכנת (למשל אחרי סגירת שולחן), מעדכנים גם את הכרטיס הפתוח
    useEffect(() => {
        if (selectedStaffMember && activeStaff) {
            const updatedMe = activeStaff.find(staff => staff._id === selectedStaffMember._id);
            if (updatedMe) {
                setSelectedStaffMember(updatedMe);
            }
        }
    }, [activeStaff]);



    // מכין את רשימת המנות כטקסט
    const showOrderDetails = (order) => {
        console.log("Order pressed:", order);
        const itemsList = order.items.map(item => `${item.product?.name?.[language] || t('dish')} x${item.quantity}`).join('\n');        
        setSelectedAdminOrder(order); // פותח את המודל של המנהל 
        // Alert.alert(
        //     `${t('table')} ${order.tableNumber}`,
        //     `${t('waiter')}: ${order.user?.fullName || t('unknown')}\n\n${t('items')}:\n${itemsList}`, //המלצר ששלח את ההזמנה הוא זה שמטפל בשולחן  
        //     [
        //         { text: t('close'), style: 'cancel' },
        //         { text: t('mark_as_served'), onPress: async () => { const res = await updateOrderStatus(order._id, 'served', token); if (res.success) setActiveOrders(res.data);}},
        //         { text: t('close_order'), onPress: async () => { const res = await updateOrderStatus(order._id, 'paid', token); if (res.success) setActiveOrders(res.data);}, style: 'destructive'}
        //     ]
        // );
    };


    // פונקציית עזר לצביעת ההזמנות של השולחנות לפי הסטטוס שלהן 
    const getStatusColor = (status) => {
        switch (status) {
            case 'preparing': return '#4A90E2'; // כחול - בהכנה
            case 'served': return '#2ECC71'; // ירוק - הוגש לשולחן
            default: return theme.primary;
        }
    };


    // פונקציית עזר לחישוב שכר וזמן עבור עובד
    const calculateShiftStats = (startTime, wage, tablesCount) => {
        if (!startTime) return { hours: "0.00", earned: "0.00", bonus: "0" };
    
        const start = new Date(startTime);
        const now = new Date();
        const hours = (now - start) / (1000 * 60 * 60);
        let bonus = 0;

        if (hours >= 10) bonus += 50; 
        if (tablesCount >= 10) bonus += 30; 

        return { hours: hours.toFixed(2) , earned: ((hours * wage) + bonus).toFixed(2) , bonus: bonus };
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
                    
                        {/* סטטיסטיקות משמרת עבור מלצר*/}
                        {user.role === 'waiter' && myStaffData && (
                            <View style={{ marginTop: 10, padding: 8, backgroundColor: theme.primary + '15', borderRadius: 10, alignItems: language === 'he' ? 'flex-end' : 'flex-start', width: '100%' }}>
                                <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 5 }}>
                                    <Ionicons name="time-outline" size={14} color={theme.primary} style={{ marginHorizontal: 4 }} />
                                    <Text style={{ fontSize: 12, color: theme.text, fontWeight: 'bold' }}>{calculateShiftStats(myStaffData.lastShiftStart, myStaffData.hourlyWage, myStaffData.currentShiftTables).hours}h</Text>
                                    <Text style={{ fontSize: 10, color: theme.text, opacity: 0.7, marginHorizontal: 2 }}>{t('shift_time')}</Text>
                                </View>
                                <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                    <Ionicons name="restaurant-outline" size={14} color={theme.primary} style={{ marginHorizontal: 4 }} />
                                    <Text style={{ fontSize: 12, color: theme.text, fontWeight: 'bold' }}>{myStaffData.currentShiftTables || 0}</Text>
                                    <Text style={{ fontSize: 10, color: theme.text, opacity: 0.7, marginHorizontal: 2 }}>{t('tables_served')}</Text>
                                </View>
                            </View>
                        )}
                        
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
                                    <DashboardCard title={t('menu')} subtitle={t('show_menu_desc')} icon="🍔" theme={theme} onPress={() => navigation.navigate('(screens)/menuScreen' , { viewOnly: true })} />
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

                {/* כניסה/יציאה ממשמרת */ }
                {user.role !== 'customer' && (
                    <View style={{ paddingHorizontal: 15 , marginTop: -40 , marginBottom: 10 , alignItems: language === 'he' ? 'flex-end' : 'flex-start'}}>
                        <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },shadowOpacity: 0.2,shadowRadius: 3,}} 
                            onPress={async () => {
                                const res = await toggleShift(user.id);
                                if(res.success) {
                                    const data = await getActiveStaff(token);
                                    setActiveStaff(data);
                                    const me = data.find(s => s._id === user.id);
                                    setMyStaffData(me || null); // עדכון הנתונים האישיים של המלצר אחרי שינוי סטטוס המשמרת
                                    const ordersData = await getActiveOrders(token);
                                    const myOrders = ordersData.filter(order =>  String(order.assignedWaiter?._id) === String(user.id)  );                    
                                    const newCustomerOrders = ordersData.filter(order => !order.assignedWaiter &&  ['pending', 'preparing', 'served'].includes(order.status));   // הזמנות של לקוחות ללא מלצר משויך - קריאות חדשות שצריך לטפל בהן               
                                    setWaiterOrders(myOrders);
                                    setUnassignedOrders(newCustomerOrders);
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
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: textAlign }}> {t('chef_recommendations')} ✨</Text>
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
                                        <TouchableOpacity key={staff._id} style={{ alignItems: 'center', marginRight: 15 }} onPress={() => setSelectedStaffMember(staff)}>
                                             <View key={staff._id} style={{ alignItems: 'center', marginRight: 15 }}>
                                                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
                                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}> {staff.fullName.substring(0, 1)}{staff.fullName.split(' ')[1]?.substring(0, 1) || ''} </Text>
                                                </View>
                                                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '500' }}>{staff.fullName.split(' ')[0]}</Text>
                                                <Text style={{ color: theme.text, fontSize: 10, opacity: 0.6 }}>{staff.hourlyWage}₪/h</Text>
                                            </View>
                                        </TouchableOpacity>
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
                                        <TouchableOpacity key={order._id} style={{ width: '48%', backgroundColor: theme.card, padding: 15, borderRadius: 15, marginBottom: 10, borderRightWidth: 5, borderRightColor: getStatusColor(order.status), elevation: 2 }} onPress={() => showOrderDetails(order)}>
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

                    // תצוגת מלצר
                    ) : user.role === 'waiter' ? (
                          <View style={{ paddingHorizontal: 5 }}>
                                <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: textAlign, marginBottom: 15 }}>{t('my_orders')} 🍽️</Text>
                                {/* הבלוק שמוסיף התראות על לקוחות שממתינים למלצר */}
                                {myStaffData && unassignedOrders && unassignedOrders.length > 0 && (
                                    <View style={{ marginBottom: 20, backgroundColor: '#FFF3CD', padding: 15, borderRadius: 15, borderColor: '#F1C40F', borderWidth: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4AC0D', textAlign: textAlign, marginBottom: 10 }}>🔔 {t('new_customer_calls')}</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                            {unassignedOrders.map((order) => (
                                                <View key={order._id} style={{ width: '100%', backgroundColor: theme.card, padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2, flexDirection: language === 'he' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <View style={{ alignItems: language === 'he' ? 'flex-end' : 'flex-start' }}>
                                                        <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{t('table')} {order.tableNumber}</Text>
                                                        <Text style={{ fontSize: 12, color: theme.text, opacity: 0.7 }}>{order.items.length} {t('items')} • {order.dinersCount || 1} {t('diners')}</Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        style={{ backgroundColor: theme.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 }}
                                                        onPress={async () => {
                                                            const res = await assignWaiterToOrder(order._id, token);                                                       
                                                            if (res.success) {
                                                                const ordersData = await getActiveOrders(token);                                                               
                                                                const myOrders = ordersData.filter(o => 
                                                                    String(o.assignedWaiter?._id) === String(user.id)
                                                                );
                                                                setWaiterOrders(myOrders);
                                                                const newCustomerOrders = ordersData.filter(o => 
                                                                    !o.assignedWaiter && ['pending', 'preparing', 'served'].includes(o.status)
                                                                );
                                                                setUnassignedOrders(newCustomerOrders);                                                               
                                                            } 
                                                            else { Alert.alert( language === 'he' ? 'שגיאה' : 'Error', language === 'he' ? 'מישהו אחר כבר לקח את השולחן או שיש שגיאה בחיבור.' : "Someone else took the table or there's a connection error."); }}}
                                                    >
                                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('claim_table')} ✋</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {!myStaffData ? (
                                    // מצב שבו המלצר לא נכנס למשמרת
                                    <View style={{ padding: 40, backgroundColor: theme.card, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: theme.border }}>
                                        <Ionicons name="bed-outline" size={40} color={theme.text} style={{ opacity: 0.3, marginBottom: 10 }} />
                                        <Text style={{ color: theme.text, opacity: 0.8, fontSize: 18, fontWeight: 'bold' }}>{t('not_on_shift')}</Text>
                                        <Text style={{ color: theme.text, opacity: 0.6, marginTop: 5 }}>{t('clock_in_prompt')}</Text>
                                    </View>
                                ) : 
                                waiterOrders && waiterOrders.length > 0 ? (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                        {waiterOrders.map((order) => (
                                            <TouchableOpacity key={order._id} style={{ width: '48%', backgroundColor: theme.card, padding: 15, borderRadius: 15, marginBottom: 10, borderRightWidth: 5, borderRightColor: getStatusColor(order.status), elevation: 2 }} onPress={() => navigation.navigate('(screens)/tablesScreen', { orderId: order._id })} >
                                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16, textAlign: textAlign }}> {t('table')} {order.tableNumber}</Text>
                                                <Text style={{ fontSize: 12, color: theme.text, opacity: 0.7, textAlign: textAlign }}>{order.items.length} {t('items')}</Text>
                                                <View style={{ marginTop: 8, backgroundColor: theme.primary + '20', padding: 4, borderRadius: 5, alignSelf: language === 'he' ? 'flex-end' : 'flex-start' }}>
                                                    <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}> {t(order.status)} </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                       
                                    </View>
                                    
                                ) : (
                                    // מצב שבו הוא במשמרת אבל עוד לא פתח שולחנות
                                     <View style={{ padding: 40, backgroundColor: theme.card, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: theme.border }}>
                                        <Text style={{ color: theme.text, opacity: 0.6 }}>{t('no_active_tables_yet')}</Text>
                                    </View>
                                )}
                          </View>
                    ) : null}
                </View>

            </ScrollView>

            {/* באנר רץ (Marquee) בתחתית המסך - מושך נתונים מהמנהל */}
            <TouchableOpacity activeOpacity={user.role === 'admin' ? 0.7 : 1} onPress={() => user.role === 'admin' && setUpdateModalVisible(true)} style={{ height: 45, backgroundColor: theme.primary, justifyContent: 'center', overflow: 'hidden' }}>
                <Animated.Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, transform: [{ translateX: marqueeAnim }] }}> {announcement[language] || t('updates_title')}  {user.role === 'admin' } </Animated.Text>
            </TouchableOpacity>



            {selectedAdminOrder && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
                    <View style={{ backgroundColor: theme.card, width: '85%', padding: 20, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 }}>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: textAlign, marginBottom: 10 }}> {t('table')} {selectedAdminOrder.tableNumber} </Text>
                        <Text style={{ fontSize: 16, color: theme.text, opacity: 0.8, textAlign: textAlign, marginBottom: 15 }}>{t('waiter_label')}: {selectedAdminOrder.assignedWaiter?.fullName ? selectedAdminOrder.assignedWaiter.fullName  : (selectedAdminOrder.user?.role === 'waiter' ? selectedAdminOrder.user.fullName  : t('unassigned')) 
                            }
                        </Text>                        
                        <View style={{ backgroundColor: theme.background, padding: 15, borderRadius: 10, marginBottom: 20 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, textAlign: textAlign, marginBottom: 10 }}>{t('items')}:</Text>
                            {selectedAdminOrder.items.map((item, index) => (
                                <View key={index} style={{ marginBottom: 8 }}>
                                    <Text style={{ color: theme.text, textAlign: textAlign, fontWeight: '500' }}> • {item.product?.name?.[language] || t('dish')} x{item.quantity}</Text>
                                    {item.notes ? (
                                        <Text style={{ color: '#E63946', opacity: 0.8, fontSize: 12, textAlign: textAlign, paddingHorizontal: 15}}> * {t('note')}: {item.notes}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        {/* כפתורי פעולה */}
                        <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: 10 }}>
                            
                            <TouchableOpacity style={{ padding: 12, backgroundColor: theme.border, borderRadius: 10, width: '30%', alignItems: 'center' }} onPress={() => setSelectedAdminOrder(null)}>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{t('close')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ padding: 12, backgroundColor: theme.primary + '80', borderRadius: 10, width: '30%', alignItems: 'center' }}
                                onPress={async () => {
                                    const res = await updateOrderStatus(selectedAdminOrder._id, 'served', token);
                                    if (res.success){
                                        setActiveOrders(res.data);
                                        const updatedStaff = await getActiveStaff(token);
                                        setActiveStaff(updatedStaff);
                                    }
                                     
                                    setSelectedAdminOrder(null);
                                }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>{t('mark_as_served')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ padding: 12, backgroundColor: '#E63946', borderRadius: 10, width: '30%', alignItems: 'center' }}
                                onPress={async () => {
                                    const res = await updateOrderStatus(selectedAdminOrder._id, 'paid', token);
                                    if (res.success) {
                                        const updatedOrders = await getActiveOrders(token);
                                        setActiveOrders(updatedOrders);
                                        const updatedStaff = await getActiveStaff(token); // מושכים מחדש את פרטי העובדים 
                                        console.log("עובדים מהשרת:", updatedStaff.map(s => s.fullName + " : " + s.currentShiftTables));
                                        setActiveStaff(updatedStaff);
                                    }
                                    setSelectedAdminOrder(null);
                                }}>
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>{t('close_order')}</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </View>
            )}

            <AddToCartModal visible={isModalVisible} dish={selectedDish}  onClose={() => setModalVisible(false)}  onAddToCart={(orderData) => { console.log("הזמנה חדשה התקבלה במערכת:", orderData); setModalVisible(false);}}  />
        
            {/* מודל עדכון הודעה למנהלת */}
            {isUpdateModalVisible && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }]}>
                    <View style={{ backgroundColor: theme.card, width: '90%', padding: 25, borderRadius: 25 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 20 }}>{t('update_marquee')} </Text>
                        <Text style={{ color: theme.text, opacity: 0.6, marginBottom: 5, textAlign: 'right' }}>עברית:</Text>
                        <TextInput style={{ backgroundColor: theme.background, color: theme.text, padding: 12, borderRadius: 10, textAlign: 'right', marginBottom: 15, borderWidth: 1, borderColor: theme.border }}value={inputHe} onChangeText={setInputHe} multiline/>
                        <Text style={{ color: theme.text, opacity: 0.6, marginBottom: 5, textAlign: 'left' }}>English:</Text>
                        <TextInput style={{ backgroundColor: theme.background, color: theme.text, padding: 12, borderRadius: 10, textAlign: 'left', marginBottom: 20, borderWidth: 1, borderColor: theme.border }} value={inputEn} onChangeText={setInputEn} multiline />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity style={{ padding: 15, backgroundColor: theme.border, borderRadius: 12, width: '45%', alignItems: 'center' }} onPress={() => setUpdateModalVisible(false)}>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{t('close')}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={{ padding: 15, backgroundColor: theme.primary, borderRadius: 12, width: '45%', alignItems: 'center' }}
                                onPress={async () => {
                                    const res = await updateAnnouncement({ announcement_he: inputHe, announcement_en: inputEn }, token);
                                    if(res.success) {
                                        setAnnouncement(res.data);
                                        setUpdateModalVisible(false);
                                        Alert.alert(t('success'), t('announcement_updated'));
                                    }
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('update_now')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}



            {/* מיני קומפוננטה לייצוג של עובד */}
            {selectedStaffMember && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 2500 }]}>
                    <View style={{ backgroundColor: theme.card, width: '85%', padding: 25, borderRadius: 25, elevation: 10 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 5 }}> {selectedStaffMember.fullName} </Text>
                        <Text style={{ fontSize: 16, color: theme.primary, fontWeight: '600', textAlign: 'center', marginBottom: 20 }}> {t(selectedStaffMember.role)} </Text>

                        <View style={{ width: '100%', backgroundColor: theme.background, padding: 15, borderRadius: 15, marginBottom: 20 }}>
                            <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={{ color: theme.text, opacity: 0.8 }}>{t('shift_time')}:</Text>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}> {calculateShiftStats(selectedStaffMember.lastShiftStart, selectedStaffMember.hourlyWage, selectedStaffMember.currentShiftTables).hours} {t('hours')} </Text>
                            </View>

                            <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={{ color: theme.text, opacity: 0.8 }}>{t('tables_served')}:</Text>
                                <Text style={{ color: theme.text, fontWeight: 'bold' }}> {selectedStaffMember.currentShiftTables || 0} </Text>
                            </View>

                            <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={{ color: theme.text, opacity: 0.8 }}>{t('bonuses_earned')}:</Text>
                                <Text style={{ color: '#F1C40F', fontWeight: 'bold' }}> ₪{calculateShiftStats(selectedStaffMember.lastShiftStart, selectedStaffMember.hourlyWage, selectedStaffMember.currentShiftTables).bonus} </Text>
                            </View>

                            {/* שכר נוכחי */}
                            <View style={{ flexDirection: language === 'he' ? 'row-reverse' : 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 5 }}>
                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{t('current_salary')}:</Text>
                                <Text style={{ color: '#2ECC71', fontWeight: 'bold', fontSize: 20 }}> ₪{calculateShiftStats(selectedStaffMember.lastShiftStart, selectedStaffMember.hourlyWage, selectedStaffMember.currentShiftTables).earned}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 15, width: '100%' }} onPress={() => setSelectedStaffMember(null)}>
                            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}> {t('close')} </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            
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