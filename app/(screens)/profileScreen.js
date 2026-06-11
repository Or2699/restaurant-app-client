import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { ServerContext } from '../../context/ServerContext';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
    const { theme, t, language, toggleLanguage } = useContext(ThemeContext);
    const { user, token, logout } = useContext(AuthContext);
    const { updateUserProfile } = useContext(ServerContext);   
    const isRtl = language === 'he';
    const textAlign = isRtl ? 'right' : 'left';
    const [name, setName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // פונקציה לשמירת הפרופיל עדכון פרטים 
    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('error'), "שם לא יכול להיות ריק");
            return;
        }
        
        const currentId = user?.id || user?._id; 
        const res = await updateUserProfile(currentId, { fullName: name, phone }, token);
        
        if (res.success) {
            setToastMessage(t('profile_updated') || "הפרופיל עודכן בהצלחה!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000); // נעלם אחרי 3 שניות
        } 
        else {
            Alert.alert(t('error'), res.message);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('profile')} />           
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>              
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Ionicons name="person" size={40} color="#fff" />
                    </View>
                    <Text style={{ color: theme.text, opacity: 0.6, marginTop: 5 }}>{t(user?.role)}</Text>
                </View>

                <Text style={{ color: theme.text, marginBottom: 5, textAlign }}>{t('full_name')}</Text>
                <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign }]} value={name} onChangeText={setName} />               
                <Text style={{ color: theme.text, marginBottom: 5, textAlign, marginTop: 10 }}>{t('phone_label')}</Text>
                <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, textAlign }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('save')}</Text>
                </TouchableOpacity>

                <View style={styles.divider}/>

                <TouchableOpacity style={[styles.actionBtn, { flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={toggleLanguage}>
                    <Ionicons name="language" size={22} color={theme.text} />
                    <Text style={{ color: theme.text, marginHorizontal: 15, fontSize: 16 }}>{t('switch_lang') || 'החלף שפה / Switch Language'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { flexDirection: isRtl ? 'row-reverse' : 'row', marginTop: 20 }]} onPress={logout}>
                    <Ionicons name="log-out-outline" size={22} color="#E63946" />
                    <Text style={{ color: '#E63946', fontWeight: 'bold', marginHorizontal: 15, fontSize: 16 }}>{t('logout')}</Text>
                </TouchableOpacity>
            </View>

            {/* הודעת הטוסט */}
            {showToast && (
                <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center', zIndex: 99999 }}>
                    <View style={{ backgroundColor: '#2ECC71', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginHorizontal: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{toastMessage}</Text>
                    </View>
                </View>
            )}
            
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { margin: 20, padding: 25, borderRadius: 20, borderWidth: 1, elevation: 3 },
    avatarContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    input: { borderWidth: 1, padding: 12, borderRadius: 12, fontSize: 16 },
    saveBtn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    divider: { height: 1, backgroundColor: '#ccc', opacity: 0.3, marginVertical: 25 },
    actionBtn: { alignItems: 'center' }
});

export default ProfileScreen;