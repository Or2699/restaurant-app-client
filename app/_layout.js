import {Stack} from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext.js';
import { ServerProvider } from '../context/ServerContext.js';
import { AuthProvider } from '../context/AuthContext.js';
import { CartProvider } from '../context/CartContext.js';


export default function RootLayout() {
    console.log("--- DEBUG: RootLayout is loading ---");
    return (
        <ServerProvider>
            {console.log("--- DEBUG: ServerProvider wrapped ---")}
             <AuthProvider>
                {console.log("--- DEBUG: AuthProvider wrapped ---")}
                <ThemeProvider>
                    <CartProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="(screens)/index" options={{ title: 'Login' }} />
                            <Stack.Screen name="(screens)/home" options={{ title: 'Home' }} />
                            <Stack.Screen name="(screens)/register" options={{ title: 'Register' }} />

                            {/* מסכי לקוח */}
                            <Stack.Screen name="(screens)/menuScreen" options={{ title: 'Menu' }} />
                            <Stack.Screen name="(screens)/ordersScreen" options={{ title: 'My Orders' }} />

                            {/* מסכי עובד / מלצר */}
                            <Stack.Screen name="(screens)/tablesScreen" options={{ title: 'Tables' }} />
                            <Stack.Screen name="(screens)/staffBonusesScreen" options={{ title: 'My Bonuses' }} />

                            {/* מסכי מנהל */}
                            <Stack.Screen name="(screens)/dashboardScreen" options={{ title: 'Analytics' }} />
                            <Stack.Screen name="(screens)/manageUsersScreen" options={{ title: 'Manage Users' }} />
                            <Stack.Screen name="(screens)/editMenuScreen" options={{ title: 'Edit Menu' }} />
                        </Stack>
                    </CartProvider>
                </ThemeProvider>
            </AuthProvider>
        </ServerProvider>
    );
}
