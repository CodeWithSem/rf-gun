import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";

// Import your custom CSS for NativeWind
import "./global.css";

// Components
import Login from "./components/AUTHENTICATION/Login";
import Register from "./components/AUTHENTICATION/Register";
import Dashboard from "./components/USER_MODULE/dashboard/Dashboard";
import MCP_Selection from "./components/USER_MODULE/mcp_selection/MCP_Selection";
import Capture_Store_Image from "./components/USER_MODULE/capture_store_image/Capture_Store_Image";
import Main from "./components/USER_MODULE/main/Main";
import Inventory_Stock from "./components/USER_MODULE/main/inventory_stock/Inventory_Stock";
import Stock_Audit from "./components/USER_MODULE/main/inventory_stock/components/Stock_Audit";
import OSA from "./components/USER_MODULE/main/inventory_stock/components/OSA";
import Expiry_Tracking from "./components/USER_MODULE/main/inventory_stock/components/Expiry_Tracking";
import Returns from "./components/USER_MODULE/main/inventory_stock/components/Returns";
import Share_Of_Shelf from "./components/USER_MODULE/main/share_of_shelf/Share_Of_Shelf";
import Linear_Meter from "./components/USER_MODULE/main/share_of_shelf/components/Linear_Meter";
import SOS_Percent from "./components/USER_MODULE/main/share_of_shelf/components/SOS_Percent";
import Competitor_Track from "./components/USER_MODULE/main/share_of_shelf/components/Competitor_Track";
import Planogram_Comp from "./components/USER_MODULE/main/share_of_shelf/components/Planogram_Comp";
import Planogram_Select from "./components/USER_MODULE/main/share_of_shelf/components/Planogram_Select";
import Pricing_Promo from "./components/USER_MODULE/main/pricing_promo/Pricing_Promo";
import Price_Audit from "./components/USER_MODULE/main/pricing_promo/components/Price_Audit";
import Promo_Comp from "./components/USER_MODULE/main/pricing_promo/components/Promo_Comp";
import Activation_Check from "./components/USER_MODULE/main/pricing_promo/components/Activation_Check";
import POSM_Audit from "./components/USER_MODULE/main/pricing_promo/components/POSM_Audit";
import Ordering from "./components/USER_MODULE/main/ordering/Ordering";
import Suggested_Order from "./components/USER_MODULE/main/ordering/components/Suggested_Order";
import Delivery_Track from "./components/USER_MODULE/main/ordering/components/Delivery_Track";
import Gap_Analysis from "./components/USER_MODULE/main/ordering/components/Gap_Analysis";
import Store_Insights from "./components/USER_MODULE/main/store_insights/Store_Insights";
import Person_Feedback from "./components/USER_MODULE/main/store_insights/components/Person_Feedback";
import SOS_Survey from "./components/USER_MODULE/main/store_insights/components/SOS_Survey";
import Incident_Report from "./components/USER_MODULE/main/store_insights/components/Incident_Report";
import Store_Selection from "./components/USER_MODULE/store_selection/Store_Selection";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const app_version = "v 1.0.0";

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

  if (!fontsLoaded) return null;

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
            {/* Login Screen */}
            <Stack.Screen name="Login">
              {(props) => <Login {...props} app_version={app_version} />}
            </Stack.Screen>

            {/* Register Screen */}
            <Stack.Screen name="Register" component={Register} />

            {/* Dashboard Screen */}
            <Stack.Screen name="Dashboard" component={Dashboard} />
            {/* MCP Selection Screen */}
            <Stack.Screen name="MCPSelection" component={MCP_Selection} />
            {/* Store Selection Screen */}
            <Stack.Screen name="StoreSelection" component={Store_Selection} />
            <Stack.Screen
              name="CaptureStoreImage"
              component={Capture_Store_Image}
            />
            {/* Main Page */}
            <Stack.Screen name="Main" component={Main} />
            {/* Inventory & Stock */}
            <Stack.Screen name="InventoryStock" component={Inventory_Stock} />
            <Stack.Screen name="StockAudit" component={Stock_Audit} />
            <Stack.Screen name="OSA" component={OSA} />
            <Stack.Screen name="ExpiryTracking" component={Expiry_Tracking} />
            <Stack.Screen name="Returns" component={Returns} />
            {/* Share of Shelf */}
            <Stack.Screen name="SOS" component={Share_Of_Shelf} />
            <Stack.Screen name="LinearMeter" component={Linear_Meter} />
            <Stack.Screen name="SOSPercent" component={SOS_Percent} />
            <Stack.Screen name="CompetitorTrack" component={Competitor_Track} />
            <Stack.Screen name="PlanogramComp" component={Planogram_Comp} />
            <Stack.Screen name="PlanogramSelect" component={Planogram_Select} />
            {/* Pricing & Promos */}
            <Stack.Screen name="PricingPromo" component={Pricing_Promo} />
            <Stack.Screen name="PriceAudit" component={Price_Audit} />
            <Stack.Screen name="PromoComp" component={Promo_Comp} />
            <Stack.Screen name="ActivationCheck" component={Activation_Check} />
            <Stack.Screen name="POSMAudit" component={POSM_Audit} />
            {/* Ordering */}
            <Stack.Screen name="Ordering" component={Ordering} />
            <Stack.Screen name="SuggestedOrder" component={Suggested_Order} />
            <Stack.Screen name="DeliveryTrack" component={Delivery_Track} />
            <Stack.Screen name="GapAnalysis" component={Gap_Analysis} />
            {/* Store Insights */}
            <Stack.Screen name="StoreInsights" component={Store_Insights} />
            <Stack.Screen name="PersonFeedback" component={Person_Feedback} />
            <Stack.Screen name="SOSSurvey" component={SOS_Survey} />
            <Stack.Screen name="IncidentReport" component={Incident_Report} />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
