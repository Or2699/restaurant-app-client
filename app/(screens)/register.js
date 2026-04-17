import React, { useState, useContext, useEffect } from "react"; 
import { useRouter, useNavigation , useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemeContext } from "../../context/ThemeContext";
import { ServerContext } from "../../context/ServerContext";
import { AuthContext } from "../../context/AuthContext";
import axios from 'axios';
import Header from '../../components/header';

const RegisterScreen = () => {
    const { user } = useContext(AuthContext);
    useEffect(() => {
        if (user) {
            router.replace('/home'); // אם המשתמש כבר מחובר אין גישה ללוג אין עוברים ישר להום פייג 
        }
    }, [user]);

    const params = useLocalSearchParams();
    useEffect (() => {
        if(params.initialEmail || params.initialPassword){
            setForm(prev => ({...prev , email : params.initialEmail , password : params.initialPassword}));
        }
    } , [])

    const { theme , t } = useContext(ThemeContext);
    const { API_URL } = useContext(ServerContext);
    const router = useRouter();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const [form , setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'customer' // ברירת מחדל
    });


    const styles = StyleSheet.create({
            container: { flex: 1,  alignItems: 'center', backgroundColor: theme.background },
            scroll: { width: '100%'},
            innerContainer: {  width: '100%', maxWidth: 450, alignSelf: 'center', padding: 30},
            title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
            input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
            btn: { height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
            btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
            roleContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
            roleOption: { paddingVertical: 12, paddingHorizontal: 15,  borderWidth: 1,  borderRadius: 10,  borderColor: '#ddd', minWidth: 90,  alignItems: 'center', marginHorizontal: 5 }
    });

    const handleRegister = async () => {

        setLoading(true);
        try {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#%*?&]).{8,}$/;
            if (!passwordRegex.test(form.password)) {
                alert("הסיסמה חייבת להכיל: 8 תווים, אות גדולה, אות קטנה, מספר ותו מיוחד");
                return;
            }
            if(!form.email.includes('@')){
                alert("כתובת אימייל לא תקינה");
                return;
            }

            if(!form.fullName.trim()){
                alert("אנא הזן שם מלא");
                return;
            }

            if(!form.phone.trim() || form.phone.length !== 10){
                alert("אנא הזן מספר טלפון תקין");
                return;
            }

            const response = await axios.post(`${API_URL}/auth/register`, form);
            if( response.status === 201 ){
                alert("Registration successful! Please log in.");
                navigation.goBack(); // חזרה למסך הלוגין אחרי רישום מוצלח
            }

        } 
        
        catch (err) {
           console.log("Register Error Details:", err.response?.data); 
           alert(err.response?.data?.message || "Registration failed.");
        }

        finally {
        setLoading(false); 
    
    }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Register"/>
            <ScrollView style={styles.scroll} contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.innerContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('register_title')}</Text>

                    <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder= {t('full_name')} placeholderTextColor="#666" onChangeText={(val) => setForm({ ...form, fullName: val })} autoComplete="name" textContentType="name" />
                    <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder={t('email_label')} placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" onChangeText={(val) => setForm({ ...form, email: val })} autoComplete="email" textContentType="emailAddress" value={form.email} />
                    <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder={t('phone_label')} placeholderTextColor="#666" keyboardType="phone-pad" onChangeText={(val) => setForm({ ...form, phone: val })} autoComplete="tel" textContentType="telephoneNumber" />
                    <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder={t('password_placeholder')} placeholderTextColor="#666" secureTextEntry onChangeText={(val) => setForm({ ...form, password: val })} autoComplete="new-password" textContentType="password"  value={form.password} />

                    <Text style={{ color: theme.text, marginBottom: 5 }}>{t('role_label')}</Text>
                    <View style={styles.roleContainer}>
                        {['customer', 'waiter', 'admin'].map((r) => (
                            <TouchableOpacity key={r} style={[styles.roleOption, form.role === r && { backgroundColor: theme.primary }]} onPress={() => setForm({ ...form, role: r })}>
                                <Text style={{ color: form.role === r ? '#fff' : theme.text }}>{t(r)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? t('processing') : t('register_btn')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('(screens)/index')} style={styles.footer}>
                        <Text style={{ color: theme.text }} >{t('has_account')}</Text>
                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{t('login_link')}</Text>
                    </TouchableOpacity>
                </View>
               
            </ScrollView>
        </KeyboardAvoidingView>
    );
}



export default RegisterScreen;