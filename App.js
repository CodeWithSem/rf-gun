import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import { AlertTriangle, Download } from "lucide-react-native";

// FIREBASE REALTIME DB
import { ref, onValue } from "firebase/database";
import { realtime_db } from "@assets/scripts/firebase";

// Import your custom CSS for NativeWind
import "./global.css";

// Components
import Login from "./components/AUTHENTICATION/Login";
import Dashboard from "./components/USER_MODULE/dashboard/Dashboard";
import Transfer_Order from "./components/USER_MODULE/transfer_order/Transfer_Order";
import LPN_Management from "./components/USER_MODULE/lpn_management/LPN_Management";
import TO_Process from "./components/USER_MODULE/transfer_order/TO_Process";
import User_Direct from "./components/USER_MODULE/user_direct/User_Direct";
import LPN_Transfer from "./components/USER_MODULE/user_direct/LPN_Transfer";
import LPN_Register from "./components/USER_MODULE/lpn_management/sub_module/lpn_register/LPN_Register";
import LPN_Update from "./components/USER_MODULE/lpn_management/sub_module/lpn_update/LPN_Update";
import LPN_Search from "./components/USER_MODULE/lpn_management/sub_module/LPN_Search";
import LPN_Out from "./components/USER_MODULE/lpn_management/sub_module/LPN_Out";
import LPN_Register_Input from "./components/USER_MODULE/lpn_management/sub_module/lpn_register/LPN_Register_Input";
import LPN_Update_Input from "./components/USER_MODULE/lpn_management/sub_module/lpn_update/LPN_Update_Input";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [is_app_active, set_is_app_active] = useState(true);
  const [checking_version, set_checking_version] = useState(true);
  const app_version = "v 1.0.1";
  const app_version_rtdb = "1-0-1";
  const [allowed_modules, set_allowed_modules] = useState("");

  useEffect(() => {
    // 1. Path para sa Version Check
    const version_ref = ref(
      realtime_db,
      `DB1_ERP_SYSTEM/APP_VERSION/${app_version_rtdb}/VALUE`,
    );

    // 2. Path para sa RF Gun Modules (BAGONG DAGDAG)
    const rf_modules_ref = ref(
      realtime_db,
      `DB1_ERP_SYSTEM/RF_GUN_MODULE/VALUE`,
    );

    // Listener para sa Version
    const unsubscribe_version = onValue(
      version_ref,
      (snapshot) => {
        const data = snapshot.val();
        set_is_app_active(data === false ? false : true);
        set_checking_version(false);
      },
      (error) => {
        console.warn("RTDB Version Check Error:", error);
        set_checking_version(false);
      },
    );

    // Listener para sa RF Gun Modules (BAGONG DAGDAG)
    const unsubscribe_modules = onValue(
      rf_modules_ref,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          set_allowed_modules(data);
        }
      },
      (error) => {
        console.warn("RTDB RF Modules Error:", error);
      },
    );

    // Clean up both listeners
    return () => {
      unsubscribe_version();
      unsubscribe_modules();
    };
  }, []);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          "Outfit-Regular": require("./assets/fonts/Outfit-Regular.ttf"),
          "Outfit-Bold": require("./assets/fonts/Outfit-Bold.ttf"),
          "Outfit-Black": require("./assets/fonts/Outfit-Black.ttf"),
          "Outfit-ExtraBold": require("./assets/fonts/Outfit-ExtraBold.ttf"),
          "Outfit-ExtraLight": require("./assets/fonts/Outfit-ExtraLight.ttf"),
          "Outfit-Light": require("./assets/fonts/Outfit-Light.ttf"),
          "Outfit-Medium": require("./assets/fonts/Outfit-Medium.ttf"),
          "Outfit-SemiBold": require("./assets/fonts/Outfit-SemiBold.ttf"),
          "Outfit-Thin": require("./assets/fonts/Outfit-Thin.ttf"),
        });
      } catch (e) {
        console.warn("Font loading error:", e);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded || checking_version) return null;

  // OUTDATED VERSION SCREEN
  if (!is_app_active) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-10">
        <View className="bg-red-50 p-8 rounded-full mb-6">
          <AlertTriangle size={64} color="#ef4444" />
        </View>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-2xl text-slate-900 text-center"
        >
          App Version Outdated
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-500 text-center mt-3 mb-10 leading-6"
        >
          The version you are currently using ({app_version}) is no longer
          supported. Please download the latest APK to continue.
        </Text>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              "https://drive.google.com/drive/folders/1Xj8RjG1o_DiF8H__wLNFjgl-NMs-JXUf?usp=sharing",
            )
          }
          className="bg-slate-900 w-full py-5 rounded-2xl flex-row justify-center items-center"
        >
          <Download size={20} color="white" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white text-lg ml-2"
          >
            Download New APK
          </Text>
        </TouchableOpacity>

        <Text
          style={{ fontFamily: "Outfit-Medium" }}
          className="text-slate-400 mt-8 text-[10px] uppercase tracking-[1px]"
        >
          Build Version: {app_version}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          >
            <Stack.Screen name="Login">
              {(props) => <Login {...props} app_version={app_version} />}
            </Stack.Screen>

            <Stack.Screen name="dashboard">
              {(props) => (
                <Dashboard {...props} allowed_modules={allowed_modules} />
              )}
            </Stack.Screen>
            <Stack.Screen name="transfer_order" component={Transfer_Order} />
            <Stack.Screen name="lpn_management" component={LPN_Management} />
            <Stack.Screen name="lpn_search" component={LPN_Search} />
            <Stack.Screen name="lpn_register" component={LPN_Register} />
            <Stack.Screen
              name="lpn_register_input"
              component={LPN_Register_Input}
            />
            <Stack.Screen name="lpn_update" component={LPN_Update} />
            <Stack.Screen
              name="lpn_update_input"
              component={LPN_Update_Input}
            />
            <Stack.Screen name="lpn_out" component={LPN_Out} />
            <Stack.Screen name="to_process" component={TO_Process} />
            <Stack.Screen name="user_direct" component={User_Direct} />
            <Stack.Screen name="lpn_transfer" component={LPN_Transfer} />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
