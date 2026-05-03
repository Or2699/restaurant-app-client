import React, { useState, useContext } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { CartContext } from '../context/CartContext';

const AddToCartModal = ({ visible, onClose, dish, onAddToCart }) => {
    const { theme , language , t } = useContext(ThemeContext);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const { addToCart } = useContext(CartContext);

    if (!dish) return null;

    const displayName = typeof dish.name === 'object' ? (dish.name[language] || dish.name.he) : dish.name;
    const textAlign = language === 'he' ? 'right' : 'left';

    const handleAdd = () => {
        addToCart(dish, quantity, notes);
        if (onAddToCart) onAddToCart({ ...dish, quantity, notes }); // שולח את המנה עם הכמות וההערות לסל
        setQuantity(1); // איפוס
        setNotes(''); 
        onClose(); 
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text, textAlign }]}>{displayName}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={{ fontSize: 20, color: theme.text }}>✖</Text>
                        </TouchableOpacity>
                    </View>

                    {/* בחירת כמות */}
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: theme.card, borderColor: theme.border }]}  onPress={() => quantity > 1 && setQuantity(q => q - 1)}>
                            <Text style={{ fontSize: 24, color: theme.text, marginTop: -2 }}>-</Text>
                        </TouchableOpacity>
                        
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginHorizontal: 20 }}>{quantity}</Text>
                        
                        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: theme.primary }]}  onPress={() => setQuantity(q => q + 1)}>
                            <Text style={{ fontSize: 24, color: '#fff', marginTop: -2 }}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: theme.text, textAlign, marginBottom: 5, fontWeight: 'bold' }}>{t('kitchen_notes')}</Text>
                    
                    <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign }]} placeholder={t('kitchen_notes_placeholder')} placeholderTextColor="#888" multiline value={notes} onChangeText={setNotes} />

                    {/* כפתור הוספה לסל - משלב תרגום ומחיר */}
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleAdd}>
                        <Text style={styles.submitText}> {t('add_to_order')} {dish.price * quantity}₪ </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};


const styles = StyleSheet.create({
    overlay: {  flex: 1,  backgroundColor: 'rgba(0,0,0,0.5)',  justifyContent: 'flex-end' },
    modalContainer: { padding: 20,  borderTopLeftRadius: 25,  borderTopRightRadius: 25,  shadowColor: '#000',  shadowOffset: { width: 0, height: -2 },  shadowOpacity: 0.2, shadowRadius: 10,  elevation: 10, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',  marginBottom: 20 },
    title: {  fontSize: 22, fontWeight: 'bold',  flex: 1 },
    closeBtn: {  padding: 5  },
    quantityContainer: {  flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25  },
    circleBtn: {  width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', borderWidth: 1  },
    input: { height: 80,  borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20,  textAlignVertical: 'top'  },
    submitBtn: { padding: 15, borderRadius: 15,  alignItems: 'center' },
    submitText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    }
});

export default AddToCartModal;