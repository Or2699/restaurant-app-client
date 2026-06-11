import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const isRtl = language === 'he';
    const textAlign = isRtl ? 'right' : 'left';

    // פונקציות לפתיחת אפליקציות חיצוניות
    const openWaze = () => {
        Linking.openURL('https://waze.com/ul?q=Dimona');  // פותח את Waze עם כתובת המסעדה  אפשר לשים פה כתובת אמיתית 
    };

    const callRestaurant = () => { 
        Linking.openURL('tel:089999999');  // פותח את החייגן עם המספר
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('about')} />            
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>               
                <View style={styles.logoPlaceholder}>
                    <Ionicons name="restaurant" size={50} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>{t('welcome')}</Text>               
                <Text style={{ color: theme.text, opacity: 0.8, textAlign, lineHeight: 22, marginBottom: 25 }}>
                    {t('about_description')}
                </Text>
                <Text style={{ color: theme.primary, fontWeight: 'bold', textAlign, marginBottom: 10 }}>{t('quick_actions')}</Text>

                {/* כפתור ניווט */}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={openWaze}>
                    <View style={[styles.iconBox, { backgroundColor: '#33ccff' }]}>
                        <Ionicons name="navigate" size={20} color="#fff" />
                    </View>
                    <Text style={{ color: theme.text, marginHorizontal: 15, fontWeight: '500', flex: 1, textAlign }}>{t('navigate_waze')}</Text>
                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={20} color={theme.text} style={{ opacity: 0.5 }} />
                </TouchableOpacity>

                {/* כפתור טלפון */}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={callRestaurant}>
                    <View style={[styles.iconBox, { backgroundColor: '#2ECC71' }]}>
                        <Ionicons name="call" size={20} color="#fff" />
                    </View>
                    <Text style={{ color: theme.text, marginHorizontal: 15, fontWeight: '500', flex: 1, textAlign }}>{t('call_us')}</Text>
                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={20} color={theme.text} style={{ opacity: 0.5 }} />
                </TouchableOpacity>
            </View>

            <Text style={{ textAlign: 'center', color: theme.text, opacity: 0.4, marginTop: 20 }}>{t('version')} 1.0.0</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { margin: 20, padding: 25, borderRadius: 20, borderWidth: 1, elevation: 3 },
    logoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 15 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    actionBtn: { padding: 12, borderRadius: 15, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }
});

export default AboutScreen;