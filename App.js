import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "./global.css";
import * as Font from "expo-font";
import Login from "./components/AUTHENTICATION/Login";
import Welcome from "./components/TDS/welcome/Welcome";
import MCP_Selection from "./components/TDS/mcp_selection/MCP_Selection";
import Store_Capture from "./components/TDS/store_capture/Store_Capture";
import Camera_Overlay from "./components/TDS/store_capture/Camera_Overlay";
import Main from "./components/TDS/main/Main";
import OSA from "./components/TDS/main/osa/OSA";
import Box_Counter from "./components/TDS/box_counter/Box_Counter";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const app_version = "v 1.0.0";

  useEffect(() => {
    async function loadFonts() {
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
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  const [selected_store_data, set_selected_store_data] = useState({});
  const [captured_store_image, set_captured_store_image] = useState(null);

  // + MCP List
  const [mcp_list, set_mcp_list] = useState([
    {
      id: 1,
      store_code: "STR-00001",
      store_desc: "FISHERMALL SUPERMARKET - DAGAT-DAGATAN AVE. MALABON",
      plan_visit: "01-14-2026",
      actual_visit: "MM-DD-YYYY",
      osa_status: true,
      md_status: true,
      ep_status: true,
      ta_status: true,
    },
    {
      id: 2,
      store_code: "STR-00002",
      store_desc: "MALABON CITISQUARE - DAGAT-DAGATAN AVE. MALABON",
      plan_visit: "01-14-2026",
      actual_visit: "",
      osa_status: true,
      md_status: true,
      ep_status: true,
      ta_status: false,
    },
    {
      id: 3,
      store_code: "STR-00003",
      store_desc: "SM GRAND CENTRAL - CALOOCAN MONUMENTO",
      plan_visit: "01-14-2026",
      actual_visit: "MM-DD-YYYY",
      osa_status: false,
      md_status: false,
      ep_status: false,
      ta_status: false,
    },
  ]);
  // - MCP List

  // + OSA Data
  const brand_list = [
    { id: 0, brand_code: "", brand_desc: "All Brands" },
    { id: 1, brand_code: "B-001", brand_desc: "Brand Data A" },
    { id: 2, brand_code: "B-002", brand_desc: "Brand Data B" },
    { id: 3, brand_code: "B-003", brand_desc: "Brand Data C" },
    { id: 4, brand_code: "B-004", brand_desc: "Brand Data D" },
    { id: 5, brand_code: "B-005", brand_desc: "Brand Data E" },
    { id: 6, brand_code: "B-006", brand_desc: "Brand Data F" },
    { id: 7, brand_code: "B-007", brand_desc: "Brand Data G" },
    { id: 8, brand_code: "B-008", brand_desc: "Brand Data H" },
    { id: 9, brand_code: "B-009", brand_desc: "Brand Data I" },
    { id: 10, brand_code: "B-010", brand_desc: "Brand Data J" },
  ];
  const category_list = [
    { id: 0, category_code: "", category_desc: "All Categories" },
    { id: 1, category_code: "C-001", category_desc: "Categogry Data A" },
    { id: 2, category_code: "C-002", category_desc: "Categogry Data B" },
    { id: 3, category_code: "C-003", category_desc: "Categogry Data C" },
    { id: 4, category_code: "C-004", category_desc: "Categogry Data D" },
    { id: 5, category_code: "C-005", category_desc: "Categogry Data E" },
    { id: 6, category_code: "C-006", category_desc: "Categogry Data F" },
  ];
  const brand_h_list = [
    { id: 1, brand_code: "B-001", category_code: "C-001" },
    { id: 2, brand_code: "B-001", category_code: "C-002" },
    { id: 3, brand_code: "B-001", category_code: "C-003" },
    { id: 4, brand_code: "B-002", category_code: "C-004" },
    { id: 5, brand_code: "B-003", category_code: "C-005" },
    { id: 6, brand_code: "B-003", category_code: "C-006" },
  ];
  // - OSA Data
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView className="flex-1" edges={["bottom"]}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          >
            <Stack.Screen
              name="Login"
              children={() => <Login app_version={app_version} />}
            />
            <Stack.Screen
              name="Welcome"
              children={() => <Welcome app_version={app_version} />}
            />
            <Stack.Screen
              name="MCP Selection"
              children={() => (
                <MCP_Selection
                  app_version={app_version}
                  mcp_list={mcp_list}
                  set_selected_store_data={set_selected_store_data}
                  set_captured_store_image={set_captured_store_image}
                />
              )}
            />
            <Stack.Screen
              name="Store Capture"
              children={() => (
                <Store_Capture
                  selected_store_data={selected_store_data}
                  captured_store_image={captured_store_image}
                />
              )}
            />
            <Stack.Screen
              name="Capture Image"
              children={() => (
                <Camera_Overlay
                  selected_store_data={selected_store_data}
                  set_captured_store_image={set_captured_store_image}
                />
              )}
            />

            <Stack.Screen
              name="Main"
              children={() => (
                <Main
                  app_version={app_version}
                  selected_store_data={selected_store_data}
                />
              )}
            />
            <Stack.Screen
              name="On-Shelf Availability"
              children={() => (
                <OSA
                  app_version={app_version}
                  mcp_list={mcp_list}
                  set_selected_store_data={set_selected_store_data}
                  set_captured_store_image={set_captured_store_image}
                  brand_list={brand_list}
                  category_list={category_list}
                  brand_h_list={brand_h_list}
                />
              )}
            />
            {/* <Stack.Screen name="Box Counter" children={() => <Box_Counter />} /> */}
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
