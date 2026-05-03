import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import Header from '../../components/header';

const ProfileScreen = () => {
    const { theme, t } = useContext(ThemeContext);
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t('profile')} />
            <View style={styles.content}>
                <Text style={{ fontSize: 24, color: theme.text, fontWeight: 'bold' }}>אזור הפרופיל בבנייה 🚧</Text>
            </View>
        </View>
    );
};
const styles = StyleSheet.create({ container: { flex: 1 }, content: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
export default ProfileScreen;