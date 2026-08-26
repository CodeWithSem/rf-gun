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
  Scan,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ChevronDown,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, setDoc } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";
import { use_item_master } from "@assets/scripts/functions/item_master_context";

// HARDCODED UOM OPTIONS
const UOM_OPTIONS = [
  "BUNDLE",
  "BOX",
  "CASE",
  "PACK",
  "PAD",
  "PCS",
  "ROLL",
  "SACK",
];

const LPN_Register_Input = ({ navigation, route }) => {
  const { current_lpn_id, user_data } = route.params || {};

  const { item_master_data, is_loading_items } = use_item_master();

  const bin_scanner_ref = useRef(null);
  const item_code_ref = useRef(null);

  const [loading, set_loading] = useState(false);

  // FORM FIELDS
  const [item_code_input, set_item_code_input] = useState("");
  const [qty_input, set_qty_input] = useState("1");
  const [uom_base, set_uom_base] = useState(""); // Dito mase-save ang napiling UOM
  const [qty_in_kg, set_qty_in_kg] = useState("0");
  const [warehouse_code, set_warehouse_code] = useState("");
  const [sbin_code, set_sbin_code] = useState("");

  // MODAL STATES
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [is_uom_modal_visible, set_is_uom_modal_visible] = useState(false); // BAGONG STATE PARA SA UOM MODAL
  const [temp_warehouse, set_temp_warehouse] = useState("");
  const [temp_sbin, set_temp_sbin] = useState("");

  // 1. AUTO-FOCUS SA ITEM CODE FIELD PAGKA-ENTER NG SCREEN
  useEffect(() => {
    const timer = setTimeout(() => {
      item_code_ref.current?.focus();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 2. INTERNALLY AUTO-FOCUS SA SCANNER INPUT KAPAG BUKAS ANG BIN MODAL
  useEffect(() => {
    let focus_interval;
    if (is_bin_modal_visible) {
      focus_interval = setInterval(() => {
        bin_scanner_ref.current?.focus();
      }, 800);
    }
    return () => clearInterval(focus_interval);
  }, [is_bin_modal_visible]);

  // STRING DIVISION PARSING (WH02_A-1-1)
  const handle_bin_scan = (scanned_string) => {
    if (!scanned_string) return;

    const clean_str = scanned_string.trim();

    if (!clean_str.includes("_")) {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert("Invalid Bin Format", "Scanned code must be registered.");
      return;
    }

    Vibration.vibrate(50);
    const parts = clean_str.split("_");
    const wh_part = parts[0].toUpperCase();
    const bin_part = parts[1].toUpperCase();

    set_temp_warehouse(wh_part);
    set_temp_sbin(bin_part);
  };

  const handle_confirm_bin = () => {
    if (!temp_warehouse || !temp_sbin) {
      Alert.alert("No Data", "Please scan a valid bin location first.");
      return;
    }
    set_warehouse_code(temp_warehouse);
    set_sbin_code(temp_sbin);
    set_is_bin_modal_visible(false);
    set_temp_warehouse("");
    set_temp_sbin("");
  };

  const handle_select_uom = (selected_uom) => {
    set_uom_base(selected_uom);
    set_is_uom_modal_visible(false);
    Vibration.vibrate(30);
  };

  const handle_save_lpn = async () => {
    if (
      !item_code_input ||
      !sbin_code ||
      !uom_base ||
      !warehouse_code ||
      !qty_input ||
      !qty_in_kg
    ) {
      Alert.alert(
        "Missing Info",
        "Please fill up all required fields and scan a storage bin.",
      );
      return;
    }

    set_loading(true);
    const timestamp = format_date(get_date_now());

    try {
      const new_lpn_entry = {
        batch_code: "",
        created_by: String(user_data?.username || "ADMIN"),
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
        qty_in_kg: Number(qty_in_kg),
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
      {/* HEADER */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            LPN Details
          </Text>
          <Text className="text-emerald-600 font-bold text-xs">
            ID: {current_lpn_id}
          </Text>
        </View>
      </View>
      {/* FORM BODY */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {/* ITEM CODE */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Item Code
            </Text>
            <TextInput
              ref={item_code_ref}
              className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-slate-900 text-base"
              value={item_code_input}
              onChangeText={set_item_code_input}
              autoCapitalize="characters"
              placeholder="Enter code"
            />
          </View>

          {/* QTY, UOM, QTY IN KG ROW */}
          <View className="flex-row gap-3 mb-6 items-end">
            {/* QUANTITY INPUT */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Qty
              </Text>
              <TextInput
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900"
                value={qty_input}
                onChangeText={set_qty_input}
                placeholder="0"
              />
            </View>

            {/* UOM SELECTION FIELD (TINANGGAL ANG STATIC HEIGHT, PINANTAY ANG PADDING) */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                UOM
              </Text>
              <TouchableOpacity
                onPress={() => set_is_uom_modal_visible(true)}
                activeOpacity={0.7}
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
              >
                <Text
                  className={`font-bold text-base ${uom_base ? "text-slate-900" : "text-slate-400"}`}
                >
                  {uom_base || ""}
                </Text>
                <ChevronDown size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* QTY IN KG INPUT */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Qty In Kg
              </Text>
              <TextInput
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900"
                value={qty_in_kg}
                onChangeText={set_qty_in_kg}
                placeholder="0"
              />
            </View>
          </View>

          {/* STORAGE METRICS SECTION */}
          <View className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xs text-slate-700 mb-3 uppercase tracking-wider"
            >
              Bin Location
            </Text>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-white border border-slate-200 rounded-xl p-3">
                <Text className="text-[9px] font-bold text-slate-500 mb-1">
                  WAREHOUSE
                </Text>
                <Text className="text-sm font-black text-slate-800">
                  {warehouse_code || "---"}
                </Text>
              </View>
              <View className="flex-1 bg-white border border-slate-200 rounded-xl p-3">
                <Text className="text-[9px] font-bold text-slate-500 mb-1">
                  STORAGE BIN
                </Text>
                <Text className="text-sm font-black text-slate-800">
                  {sbin_code || "---"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => set_is_bin_modal_visible(true)}
              className="bg-sky-600 py-4 rounded-xl flex-row justify-center items-center"
              activeOpacity={0.8}
            >
              <QrCode size={18} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white ml-2 text-sm"
              >
                Scan Bin Location
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUBMIT BUTTONS */}
          <TouchableOpacity
            onPress={handle_save_lpn}
            activeOpacity={0.8}
            className="bg-emerald-600 py-5 rounded-2xl items-center mb-4"
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white text-lg"
            >
              Confirm & Save LPN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-slate-100 py-5 rounded-2xl justify-center items-center"
          >
            <Text className="text-slate-500 font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* MODAL SCANNING WINDOW FOR BIN */}
      <Modal visible={is_bin_modal_visible} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <TextInput
            ref={bin_scanner_ref}
            showSoftInputOnFocus={false}
            style={{ opacity: 0, height: 0, position: "absolute" }}
            onSubmitEditing={(e) => {
              const code = e.nativeEvent.text;
              if (code) {
                handle_bin_scan(code);
                bin_scanner_ref.current?.clear();
              }
            }}
            blurOnSubmit={false}
          />

          <View className="bg-white w-full rounded-[30px] p-6 items-center max-w-sm">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xl text-slate-900 mb-1"
            >
              Scan Bin Location QR
            </Text>
            <Text className="text-slate-400 text-xs text-center mb-6 px-4">
              Aim your hardware scanner weapon at the Storage Bin label now.
            </Text>

            <View className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              {temp_warehouse && temp_sbin ? (
                <View className="items-center py-2">
                  <CheckCircle2 size={40} color="#10b981" />
                  <Text className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">
                    Detected Location
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-lg text-emerald-600 mt-4"
                  >
                    {temp_warehouse}
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-lg text-emerald-600"
                  >
                    {temp_sbin}
                  </Text>
                </View>
              ) : (
                <View className="items-center py-6">
                  <AlertCircle size={40} color="#94a3b8" />
                  <Text className="text-xs text-slate-400 font-bold tracking-wide mt-2">
                    SCAN BIN LOCATION...
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => {
                  set_is_bin_modal_visible(false);
                  set_temp_warehouse("");
                  set_temp_sbin("");
                }}
                className="flex-1 bg-slate-100 py-4 rounded-xl justify-center items-center"
              >
                <Text className="text-slate-500 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handle_confirm_bin}
                disabled={!temp_warehouse || !temp_sbin}
                style={{ opacity: temp_warehouse && temp_sbin ? 1 : 0.5 }}
                className="flex-1 bg-emerald-600 py-4 rounded-xl justify-center items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-sm"
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* MODERN COMPACT UOM SELECTION MODAL (3 OPTIONS PER ROW) */}
      <Modal visible={is_uom_modal_visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-6 shadow-2xl pb-8">
            {/* MODAL DRAG BAR & TITLE */}
            <View className="items-center mb-5">
              <View className="w-12 h-1 bg-slate-200 rounded-full mb-3" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Select Unit of Measure
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Choose the base UOM for this asset
              </Text>
            </View>

            {/* 3-COLUMN GRID PATTERN (PROPER LEFT-TO-RIGHT ALIGNMENT) */}
            <View className="flex-row flex-wrap justify-start mb-6">
              {UOM_OPTIONS.map((uom, index) => {
                const isSelected = uom_base === uom;

                // Tinitiyak na walang margin-right ang pang-3, pang-6, at pang-9 na item (katapusan ng bawat row)
                const isThirdColumn = (index + 1) % 3 === 0;

                return (
                  <TouchableOpacity
                    key={uom}
                    onPress={() => handle_select_uom(uom)}
                    activeOpacity={0.7}
                    style={{ marginRight: isThirdColumn ? 0 : "3.5%" }}
                    className={`w-[31%] py-3.5 rounded-xl border items-center justify-center mb-2 ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Text
                      className={`font-black text-xs tracking-wide ${
                        isSelected ? "text-emerald-700" : "text-slate-700"
                      }`}
                    >
                      {uom}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CLOSE ACTION */}
            <TouchableOpacity
              onPress={() => set_is_uom_modal_visible(false)}
              className="w-full bg-slate-100 py-4 rounded-xl justify-center items-center"
            >
              <Text className="text-slate-500 font-bold text-sm">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LPN_Register_Input;
