import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import Header from '../../components/header';

const DashboardScreen = () => {
    const { theme, t, language } = useContext(ThemeContext);
    const textAlign = language === 'he' ? 'right' : 'left';

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title="Dashboard" /> 
            
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.text, textAlign: textAlign }]}>
                    Dashboard
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    text: { fontSize: 20, fontWeight: '500', width: '100%' }
});

export default DashboardScreen;