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
  CheckCircle2,
  AlertCircle,
  QrCode,
  ChevronDown,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";

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

const LPN_Update_Input = ({ navigation, route }) => {
  // Tinanggap ang old_lpn_data at user_data mula sa nakaraang screen
  const { old_lpn_data, user_data } = route.params || {};

  const bin_scanner_ref = useRef(null);
  const qty_input_ref = useRef(null);

  const [loading, set_loading] = useState(false);

  // FORM FIELDS - Pre-populated gamit ang data mula sa lumang LPN record
  const [item_code_input, set_item_code_input] = useState(
    old_lpn_data?.item_code || "",
  );
  const [qty_input, set_qty_input] = useState(
    String(old_lpn_data?.qty_base ?? "0"),
  );
  const [uom_base, set_uom_base] = useState(old_lpn_data?.uom_base || "");
  const [qty_in_kg, set_qty_in_kg] = useState(
    String(old_lpn_data?.qty_in_kg ?? "0"),
  );
  const [warehouse_code, set_warehouse_code] = useState(
    old_lpn_data?.warehouse_code || "",
  );
  const [sbin_code, set_sbin_code] = useState(old_lpn_data?.sbin_code || "");

  // MODAL STATES
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [is_uom_modal_visible, set_is_uom_modal_visible] = useState(false);
  const [temp_warehouse, set_temp_warehouse] = useState("");
  const [temp_sbin, set_temp_sbin] = useState("");

  // 1. AUTO-FOCUS SA ITEM CODE FIELD SA PAGBUKAS NG SCREEN
  //   useEffect(() => {
  //     const timer = setTimeout(() => {
  //       qty_input_ref.current?.focus();
  //     }, 500);

  //     return () => clearTimeout(timer);
  //   }, []);

  // 2. AUTO-FOCUS SA HIDDEN INPUT PARA SA HARDWARE SCANNER KAPAG BUKAS ANG BIN MODAL
  useEffect(() => {
    let focus_interval;
    if (is_bin_modal_visible) {
      focus_interval = setInterval(() => {
        bin_scanner_ref.current?.focus();
      }, 800);
    }
    return () => clearInterval(focus_interval);
  }, [is_bin_modal_visible]);

  // BIN LOCATION STRING PARSING (e.g. WH02_A-1-1)
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

  const handle_update_lpn = async () => {
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
        "Please fill up all required fields and ensure storage bin is selected.",
      );
      return;
    }

    set_loading(true);

    const timestamp_str = format_date(get_date_now()); // Format: MM-DD-YYYY
    const unix_timestamp = Math.floor(Date.now() / 1000); // Unix timestamp para sa unique history doc ID
    const current_time_str = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
    const current_user = String(user_data?.username || "ADMIN");
    const target_lpn_id = String(old_lpn_data?.lpn_id);

    try {
      const batch = writeBatch(firestore_db);

      // ----------------------------------------------------
      // 1. I-PREPARE ANG IN-UPDATE NA RECORD PARA SA TBL_INVENTORY_COUNT
      // ----------------------------------------------------
      const updated_lpn_entry = {
        ...old_lpn_data, // Panatilihin ang system fields (created_by, creation_date, status, etc.)
        item_code: String(item_code_input).toUpperCase(),
        qty_base: Number(qty_input),
        qty_in_kg: Number(qty_in_kg),
        uom_base: String(uom_base).toUpperCase(),
        uom_display: String(uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code).toUpperCase(),
        sbin_code: String(sbin_code).toUpperCase(),
        update_date: String(timestamp_str),
        update_by: current_user,
      };

      const count_doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        target_lpn_id,
      );
      batch.set(count_doc_ref, updated_lpn_entry);

      // ----------------------------------------------------
      // 2. I-PREPARE ANG AUDIT TRAIL LOG SA TBL_INVENTORY_HISTORY
      // ----------------------------------------------------
      const history_doc_id = `${unix_timestamp}_UPDATE_${target_lpn_id}_${current_user}`;

      const history_entry = {
        // Mga Bagong Data (Ininput ng User)
        batch_code: String(old_lpn_data?.batch_code || ""),
        created_by: String(old_lpn_data?.created_by || ""),
        creation_date: String(old_lpn_data?.creation_date || ""),
        expiry_date: String(old_lpn_data?.expiry_date || ""),
        gr_number: String(old_lpn_data?.gr_number || ""),
        item_code: String(item_code_input).toUpperCase(),
        lpn_id: target_lpn_id,
        lpn_status: String(old_lpn_data?.lpn_status || "Available"),
        mfg_date: String(old_lpn_data?.mfg_date || ""),
        plant_code: String(old_lpn_data?.plant_code || "PL01"),
        po_number: String(old_lpn_data?.po_number || ""),
        qty_base: Number(qty_input),
        qty_in_kg: Number(qty_in_kg),
        sbin_code: String(sbin_code).toUpperCase(),
        sloc_code: String(old_lpn_data?.sloc_code || ""),
        stype_code: String(old_lpn_data?.stype_code || "BULK"),
        uom_base: String(uom_base).toUpperCase(),
        uom_display: String(uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code).toUpperCase(),

        // Audit / Track Information Fields
        update_date: String(timestamp_str),
        update_time: current_time_str,
        update_by: current_user,
        transaction_type: "UPDATE",

        // 'From' Fields: Track ng orihinal na estado bago binago
        from_batch_code: String(old_lpn_data?.batch_code || ""),
        from_expiry_date: String(old_lpn_data?.expiry_date || ""),
        from_gr_number: String(old_lpn_data?.gr_number || ""),
        from_item_code: String(old_lpn_data?.item_code || ""),
        from_lpn_id: target_lpn_id,
        from_lpn_status: String(old_lpn_data?.lpn_status || "Available"),
        from_mfg_date: String(old_lpn_data?.mfg_date || ""),
        from_po_number: String(old_lpn_data?.po_number || ""),
        from_qty_base: Number(old_lpn_data?.qty_base ?? 0),
        from_qty_in_kg: Number(old_lpn_data?.qty_in_kg ?? 0),
        from_uom_base: String(old_lpn_data?.uom_base || ""),
        from_uom_display: String(old_lpn_data?.uom_display || ""),
        from_warehouse_code: String(old_lpn_data?.warehouse_code || ""),
      };

      const history_doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_HISTORY",
        "DATA",
        history_doc_id,
      );
      batch.set(history_doc_ref, history_entry);

      // Isakatuparan ang sabay na pagsusulat (Atomic Transaction Execution)
      await batch.commit();

      Vibration.vibrate(70);
      Alert.alert("Success", "LPN records updated successfully.", [
        {
          text: "OK",
          onPress: () => navigation.pop(2), // Babalik diretso sa root list/scan screen matapos mag-save
        },
      ]);
    } catch (error) {
      console.error("Update Transaction Error: ", error);
      Alert.alert("Error", "Failed to process LPN update transaction.");
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
            Edit LPN Information
          </Text>
          <Text className="text-orange-600 font-bold text-xs">
            Target LPN: {old_lpn_data?.lpn_id}
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
          {/* ITEM CODE INPUT */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Item Code
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-slate-900 text-base"
              value={item_code_input}
              onChangeText={set_item_code_input}
              autoCapitalize="characters"
              placeholder="Enter item code"
            />
          </View>

          {/* QUANTITY, UOM, AT WEIGHT ROW SECTIONS */}
          <View className="flex-row gap-3 mb-6 items-end">
            {/* QUANTITY INPUT */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Qty
              </Text>
              <TextInput
                // ref={qty_input_ref}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900"
                value={qty_input}
                onChangeText={set_qty_input}
                placeholder="0"
              />
            </View>

            {/* UOM SELECTOR */}
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

            {/* QTY IN KG WEIGHT INPUT */}
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

          {/* STORAGE LOCATION METRICS CONTAINER */}
          <View className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xs text-slate-700 mb-3 uppercase tracking-wider"
            >
              Bin Location Assignment
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
                Scan New Bin Location
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUBMIT TRANSACTION ACTION BUTTONS */}
          <TouchableOpacity
            onPress={handle_update_lpn}
            activeOpacity={0.8}
            className="bg-orange-500 py-5 rounded-2xl items-center mb-4 shadow-sm"
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white text-lg"
            >
              Save & Apply Changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-slate-100 py-5 rounded-2xl justify-center items-center mb-8"
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

      {/* MODERN COMPACT UOM SELECTION MODAL */}
      <Modal visible={is_uom_modal_visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-6 shadow-2xl pb-8">
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

            <View className="flex-row flex-wrap justify-start mb-6">
              {UOM_OPTIONS.map((uom, index) => {
                const isSelected = uom_base === uom;
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

export default LPN_Update_Input;
