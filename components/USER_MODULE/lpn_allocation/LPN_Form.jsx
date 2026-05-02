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
import { ChevronLeft, QrCode, Barcode, PlusCircle } from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, setDoc } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";

const LPN_Form = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [loading, set_loading] = useState(false);
  const [scanned_value, set_scanned_value] = useState("");

  // FORM STATES
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [current_lpn_id, set_current_lpn_id] = useState("");

  // INPUT FIELDS
  const [item_code_input, set_item_code_input] = useState("");
  const [qty_input, set_qty_input] = useState("1");
  const [uom_base, set_uom_base] = useState("");
  const [qty_in_kg, set_qty_in_kg] = useState("0"); // BAGONG FIELD
  const [warehouse_code, set_warehouse_code] = useState("");
  const [sbin_code, set_sbin_code] = useState("");

  // AUTO-FOCUS PARA SA EXTERNAL SCANNER
  useEffect(() => {
    const focus_interval = setInterval(() => {
      if (!is_modal_visible) {
        scanner_input_ref.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focus_interval);
  }, [is_modal_visible]);

  const handle_qr_scan = (qr_text) => {
    if (!qr_text) return;
    const clean_id = qr_text.trim();
    // VALIDATION: Check if length is at least 14 characters
    if (clean_id.length < 14) {
      Vibration.vibrate([100, 50, 100]); // Error vibration pattern
      Alert.alert(
        "Invalid LPN",
        "The LPN ID must be at least 14 characters long.",
      );
      set_scanned_value("");
      return;
    }
    Vibration.vibrate(50);
    set_current_lpn_id(clean_id);
    set_is_modal_visible(true);
    set_scanned_value("");
  };

  const handle_save_lpn = async () => {
    // Kasama na sa validation ang qty_in_kg
    if (
      !item_code_input ||
      !sbin_code ||
      !uom_base ||
      !warehouse_code ||
      !qty_input ||
      !qty_in_kg
    ) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    set_loading(true);
    const timestamp = format_date(get_date_now());

    try {
      const new_lpn_entry = {
        batch_code: "",
        created_by: String(user_data?.username || "DEV-001"),
        creation_date: String(timestamp),
        expiry_date: "",
        gr_number: "",
        item_code: String(item_code_input).toUpperCase(),
        lpn_id: String(current_lpn_id),
        lpn_status: "Available",
        mfg_date: "",
        plant_code: "PL01",
        po_number: "",
        qty_base: Number(qty_input),
        qty_in_kg: Number(qty_in_kg), // NA-SAVE NA DITO
        sbin_code: String(sbin_code).toUpperCase(),
        sloc_code: "",
        stype_code: "BULK",
        uom_base: String(uom_base).toUpperCase(),
        uom_display: String(uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code).toUpperCase(),
      };

      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        current_lpn_id,
      );
      await setDoc(doc_ref, new_lpn_entry);

      Vibration.vibrate(70);
      set_is_modal_visible(false);

      Alert.alert("Success", "LPN successfully registered.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to register LPN.");
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

      {/* <TextInput
        ref={scanner_input_ref}
        value={scanned_value}
        onChangeText={(text) => {
          set_scanned_value(text);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => text && handle_qr_scan(text),
            700,
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
            handle_qr_scan(code);
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
            Register New LPN
          </Text>
          <Text className="text-slate-500 text-xs">
            Ready to capture QR code data
          </Text>
        </View>
        <PlusCircle size={24} color="#10b981" />
      </View>

      {/* MAIN VIEW */}
      <View className="flex-1 justify-center items-center px-10 bg-slate-50">
        <View className="bg-emerald-100 border-2 border-emerald-500 p-10 rounded-full shadow-sm mb-6">
          <Barcode size={100} color="#10b981" />
        </View>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-2xl text-slate-900"
        >
          READY TO SCAN
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-500 text-center mt-2 leading-5"
        >
          Please point your handheld scanner at the LPN QR code to proceed.
        </Text>
      </View>

      {/* INPUT MODAL */}
      <Modal visible={is_modal_visible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-[40px] p-8">
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center mb-6">
                  <View className="w-12 h-1 bg-slate-200 rounded-full mb-4" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-2xl text-slate-900"
                  >
                    LPN Details
                  </Text>
                  <Text className="text-emerald-600 text-xs font-bold mt-1 uppercase tracking-widest">
                    ID: {current_lpn_id}
                  </Text>
                </View>

                {/* ROW 1: ITEM CODE ONLY */}
                <View className="mb-4">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1">
                    ITEM CODE
                  </Text>
                  <TextInput
                    className="bg-slate-100 p-4 rounded-xl font-bold text-slate-900"
                    value={item_code_input}
                    onChangeText={set_item_code_input}
                    placeholder="e.g. ITEM-001"
                    autoCapitalize="characters"
                  />
                </View>

                {/* ROW 2: QTY, UOM, QTY IN KG */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-400 mb-1">
                      QTY
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      className="bg-slate-100 p-4 rounded-xl font-bold"
                      value={qty_input}
                      onChangeText={set_qty_input}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-400 mb-1">
                      UOM
                    </Text>
                    <TextInput
                      className="bg-slate-100 p-4 rounded-xl font-bold"
                      value={uom_base}
                      onChangeText={set_uom_base}
                      autoCapitalize="characters"
                      placeholder="e.g. PCS"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-400 mb-1">
                      QTY IN KG
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      className="bg-slate-100 p-4 rounded-xl font-bold"
                      value={qty_in_kg}
                      onChangeText={set_qty_in_kg}
                    />
                  </View>
                </View>

                {/* ROW 3: WAREHOUSE CODE and STORAGE BIN CODE */}
                <View className="flex-row gap-3 mb-8">
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-400 mb-1">
                      WAREHOUSE CODE
                    </Text>
                    <TextInput
                      className="bg-slate-100 p-4 rounded-xl font-bold"
                      value={warehouse_code}
                      onChangeText={set_warehouse_code}
                      placeholder="e.g. F-WH02"
                      autoCapitalize="characters"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-400 mb-1">
                      STORAGE BIN CODE
                    </Text>
                    <TextInput
                      className="bg-slate-100 p-4 rounded-xl font-bold"
                      value={sbin_code}
                      onChangeText={set_sbin_code}
                      placeholder="e.g. A-01-01"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handle_save_lpn}
                  activeOpacity={0.8}
                  className="bg-emerald-600 py-5 rounded-2xl items-center shadow-lg"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white text-lg"
                  >
                    Confirm & Save LPN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => set_is_modal_visible(false)}
                  className="mt-4 py-2 items-center mb-6"
                >
                  <Text className="text-slate-400 font-bold">Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default LPN_Form;
