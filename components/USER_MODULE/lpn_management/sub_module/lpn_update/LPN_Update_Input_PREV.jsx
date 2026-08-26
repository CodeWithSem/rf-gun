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
  Plus,
  Minus,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";
import { use_item_master } from "@assets/scripts/functions/item_master_context";
import Item_Master_Modal from "@assets/elements/item_master_modal/Item_Master_Moda";

const LPN_Update_Input = ({ navigation, route }) => {
  const { old_lpn_data, user_data } = route.params || {};
  const { item_master_data, is_loading_items } = use_item_master();

  const bin_scanner_ref = useRef(null);
  const [loading, set_loading] = useState(false);

  // OBJECT STATE PARA SA NAPILING ITEM (Inisyal na laman ay galing sa lumang data)
  const [selected_item, set_selected_item] = useState(
    old_lpn_data
      ? {
          item_code: old_lpn_data.item_code || "",
          item_desc: old_lpn_data.item_desc || "No description available",
          uom_base: old_lpn_data.uom_base || "",
        }
      : null,
  );

  // FORM FIELDS
  const [qty_input, set_qty_input] = useState(
    String(old_lpn_data?.qty_base ?? "0"),
  );
  const [qty_in_kg, set_qty_in_kg] = useState(
    String(old_lpn_data?.qty_in_kg ?? "0"),
  );
  const [warehouse_code, set_warehouse_code] = useState(
    old_lpn_data?.warehouse_code || "",
  );
  const [sbin_code, set_sbin_code] = useState(old_lpn_data?.sbin_code || "");

  // MODAL STATES
  const [is_item_modal_visible, set_is_item_modal_visible] = useState(false);
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [temp_warehouse, set_temp_warehouse] = useState("");
  const [temp_sbin, set_temp_sbin] = useState("");

  useEffect(() => {
    let focus_interval;
    if (is_bin_modal_visible) {
      focus_interval = setInterval(() => {
        bin_scanner_ref.current?.focus();
      }, 800);
    }
    return () => clearInterval(focus_interval);
  }, [is_bin_modal_visible]);

  const handle_bin_scan = (scanned_string) => {
    if (!scanned_string) return;

    const clean_str = scanned_string.trim();

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

  const handle_update_lpn = async () => {
    if (
      !selected_item?.item_code ||
      !sbin_code ||
      !selected_item?.uom_base ||
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

    const timestamp_str = format_date(get_date_now());
    const unix_timestamp = Math.floor(Date.now() / 1000);
    const current_time_str = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
    const current_user = String(user_data?.username || "ADMIN");
    const target_lpn_id = String(old_lpn_data?.lpn_id);

    try {
      const batch = writeBatch(firestore_db);

      // 1. UPDATE TBL_INVENTORY_COUNT
      const updated_lpn_entry = {
        ...old_lpn_data,
        item_code: String(selected_item.item_code).toUpperCase(),
        item_desc: String(selected_item.item_desc),
        qty_base: Number(qty_input),
        qty_in_kg: Number(qty_in_kg),
        uom_base: String(selected_item.uom_base).toUpperCase(),
        uom_display: String(selected_item.uom_base).toUpperCase(),
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

      // 2. AUDIT TRAIL LOG SA TBL_INVENTORY_HISTORY
      const history_doc_id = `${unix_timestamp}_UPDATE_${target_lpn_id}_${current_user}`;

      const history_entry = {
        batch_code: String(old_lpn_data?.batch_code || ""),
        created_by: String(old_lpn_data?.created_by || ""),
        creation_date: String(old_lpn_data?.creation_date || ""),
        expiry_date: String(old_lpn_data?.expiry_date || ""),
        gr_number: String(old_lpn_data?.gr_number || ""),
        item_code: String(selected_item.item_code).toUpperCase(),
        item_desc: String(selected_item.item_desc),
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
        uom_base: String(selected_item.uom_base).toUpperCase(),
        uom_display: String(selected_item.uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code).toUpperCase(),

        update_date: String(timestamp_str),
        update_time: current_time_str,
        update_by: current_user,
        transaction_type: "UPDATE",

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

      await batch.commit();

      Vibration.vibrate(70);
      Alert.alert("Success", "LPN records updated successfully.", [
        {
          text: "OK",
          onPress: () => navigation.pop(2),
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
          {/* ITEM CODE SELECTION LOOKUP BUTTON */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Item Description
            </Text>
            <TouchableOpacity
              onPress={() => set_is_item_modal_visible(true)}
              activeOpacity={0.7}
              className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
            >
              <View className="flex-1 pr-2">
                {selected_item ? (
                  <>
                    <Text className="font-black text-base text-slate-900 uppercase">
                      {selected_item.item_code}
                    </Text>
                    <Text
                      className="text-xs font-bold text-slate-500 mt-0.5"
                      numberOfLines={1}
                    >
                      {selected_item.item_desc}
                    </Text>
                  </>
                ) : (
                  <Text className="font-bold text-base text-slate-400">
                    Tap to select an item...
                  </Text>
                )}
              </View>
              <ChevronDown size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* QUANTITY, UOM, AT WEIGHT ROW SECTIONS */}
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

            {/* UOM DISPLAY FIELD */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                UOM
              </Text>
              <Text className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900">
                {selected_item?.uom_base || ""}
              </Text>
            </View>
            <View className="flex-1 flex-row gap-3 mb-6 h-[31px] justify-center">
              <View className="flex-1">
                <TouchableOpacity
                  // onPress={() => mag pop up ang modal para mag input ng qty na idadagdag}
                  className="bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center"
                  activeOpacity={0.8}
                >
                  <Plus size={23} color="white" />
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <TouchableOpacity
                  // onPress={() => mag pop up ang modal para mag input ng qty na ibabawas}
                  className="bg-rose-600 p-4 rounded-xl flex-row justify-center items-center"
                  activeOpacity={0.8}
                >
                  <Minus size={23} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* QTY IN KG WEIGHT INPUT */}
            {/* <View className="flex-1">
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
            </View> */}
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

      {/* ITEM MASTER LOOKUP MODAL */}
      <Item_Master_Modal
        visible={is_item_modal_visible}
        onClose={() => set_is_item_modal_visible(false)}
        item_data={item_master_data}
        is_loading={is_loading_items}
        onSelect={(item) => {
          set_selected_item(item);
          Vibration.vibrate(30);
        }}
      />

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
    </SafeAreaView>
  );
};

export default LPN_Update_Input;
