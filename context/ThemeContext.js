import React , {createContext , useState } from 'react';
import {lightTheme , darkTheme} from '../constants/colors.js';
import { translations } from '../constants/translations.js';

export const ThemeContext = createContext();

export const ThemeProvider = ({children}) => {
    const [isDarkMode , setIsDarkMode] = useState(false);
    const toggleTheme = () => {setIsDarkMode(!isDarkMode);}
    const theme = isDarkMode ? darkTheme : lightTheme;
    
    const [language , setLanguage] = useState('he');
    const toggleLanguage = () =>{
        setLanguage( prev => (prev == 'he' ? 'en' : 'he') );
    }
    // פונקציית התרגום t
    const t = (key) => { return translations[language][key] || key; } //מחזיר את התרגום של המפתח בשפה שבחרנו 

    return(
        <ThemeContext.Provider value = {{theme , isDarkMode , toggleTheme , language , toggleLanguage , t}}>
            {children}
        </ThemeContext.Provider>
    );
};
    


