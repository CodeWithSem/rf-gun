import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
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
import LPN_Management from "./components/USER_MODULE/lpn_management/LPN_Management";
import User_Direct from "./components/USER_MODULE/user_direct/User_Direct";
import LPN_Transfer from "./components/USER_MODULE/user_direct/LPN_Transfer";
import LPN_Register from "./components/USER_MODULE/lpn_management/sub_module/lpn_register/LPN_Register";
import LPN_Update from "./components/USER_MODULE/lpn_management/sub_module/lpn_update/LPN_Update";
import LPN_Search from "./components/USER_MODULE/lpn_management/sub_module/LPN_Search";
import LPN_Out from "./components/USER_MODULE/lpn_management/sub_module/LPN_Out";
import LPN_Register_Input from "./components/USER_MODULE/lpn_management/sub_module/lpn_register/LPN_Register_Input";
import LPN_Update_Input from "./components/USER_MODULE/lpn_management/sub_module/lpn_update/LPN_Update_Input";
import Finish_Goods from "./components/USER_MODULE/finish_goods/Finish_Goods";
import FG_Registration from "./components/USER_MODULE/finish_goods/sub_module/fg_registration/FG_Registration";
import FG_Registration_Input from "./components/USER_MODULE/finish_goods/sub_module/fg_registration/FG_Registration_Input";
import Registration_Database from "./components/USER_MODULE/finish_goods/sub_module/registration_database/Registration_Database";
import Production_Supply from "./components/USER_MODULE/transfer_order/sub_module/production_supply/Production_Supply";
import Add_LPN from "./components/USER_MODULE/transfer_order/sub_module/production_supply/Add_LPN";
import Transfer_Order from "./components/USER_MODULE/transfer_order/Transfer_Order";
import { APP_VERSION, APP_VERSION_RTDB } from "./constants/variable";
import { ItemMasterProvider } from "./assets/scripts/functions/item_master_context";
import Production from "./components/USER_MODULE/production/Production";
import Receive_Material from "./components/USER_MODULE/production/receive_material/Receive_Material";
import Dispatch_Material from "./components/USER_MODULE/production/dispatch_material/Dispatch_Material";
import Whse_Management from "./components/USER_MODULE/whse_management/Whse_Management";
import Bin_Lookup from "./components/USER_MODULE/whse_management/bin_lookup/Bin_Lookup";
import Mach_Management from "./components/USER_MODULE/mach_manement/Mach_Management";
import Downtime_Report from "./components/USER_MODULE/mach_manement/downtime_report/Downtime_Report";
import Create_Downtime from "./components/USER_MODULE/mach_manement/downtime_report/create/Create_Downtime";
import Add_Report from "./components/USER_MODULE/mach_manement/downtime_report/functions/Add_Report";
import Edit_Report from "./components/USER_MODULE/mach_manement/downtime_report/functions/Edit_Report";
import Edit_Downtime from "./components/USER_MODULE/mach_manement/downtime_report/edit/Edit_Downtime";
import Bulk_Transfer from "./components/USER_MODULE/whse_management/bulk_transfer/Bulk_Transfer";
import Stock_Transport from "./components/USER_MODULE/transfer_order/sub_module/stock_transport/Stock_Transport";
import Create_STO from "./components/USER_MODULE/transfer_order/sub_module/stock_transport/create/Create_STO";
import Edit_STO from "./components/USER_MODULE/transfer_order/sub_module/stock_transport/edit/Edit_STO";
import Receive_STO from "./components/USER_MODULE/transfer_order/sub_module/stock_transport/Receive_STO";
import View_TO_Report from "./components/USER_MODULE/transfer_order/sub_module/view_report/View_TO_Report";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [is_app_active, set_is_app_active] = useState(true);
  const [checking_version, set_checking_version] = useState(true);

  useEffect(() => {
    const version_ref = ref(
      realtime_db,
      `DB1_ERP_SYSTEM/APP_VERSION/${APP_VERSION_RTDB}/VALUE`,
    );

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

    return () => {
      unsubscribe_version();
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

  // 🔴 CUSTOM LOADING SCREEN (Pinalitan ang "return null;")
  if (!fontsLoaded || checking_version) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white justify-center items-center px-10">
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color="#0284c7" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // OUTDATED VERSION SCREEN
  if (!is_app_active) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white justify-center items-center px-10">
          <StatusBar style="dark" />
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
            The version you are currently using ({APP_VERSION}) is no longer
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
            Build Version: {APP_VERSION}
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ItemMasterProvider>
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
                {(props) => <Login {...props} />}
              </Stack.Screen>

              <Stack.Screen name="dashboard">
                {(props) => <Dashboard {...props} />}
              </Stack.Screen>

              {/* + TRANSFER ORDER */}
              <Stack.Screen name="transfer_order" component={Transfer_Order} />
              <Stack.Screen
                name="production_supply"
                component={Production_Supply}
              />
              <Stack.Screen name="add_lpn" component={Add_LPN} />
              <Stack.Screen
                name="stock_transport"
                component={Stock_Transport}
              />
              <Stack.Screen name="receive_sto" component={Receive_STO} />
              <Stack.Screen name="create_sto" component={Create_STO} />
              <Stack.Screen name="edit_sto" component={Edit_STO} />
              <Stack.Screen name="view_to_report" component={View_TO_Report} />
              {/* - TRANSFER ORDER */}

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
              <Stack.Screen
                name="whse_management"
                component={Whse_Management}
              />
              <Stack.Screen name="bin_lookup" component={Bin_Lookup} />
              <Stack.Screen name="bulk_transfer" component={Bulk_Transfer} />
              <Stack.Screen name="finish_goods" component={Finish_Goods} />
              <Stack.Screen name="production" component={Production} />
              <Stack.Screen
                name="receive_material"
                component={Receive_Material}
              />
              <Stack.Screen
                name="dispatch_material"
                component={Dispatch_Material}
              />
              <Stack.Screen
                name="mach_management"
                component={Mach_Management}
              />
              <Stack.Screen
                name="downtime_report"
                component={Downtime_Report}
              />
              <Stack.Screen
                name="create_downtime"
                component={Create_Downtime}
              />
              <Stack.Screen name="edit_downtime" component={Edit_Downtime} />
              <Stack.Screen name="add_report" component={Add_Report} />
              <Stack.Screen name="edit_report" component={Edit_Report} />
              <Stack.Screen
                name="fg_registration"
                component={FG_Registration}
              />
              <Stack.Screen
                name="registration_database"
                component={Registration_Database}
              />
              <Stack.Screen
                name="fg_registration_input"
                component={FG_Registration_Input}
              />
              <Stack.Screen name="user_direct" component={User_Direct} />
              <Stack.Screen name="lpn_transfer" component={LPN_Transfer} />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </ItemMasterProvider>
    </SafeAreaProvider>
  );
}
