// login
import React, { useState, useContext , useEffect} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext.js';
import { AuthContext } from '../../context/AuthContext.js';
import { useNavigation } from 'expo-router';
import Header from '../../components/header';
import { useRouter } from 'expo-router';

const LoginScreen = () => {
    const { user } = useContext(AuthContext);
    useEffect(() => {
        if (user) {
            router.replace('/home'); // אם המשתמש כבר מחובר אין גישה ללוג אין עוברים ישר להום פייג 
        }
    }, [user]);

    const { theme , t , language} = useContext(ThemeContext);
    const { login, loading, error: serverError } = useContext(AuthContext);
    const textAlign = language === 'he' ? 'right' : 'left'; // התאמת יישור הטקסט לפי כיוון השפה

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const navigation = useNavigation();
    const router = useRouter(); // דואג לניווט עם אופציה למחיקת היסטוריה

    const validate = () => {
        let isValid = true;
        
        if (!email.includes('@')) {
            setEmailError('Please enter a valid email address');
            isValid = false;
        } 
        else {
            setEmailError('');
        }

        // בדיקת סיסמה: 8 תווים, אות גדולה, אות קטנה, מספר ותו מיוחד
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#%*?&]).{8,}$/; // ?=.* - מבטיח שיש לפחות תו אחד מהסוגים הנדרשים מבט קדימה לכל אורך הקלט 
        if (!passwordRegex.test(password)) {
            setPasswordError('Must be 8+ chars, include Upper, Lower, Number & Special char');
            isValid = false;
        } else {
            setPasswordError('');
        }

        return isValid;
    };

    const handleSubmit = async () => {
        if (validate()) {
            const result = await login(email, password);
            if (result && result.success) {
               router.replace('/(screens)/home');// מעבר למסך הבית אחרי לוגין מוצלח בלי אופציה לחזור ללוגאין !!
        }
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Login" />
            <View style={styles.contentWrapper }>
                <View style={styles.card}>
                    <Text style={[styles.title, { color: theme.text , textAlign: textAlign}]}>{t('login_title')}</Text>
                    
                    {/* שדה אימייל */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text , textAlign: textAlign}]}>{t('email_label')}</Text>
                        <TextInput 
                            style={[styles.input, { color: theme.text , textAlign: textAlign , borderColor: emailError ? 'red' : theme.border, backgroundColor: theme.card }]}
                            placeholder={t('email_placeholder')}
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            autoComplete="email" 
                            textContentType="emailAddress"
                        />
                        {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
                    </View>

                    {/* שדה סיסמה */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text , textAlign: textAlign}]}>{t('password_label')}</Text>
                        <TextInput 
                            style={[styles.input, { color: theme.text , textAlign: textAlign , borderColor: passwordError ? 'red' : theme.border, backgroundColor: theme.card }]}
                            placeholder={t('password_placeholder')}
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoComplete="current-password" 
                            textContentType="password"
                        />
                        {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
                    </View>

                    {serverError && <Text style={styles.serverErrorText}>{t(serverError)}</Text>}

                    <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.primary }]} onPress={handleSubmit} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? t('checking') : t('login_btn')}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.text, opacity: 0.7, textAlign: textAlign }]}>{t('no_account')}</Text>
                                                                                                    {/* מעבר למסך הרגיסטר עם העברת האימייל והסיסמה שהוקלדו ללוגאין למילוי אוטומטי ברגיסטר */}
                        <TouchableOpacity  onPress={() => navigation.navigate('(screens)/register' ,{initialEmail : email , initialPassword : password})}> 
                            <Text style={[styles.footerText, { color: theme.primary, fontWeight: 'bold' , textAlign: textAlign}]}>{t('register_link')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1},
    contentWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
    card: { width: '90%', maxWidth: 400, padding: 20 , alignItems: 'stretch'},
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    inputGroup: { marginBottom: 15 , width: '100%'},
    label: { fontSize: 14, marginBottom: 8, fontWeight: '600' ,width: '100%'},
    input: { height: 55, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15 },
    fieldError: { color: 'red', fontSize: 12, marginTop: 5, marginLeft: 5 },
    serverErrorText: { color: '#ff4d4d', textAlign: 'center', marginBottom: 15, fontWeight: 'bold' },
    loginButton: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    footer: { width: '100%', justifyContent: 'center', marginTop: 25 }
});

export default LoginScreen;