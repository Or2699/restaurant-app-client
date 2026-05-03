import React from "react";
import { TouchableOpacity, Text, StyleSheet } from 'react-native';


const DashboardCard = ({ title, subtitle, icon, theme, onPress }) => {
    return (
        <TouchableOpacity style = {[styles.card , { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
            <Text style={styles.cardIcon}>{icon}</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.cardSubtitle, { color: theme.text, opacity: 0.6 }]}>{subtitle}</Text>}
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
   card: { width: 60, height: 60, borderRadius: 25, justifyContent: 'center', alignItems: 'center',  marginBottom: 5, borderWidth: 0, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
   cardIcon: { fontSize: 24, marginBottom: 0 },
   cardTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' }, 
   cardSubtitle: { display: 'none' } 
});

export default DashboardCard;