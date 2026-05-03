import React from "react";
import { ThemeContext } from "../context/ThemeContext.js";
import { AuthContext } from "../context/AuthContext.js";
import { useContext } from "react";
import {View , Text , StyleSheet , TouchableOpacity , SafeAreaView , Image} from 'react-native';
import { SIZES } from "../constants/sizes.js";
import { Sun, Moon, Languages , LogOut } from 'lucide-react-native'; // ספריה לאייקונים
import { useNavigation } from 'expo-router';


const Header = ({ title }) => {
    const {theme , isDarkMode , toggleTheme , language , toggleLanguage , t} = useContext(ThemeContext);
    const { logout, user } = useContext(AuthContext);
    const navigation = useNavigation();

    const handleLogout = async () => {
        await logout();
        navigation.replace('(screens)/index'); // מחזיר אותך להתחלה וחוסם חזרה אחורה
    };

    return(
        <SafeAreaView style={{ backgroundColor: theme.primary , width: '100%'}}>
            <View style={[styles.container , {backgroundColor: theme.primary}]}>
                

                <View style = {{ flexDirection : 'row' , alignItems : 'center' }} >
                    <Image source = { require('../assets/res_logo2.png')} style={styles.logoImage}/>
                                                 {/* פונקציית המרה */ }
                    <Text style = {styles.logoText}>{ t('welcome') }</Text> 
                </View>

                <View style={styles.rightIcons}>
                    <TouchableOpacity style={styles.iconBtn} onPress={toggleLanguage}>
                        <Languages color="#fff" size={22} />
                    </TouchableOpacity>

                    {/* כפתור מצב לילה */}
                    <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
                        {isDarkMode ? <Sun color="#fff" size={22} /> : <Moon color="#fff" size={22} />}
                    </TouchableOpacity>

                    {user && (
                        <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
                            <LogOut color="#fff" size={22} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>

    );
}


const styles = StyleSheet.create({
    container: {
        width: '100%',
        // flex: 1,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
    },

    logoText: {
        color: '#fff',
        fontSize: SIZES.h2,
        fontWeight: 'bold',
    },

    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconBtn: {
        marginLeft: 15,
        padding: 5,
    },
    logoImage: {
        width: 65, 
        height: 65,
        borderRadius: 32.5, 
        borderWidth: 2,
        borderColor: '#fff', 
        marginRight: 10,
        elevation: 3,
        shadowColor: '#000', 
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
});

export default Header;


