import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  Warehouse,
  MapPin,
  Layers,
  RefreshCcw,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc } from "firebase/firestore";

const LPN_Update = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);
  const isFocused = useIsFocused();

  const [loading, set_loading] = useState(false);

  // DATA STATES
  const [old_lpn_data, set_old_lpn_data] = useState(null);

  // CONTINUOUS AUTO-FOCUS MANAGEMENT FOR RF HANDHELD SCANNER
  useEffect(() => {
    let focus_interval = null;
    let delay_timeout = null;

    if (isFocused) {
      delay_timeout = setTimeout(() => {
        scanner_input_ref.current?.focus();

        focus_interval = setInterval(() => {
          scanner_input_ref.current?.focus();
        }, 1000);
      }, 300);
    }

    return () => {
      if (delay_timeout) clearTimeout(delay_timeout);
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused]);

  const handle_scan = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;

    if (clean_id.length < 14 || !clean_id.includes("-")) {
      Vibration.vibrate([100, 50, 100]);

      let error_message = "The LPN ID must be at least 14 characters long.";
      if (!clean_id.includes("-")) {
        error_message = "Invalid format: LPN ID must contain a dash.";
      }

      Alert.alert("Invalid LPN", error_message);
      return;
    }

    Vibration.vibrate(50);
    set_loading(true);

    try {
      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        clean_id,
      );
      const doc_snap = await getDoc(doc_ref);

      if (doc_snap.exists()) {
        const data = doc_snap.data();
        set_old_lpn_data(data);
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `LPN ID: ${clean_id} is not registered in the system.`,
        );
      }
    } catch (e) {
      console.error("Fetch LPN Error: ", e);
      Alert.alert("Error", "Failed to fetch LPN details. Please try again.");
    } finally {
      set_loading(false);
    }
  };

  const handle_proceed_to_update = () => {
    if (!old_lpn_data) return;

    navigation.navigate("lpn_update_input", {
      old_lpn_data: old_lpn_data,
      user_data: user_data,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      {/* INVISIBLE TEXT INPUT FOR CONTINUOUS RF GUN TRIGGER */}
      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_scan(code);
            scanner_input_ref.current?.clear();
          }
        }}
        blurOnSubmit={false}
        autoFocus={true}
      />

      {/* HEADER */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Update LPN
          </Text>
          <Text className="text-slate-500 text-xs">
            {old_lpn_data
              ? "Review or hot-scan another code anytime"
              : "Scan the LPN barcode or QR code"}
          </Text>
        </View>
        <RefreshCcw size={24} color="#f97316" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50">
        {!old_lpn_data ? (
          /* INITIAL STATE: EMPTY SCAN PROMPT */
          <View className="flex-1 justify-center items-center px-10">
            <View className="bg-orange-100 border-2 border-orange-500 p-10 rounded-full shadow-sm mb-6">
              <Barcode size={100} color="#f97316" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900"
            >
              SCAN LPN TO UPDATE
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mt-2 leading-5"
            >
              Please point your handheld scanner at the LPN code to retrieve its
              current records.
            </Text>
          </View>
        ) : (
          /* SUMMARY STATE */
          <ScrollView className="flex-1 py-6 shadow-sm">
            <View className="mx-6 mb-4 bg-orange-50 border border-orange-100 p-3 rounded-xl">
              <Text className="text-orange-700 text-xs text-center font-bold">
                You are about to change the details in this LPN.
              </Text>
            </View>

            {/* SUMMARY CARD FOR FOUND LPN */}
            <View className="bg-white mx-6 mb-6 p-4 rounded-2xl border border-slate-300">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-2">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-[10px] uppercase tracking-wider"
                  >
                    LPN: {old_lpn_data?.lpn_id}
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-lg text-slate-900"
                  >
                    {old_lpn_data?.item_code}
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-[10px] font-bold uppercase">
                    {old_lpn_data?.lpn_status || "AVAILABLE"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-1 space-x-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
                    <Warehouse size={12} color="#475569" />
                  </View>
                  <View>
                    <Text className="text-[9px] text-slate-400 font-bold uppercase">
                      Warehouse
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-slate-700 text-xs"
                    >
                      {old_lpn_data?.warehouse_code}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center flex-1">
                  <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
                    <MapPin size={12} color="#475569" />
                  </View>
                  <View>
                    <Text className="text-[9px] text-slate-400 font-bold uppercase">
                      Bin Code
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-slate-700 text-xs"
                    >
                      {old_lpn_data?.sbin_code}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="border-t border-slate-50 pt-3 mt-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Layers size={14} color="#64748b" />
                    <Text className="text-slate-500 text-xs ml-1 font-medium">
                      Total Quantity:
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-900 text-xs"
                  >
                    {old_lpn_data?.qty_base} {old_lpn_data?.uom_base}
                  </Text>
                </View>

                {old_lpn_data?.qty_in_kg > 0 && (
                  <View className="flex-row justify-between items-center mt-2">
                    <View className="flex-row items-center">
                      <View className="w-[14px] items-center">
                        <Text className="text-[10px]">⚖️</Text>
                      </View>
                      <Text className="text-slate-500 text-xs ml-1 font-medium">
                        Weight (KG):
                      </Text>
                    </View>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-900 text-xs"
                    >
                      {old_lpn_data?.qty_in_kg} KG
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ACTION BUTTONS AREA */}
            <View className="px-6 space-y-3">
              {/* PROCEED TO UPDATE BUTTON */}
              <TouchableOpacity
                onPress={handle_proceed_to_update}
                activeOpacity={0.8}
                className="bg-orange-500 py-4 rounded-2xl items-center shadow-md flex-row justify-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-base"
                >
                  Update Information
                </Text>
              </TouchableOpacity>

              {/* DYNAMIC RESET / SCAN ANOTHER LPN BUTTON */}
              <TouchableOpacity
                onPress={() => {
                  set_old_lpn_data(null); // Babalik sa default state layout na walang records
                  Vibration.vibrate(30);
                }}
                activeOpacity={0.7}
                className="bg-white border border-slate-200 py-4 rounded-2xl items-center flex-row justify-center space-x-2 mt-5"
              >
                <Barcode size={20} color="#64748b" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="ml-1 text-slate-500"
                >
                  Scan Another LPN
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LPN_Update;
