import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  Warehouse,
  MapPin,
  Layers,
  LogOut,
  PackageMinus,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";

const LPN_Out = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [loading, set_loading] = useState(false);
  const [scanned_value, set_scanned_value] = useState("");
  const [lpn_data, set_lpn_data] = useState(null);

  // Auto-focus para sa external scanner
  useEffect(() => {
    const focus_interval = setInterval(() => {
      scanner_input_ref.current?.focus();
    }, 1000);
    return () => clearInterval(focus_interval);
  }, []);

  const handle_scan = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;
    set_scanned_value("");
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
        set_lpn_data(doc_snap.data());
      } else {
        Alert.alert("Not Found", "This LPN is not in active inventory.");
        set_lpn_data(null);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to fetch LPN data.");
    } finally {
      set_loading(false);
    }
  };

  const handle_confirm_out = async () => {
    if (!lpn_data) return;

    Alert.alert(
      "Confirm Out",
      `Are you sure you want to remove LPN: ${lpn_data.lpn_id} from inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            set_loading(true);
            const batch = writeBatch(firestore_db);
            const timestamp = format_date(get_date_now());

            try {
              const active_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_INVENTORY_COUNT",
                "DATA",
                lpn_data.lpn_id,
              );
              const history_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_INVENTORY_HISTORY",
                "DATA",
                `${lpn_data.lpn_id}_OUT_${Date.now()}`, // Unique ID para sa history
              );

              // 1. Move to History
              batch.set(history_ref, {
                ...lpn_data,
                transaction_type: "OUT",
                out_by: user_data?.username || "DEV-001",
                out_date: timestamp,
              });

              // 2. Delete from Active
              batch.delete(active_ref);

              await batch.commit();

              Alert.alert("Success", "LPN successfully moved to history.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert("Process Failed", e.message);
            } finally {
              set_loading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      )}

      {/* Hidden input for scanner */}
      {/* <TextInput
        ref={scanner_input_ref}
        value={scanned_value}
        onChangeText={(text) => {
          set_scanned_value(text);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => text && handle_scan(text),
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
            LPN Out
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan LPN to remove from stock
          </Text>
        </View>
        <PackageMinus size={24} color="#ef4444" />
      </View>

      <View className="flex-1 bg-slate-50">
        {!lpn_data ? (
          <View className="flex-1 justify-center items-center px-10">
            <View className="bg-red-100 border-2 border-red-500 p-10 rounded-full shadow-sm mb-6">
              <Barcode size={100} color="#ef4444" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900"
            >
              READY TO SCAN
            </Text>
            <Text className="text-slate-500 text-center mt-2">
              Please scan the LPN sticker that will be dispatched or moved out.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 py-6">
            <View className="bg-white mx-6 p-6 rounded-2xl border border-slate-100 shadow-sm">
              <Text className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                LPN ID: {lpn_data.lpn_id}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-2xl text-slate-900 mb-4"
              >
                {lpn_data.item_code}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                  <View className="flex-row items-center">
                    <Warehouse size={16} color="#64748b" />
                    <Text className="text-slate-500 ml-2">Warehouse</Text>
                  </View>
                  <Text className="font-bold text-slate-800">
                    {lpn_data.warehouse_code}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#64748b" />
                    <Text className="text-slate-500 ml-2">Bin Location</Text>
                  </View>
                  <Text className="font-bold text-slate-800">
                    {lpn_data.sbin_code}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                  <View className="flex-row items-center">
                    <Layers size={16} color="#64748b" />
                    <Text className="text-slate-500 ml-2">Total Quantity</Text>
                  </View>
                  <Text className="font-bold text-slate-800">
                    {lpn_data.qty_base} {lpn_data.uom_base}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handle_confirm_out}
                className="bg-red-500 py-5 rounded-2xl items-center mt-8 shadow-lg"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg tracking-[1px]"
                >
                  Confirm OUT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => set_lpn_data(null)}
                className="mt-4 py-2 items-center"
              >
                <Text className="text-slate-400 font-bold">
                  Cancel / Scan Another
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LPN_Out;
