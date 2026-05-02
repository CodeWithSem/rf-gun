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
  Search,
  Barcode,
  Warehouse,
  MapPin,
  Layers,
  History,
  Info,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc } from "firebase/firestore";

const LPN_Search = ({ navigation }) => {
  const scanner_input_ref = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [loading, set_loading] = useState(false);
  const [scanned_value, set_scanned_value] = useState("");
  const [lpn_data, set_lpn_data] = useState(null);
  const [has_searched, set_has_searched] = useState(false);

  // Auto-focus logic para sa physical scanner
  useEffect(() => {
    const focus_interval = setInterval(() => {
      scanner_input_ref.current?.focus();
    }, 1000);
    return () => clearInterval(focus_interval);
  }, []);

  const handle_search = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;

    set_scanned_value("");
    set_loading(true);
    set_has_searched(true);
    Vibration.vibrate(50);

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
        set_lpn_data(doc_snap.data());
      } else {
        set_lpn_data(null);
        Alert.alert(
          "Not Found",
          `LPN ${clean_id} does not exist in the records.`,
        );
      }
    } catch (e) {
      Alert.alert("Error", "Failed to fetch LPN information.");
    } finally {
      set_loading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      {/* HIDDEN SCANNER INPUT */}
      {/* <TextInput
        ref={scanner_input_ref}
        value={scanned_value}
        onChangeText={(text) => {
          set_scanned_value(text);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => text && handle_search(text),
            300,
          );
        }}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0 }}
      /> */}

      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_search(code);
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
            Search LPN
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan any sticker to view details
          </Text>
        </View>
        <Search size={24} color="#0284c7" />
      </View>

      <View className="flex-1 bg-slate-50">
        {!lpn_data ? (
          /* EMPTY STATE / WAITING FOR SCAN */
          <View className="flex-1 justify-center items-center px-10">
            <View className="bg-sky-100 border-2 border-sky-500 p-10 rounded-full shadow-sm mb-6">
              <Barcode size={100} color="#0284c7" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xl text-slate-900"
            >
              READY TO SCAN
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-center mt-2"
            >
              Please point your scanner at the LPN barcode to retrieve current
              inventory data.
            </Text>
          </View>
        ) : (
          /* LPN INFO DISPLAY */
          <ScrollView
            className="flex-1 py-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white mx-6 p-6 rounded-[30px] border border-slate-100 shadow-sm">
              {/* TOP SECTION: ID & STATUS */}
              <View className="flex-row justify-between items-start mb-6">
                <View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-xs uppercase tracking-[1px] mb-1"
                  >
                    LPN ID: {lpn_data.lpn_id}
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-2xl text-slate-900"
                  >
                    {lpn_data.item_code}
                  </Text>
                </View>
                <View className="bg-green-100 px-4 py-1.5 rounded-full">
                  <Text className="text-green-700 text-[10px] font-bold uppercase tracking-wider">
                    {lpn_data.lpn_status || "ACTIVE"}
                  </Text>
                </View>
              </View>

              {/* LOCATION GRID */}
              <View className="flex-row gap-4 mb-6">
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Warehouse size={18} color="#0284c7" className="mb-2" />
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                    Warehouse
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-900 text-sm"
                  >
                    {lpn_data.warehouse_code}
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <MapPin size={18} color="#f59e0b" className="mb-2" />
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                    Bin Location
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-900 text-sm"
                  >
                    {lpn_data.sbin_code}
                  </Text>
                </View>
              </View>

              {/* QUANTITY SECTION */}
              <View className="space-y-3 border-t border-slate-50 pt-5">
                <View className="flex-row justify-between items-center bg-slate-50/50 p-3 rounded-xl">
                  <View className="flex-row items-center">
                    <Layers size={18} color="#64748b" />
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-slate-600 ml-2"
                    >
                      Stock Quantity
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-lg text-slate-900"
                  >
                    {lpn_data.qty_base}{" "}
                    <Text className="text-xs text-slate-400">
                      {lpn_data.uom_base}
                    </Text>
                  </Text>
                </View>

                {lpn_data.qty_in_kg > 0 && (
                  <View className="flex-row justify-between items-center bg-sky-50/50 p-3 rounded-xl">
                    <View className="flex-row items-center">
                      <Text className="text-lg">⚖️</Text>
                      <Text
                        style={{ fontFamily: "Outfit-Medium" }}
                        className="text-slate-600 ml-2"
                      >
                        Measured Weight
                      </Text>
                    </View>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-lg text-sky-700"
                    >
                      {lpn_data.qty_in_kg}{" "}
                      <Text className="text-xs text-sky-400">KG</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* FOOTER INFO */}
              <View className="mt-8 flex-row items-center justify-center space-x-2 opacity-50">
                <History size={14} color="#94a3b8" />
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-[10px] text-slate-400"
                >
                  Last Updated: {lpn_data.update_date || "N/A"}
                </Text>
              </View>
            </View>

            {/* QUICK SCAN BUTTON */}
            <View className="px-6 mt-6">
              <TouchableOpacity
                onPress={() => {
                  set_lpn_data(null);
                  set_has_searched(false);
                }}
                className="bg-white border border-slate-200 py-4 rounded-2xl items-center flex-row justify-center space-x-2"
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

export default LPN_Search;
