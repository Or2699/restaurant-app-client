// קומפוננטת כרטיס מנה 
import React , {useContext} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../context/ThemeContext.js';
import { SIZES } from '../constants/sizes.js';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';


const DishCard = ({ product , onAddPress }) => {
    const { theme , language , isDarkMode } = useContext(ThemeContext);

    //חילוץ הנתונים מהמוצר
    const displayName = typeof product.name === 'object' ? (product.name[language] || product.name.he) : product.name;
    const displayDescription = typeof product.description === 'object' ? (product.description[language] || product.description.he) : product.description;

    // הקראת טקסט המנה 
    const handleSpeak = () => {
        const textToRead = `${displayName || ''} ${displayDescription || ''}`; // מוודאים שהטקסט קיים 
        
        if (textToRead.trim().length > 0) {
            Speech.stop();
            Speech.speak(textToRead, {
                language: language === 'he' ? 'he-IL' : 'en-US',
                pitch: 1.0,
                rate: 0.9
            });
        } else {
            console.log("אין טקסט להקראה");
        }
    };

    return (
       
        <TouchableOpacity style = {[styles.card , {backgroundColor : theme.card , borderColor : theme.border}]} activeOpacity={0.8} >{/* כרטיס לחיצה על המנה - הרכיב הוא כפתור שעוטף את כולם והופך את כל מי שבתוכו ללחיץ */ }
            <Image style = {styles.image} source = {{uri : product.image || 'https://via.placeholder.com/150'}}/>
            <View style = {styles.infoContainer}>
                <View style={[styles.headerRow, { alignItems: 'flex-start' }]}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}  ellipsizeMode="tail"  > {displayName} </Text>                        
                        <TouchableOpacity onPress={handleSpeak} style={{ marginLeft: 5, padding: 5 }}>
                            <Ionicons name="volume-medium-outline" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.price, { color: isDarkMode ? '#fff' : theme.primary }]}>{product.price}₪</Text>
                </View>
                <Text style = {[styles.category , { color: isDarkMode ? '#fff' : theme.primary }]}>{product.category.toUpperCase()}</Text>
                <Text style = {[styles.description , {color : theme.text}]} numberOfLines={3}>{displayDescription}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                    {/* אזור התגיות (בודקים אם יש תגיות והיערות למנה ומציגים אותן) */}
                    <View style={{ flex: 1 }}>
                        {product.tags && product.tags.length > 0 && (
                            <View style={styles.tagsRow}>
                                {product.tags.map((tag, index) => (
                                    <View key={index} style={[styles.tagBadge, { backgroundColor: theme.border }]}>
                                        <Text style={[styles.tagText, { color: theme.text }]}>
                                            {typeof tag === 'object' ? (tag[language] || tag.he) : tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                         {onAddPress && (
                            <TouchableOpacity style={{ backgroundColor: theme.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }} onPress={() => onAddPress && onAddPress(product)} >
                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: -2 }}>+</Text>
                            </TouchableOpacity>
                         )}   

                </View>

            </View>
        </TouchableOpacity>       
    );
    

}; 


const styles = StyleSheet.create({
    card: {
        width: '94%',
        alignSelf: 'center',
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden',
        // צל עדין
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: 220,
    },
    infoContainer: {
        padding: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1, // מאפשר לשם לקחת מקום ולא לדחוף את המחיר
    },
    price: {
        fontSize: 18,
        fontWeight: '900',
        marginLeft: 10,
    },
    category: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
        marginBottom: 10,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginRight: 6,
        marginTop: 4,
    },
    tagText: {
        fontSize: 11,
    }
});


export default DishCard;

