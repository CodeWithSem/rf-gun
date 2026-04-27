import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  QrCode,
  ArrowRight,
  Barcode,
  Warehouse,
  MapPin,
  Layers,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";

const LPN_Update = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [loading, set_loading] = useState(false);
  const [scanned_value, set_scanned_value] = useState("");

  // UI CONTROL
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [step, set_step] = useState(1); // 1: Scan Old, 2: Info & Ready for New Scan

  // DATA STATES
  const [old_lpn_data, set_old_lpn_data] = useState(null);
  const [new_lpn_id, set_new_lpn_id] = useState("");

  // FORM FIELDS (For Modal Editing)
  const [item_code, set_item_code] = useState("");
  const [qty, set_qty] = useState("");
  const [uom, set_uom] = useState("");
  const [qty_kg, set_qty_kg] = useState("");
  const [wh_code, set_wh_code] = useState("");
  const [bin_code, set_bin_code] = useState("");

  useEffect(() => {
    const focus_interval = setInterval(() => {
      if (!is_modal_visible) {
        scanner_input_ref.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focus_interval);
  }, [is_modal_visible]);

  const handle_scan = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;
    set_scanned_value("");
    Vibration.vibrate(50);

    if (step === 1) {
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
          // Pre-fill fields para sa modal review later
          set_item_code(data.item_code);
          set_qty(String(data.qty_base));
          set_uom(data.uom_base);
          set_qty_kg(String(data.qty_in_kg || 0));
          set_wh_code(data.warehouse_code);
          set_bin_code(data.sbin_code);
          set_step(2);
        } else {
          Alert.alert("Not Found", "This LPN is not registered.");
        }
      } catch (e) {
        Alert.alert("Error", "Failed to fetch LPN.");
      } finally {
        set_loading(false);
      }
    } else {
      set_new_lpn_id(clean_id);
      set_is_modal_visible(true);
    }
  };

  const handle_confirm_replacement = async () => {
    if (!new_lpn_id) return;
    set_loading(true);
    const batch = writeBatch(firestore_db);
    const timestamp = format_date(get_date_now());

    try {
      const history_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_HISTORY",
        "DATA",
        old_lpn_data.lpn_id,
      );
      const old_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        old_lpn_data.lpn_id,
      );
      const new_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        new_lpn_id,
      );

      const updated_entry = {
        ...old_lpn_data,
        lpn_id: new_lpn_id,
        item_code: item_code.toUpperCase(),
        qty_base: Number(qty),
        qty_in_kg: Number(qty_kg),
        uom_base: uom.toUpperCase(),
        warehouse_code: wh_code.toUpperCase(),
        sbin_code: bin_code.toUpperCase(),
        updated_by: user_data?.username || "DEV-001",
        update_date: timestamp,
      };

      batch.set(history_ref, {
        ...old_lpn_data,
        replacement_date: timestamp,
        replaced_by_lpn: new_lpn_id,
      });
      batch.delete(old_ref);
      batch.set(new_ref, updated_entry);

      await batch.commit();
      set_is_modal_visible(false);
      Alert.alert("Success", "LPN Replaced Successfully", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Update Failed", e.message);
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

      <TextInput
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
            {step === 1
              ? "Identify the LPN to be replaced"
              : "Ready for new sticker"}
          </Text>
        </View>
        <QrCode size={24} color={step === 1 ? "#0284c7" : "#f97316"} />
      </View>

      <View className="flex-1 bg-slate-50">
        {step === 1 ? (
          <View className="flex-1 justify-center items-center px-10">
            <View className="bg-white p-10 rounded-full shadow-sm mb-6">
              <Barcode size={100} color="#0284c7" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900"
            >
              SCAN CURRENT LPN
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mt-2"
            >
              Identify the current LPN in the bin before assigning a new code.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 py-6">
            {/* SUMMARY CARD (GINAYA SA BINIGAY MONG FORMAT) */}
            <View className="bg-white mx-6 mb-6 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <View>
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
                    {old_lpn_data?.lpn_status || "ACTIVE"}
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
                      className="text-sky-700 text-xs"
                    >
                      {old_lpn_data?.qty_in_kg} KG
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ACTION FOOTER */}
            <View className="px-10 items-center">
              <View className="bg-orange-50 p-4 rounded-full mb-4">
                <Barcode size={40} color="#f97316" />
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-lg text-slate-900"
              >
                READY TO REPLACE
              </Text>
              <Text className="text-slate-400 text-center text-xs mt-1 mb-8">
                Scan the new LPN sticker now to transfer these details.
              </Text>

              <TouchableOpacity
                onPress={() => set_step(1)}
                className="py-3 px-8 rounded-xl border border-slate-200 bg-white"
              >
                <Text className="text-slate-500 font-bold">
                  Cancel / Wrong LPN
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* MODAL PARA SA FINAL REVIEW & EDIT */}
      <Modal visible={is_modal_visible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-[40px] p-8 max-h-[90%]">
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center mb-6">
                  <View className="w-12 h-1 bg-slate-200 rounded-full mb-4" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-2xl text-slate-900"
                  >
                    Confirm Transfer
                  </Text>

                  <View className="flex-row items-center mt-4 bg-slate-50 py-3 px-4 rounded-2xl border border-slate-100 gap-2">
                    <Text className="text-slate-400 font-bold text-[11px] tracking-[1px]">
                      {old_lpn_data?.lpn_id}
                    </Text>
                    <ArrowRight size={12} color="#94a3b8" className="mx-2" />
                    <Text className="text-orange-600 font-bold text-[11px] tracking-[1px]">
                      {new_lpn_id}
                    </Text>
                  </View>
                </View>

                {/* EDITABLE FIELDS */}
                <View className="space-y-4">
                  {/* ITEM CODE - FULL WIDTH */}
                  <View className="mb-4">
                    <Text className="text-[10px] font-bold text-slate-400 mb-1">
                      ITEM CODE
                    </Text>
                    <TextInput
                      className="bg-slate-100 p-4 rounded-xl font-bold text-slate-900"
                      value={item_code}
                      onChangeText={set_item_code}
                      autoCapitalize="characters"
                    />
                  </View>

                  {/* QUANTITY, UOM, AND KG - THREE COLUMN ROW */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1">
                        QTY
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        className="bg-slate-100 p-4 rounded-xl font-bold text-slate-900"
                        value={qty}
                        onChangeText={set_qty}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1">
                        UOM
                      </Text>
                      <TextInput
                        className="bg-slate-100 p-4 rounded-xl font-bold text-slate-900"
                        value={uom}
                        onChangeText={set_uom}
                        autoCapitalize="characters"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-slate-400 mb-1">
                        WEIGHT (KG)
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        className="bg-slate-100 p-4 rounded-xl font-bold text-slate-900"
                        value={qty_kg}
                        onChangeText={set_qty_kg}
                        placeholder="0"
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handle_confirm_replacement}
                  activeOpacity={0.8}
                  className="bg-orange-500 py-5 rounded-2xl items-center shadow-lg mt-8"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white text-lg"
                  >
                    Replace LPN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => set_is_modal_visible(false)}
                  className="mt-4 py-2 items-center mb-6"
                >
                  <Text className="text-slate-400 font-bold">
                    Back to Scanner
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default LPN_Update;
