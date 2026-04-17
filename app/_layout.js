import {Stack} from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext.js';
import { ServerProvider } from '../context/ServerContext.js';
import { AuthProvider } from '../context/AuthContext.js';


export default function RootLayout() {
    console.log("--- DEBUG: RootLayout is loading ---");
    return (
        <ServerProvider>
            {console.log("--- DEBUG: ServerProvider wrapped ---")}
             <AuthProvider>
                {console.log("--- DEBUG: AuthProvider wrapped ---")}
                <ThemeProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(screens)/index" options={{ title: 'Login' }} />
                        <Stack.Screen name="(screens)/home" options={{ title: 'Home' }} />
                        <Stack.Screen name="(screens)/register" options={{ title: 'Register' }} />
                    </Stack>
                </ThemeProvider>
            </AuthProvider>
        </ServerProvider>
    );
}
