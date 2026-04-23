import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Vibration,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  CheckCircle2,
  ChevronsRight,
  Keyboard,
  X,
  PackageCheck,
  MapPin,
  Copy,
} from "lucide-react-native";

// FIREBASE IMPORTS
import { firestore_db } from "@assets/scripts/firebase";
import { doc, updateDoc, getDoc, deleteField } from "firebase/firestore";

// IMPORT UTILITIES & DATA
import { qty_unit_conversion } from "@assets/scripts/functions/item_unit_conversion";
import { item_master_list } from "@assets/data/item_master/item_master_list";
import { format_date, get_date_now } from "@assets/scripts/functions/format";

const TO_Process = ({ route, navigation }) => {
  const { to_data, user_data } = route.params;
  const scanner_input_ref = useRef(null);
  const manual_input_ref = useRef(null);

  // Gamitin ang lpn_status directly mula sa to_data
  const [lpn_list, set_lpn_list] = useState(to_data.selected_lpn_list);

  const [scanned_value, set_scanned_value] = useState("");
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [is_pick_modal, set_is_pick_modal] = useState(false);

  const [manual_lpn, set_manual_lpn] = useState("");
  const [selected_lpn, set_selected_lpn] = useState(null);
  const [confirm_qty, set_confirm_qty] = useState("");

  const bin_scanner_ref = useRef(null); // Para sa auto-focus ng bin scanner
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [is_manual_bin, set_is_manual_bin] = useState(false);
  const [bin_input_value, set_bin_input_value] = useState("");
  const [processing_lpn_id, set_processing_lpn_id] = useState(null);

  useEffect(() => {
    const focus_interval = setInterval(() => {
      if (!is_modal_visible && !is_pick_modal) {
        scanner_input_ref.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focus_interval);
  }, [is_modal_visible, is_pick_modal]);

  // --- DATABASE UPDATE HELPER ---
  const update_to_data_array = async (lpn_id, new_status) => {
    try {
      // Ginamit ang to_data.id.toString() dahil ito ang tamang Parent Document ID
      const to_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_TRANSFER_ORDER",
        "DATA",
        to_data.id.toString(),
      );

      const to_snap = await getDoc(to_ref);

      if (to_snap.exists()) {
        const current_to_data = to_snap.data();

        // I-update ang specific LPN sa loob ng array
        const updated_lpn_list = current_to_data.selected_lpn_list.map(
          (item) => {
            if (item.lpn_id.toString().trim() === lpn_id.toString().trim()) {
              return { ...item, lpn_status: new_status };
            }
            return item;
          },
        );

        // I-write pabalik sa Firestore ang buong updated array
        await updateDoc(to_ref, {
          selected_lpn_list: updated_lpn_list,
          last_updated_date: new Date().toISOString(),
        });

        console.log(
          `Successfully updated LPN ${lpn_id} to ${new_status} in TO #${to_data.id}`,
        );
        return true;
      } else {
        console.error(
          "Document not found in TBL_TRANSFER_ORDER/DATA/",
          to_data.id,
        );
      }
    } catch (error) {
      console.error("Helper Error (update_to_data_array):", error);
      throw error;
    }
  };

  const handle_scan = (value) => {
    if (!value) return;
    const trimmed_val = value.trim().toUpperCase();
    const lpn_item = lpn_list.find((lpn) => lpn.lpn_id === trimmed_val);

    if (lpn_item) {
      if (lpn_item.lpn_status === "Available") {
        Alert.alert(
          "Already Processed",
          `LPN ${trimmed_val} is already completed.`,
        );
      } else if (lpn_item.lpn_status === "In Transit") {
        Alert.alert(
          "In Transit",
          "Click 'Scan Bin Destination' to complete the move.",
        );
      } else {
        set_selected_lpn(lpn_item);
        set_is_pick_modal(true);
        set_is_modal_visible(false);
        set_manual_lpn("");
      }
    } else {
      Alert.alert("Invalid LPN", `LPN ${trimmed_val} is not part of this TO.`);
    }
    set_scanned_value("");
  };

  const confirm_pick_action = async () => {
    if (confirm_qty !== selected_lpn.qty_base_transfer.toString()) {
      Alert.alert(
        "Qty Mismatch",
        `Must match required quantity: ${selected_lpn.qty_base_transfer}`,
      );
      return;
    }

    try {
      const today = new Date();
      const formatted_date = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;

      const inventory_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_MASTER",
        "DATA",
        selected_lpn.lpn_id,
      );

      // SAKTAN: Sabay na update para sa Inventory at TO Table
      await Promise.all([
        updateDoc(inventory_ref, {
          lpn_status: "In Transit",
          last_updated_by: user_data?.user_id || "DEV-001",
          last_updated_date: formatted_date,
        }),
        update_to_data_array(selected_lpn.lpn_id, "In Transit"),
      ]);

      // Update Local State para mag-reflect sa UI agad
      set_lpn_list((prev) =>
        prev.map((item) =>
          item.lpn_id === selected_lpn.lpn_id
            ? { ...item, lpn_status: "In Transit" }
            : item,
        ),
      );

      Vibration.vibrate(100);
      set_is_pick_modal(false);
      set_selected_lpn(null);
      set_confirm_qty("");
    } catch (error) {
      Alert.alert("Sync Error", "Hindi ma-update ang database. Subukan muli.");
    }
  };

  const handle_destination_scan = (lpn_id) => {
    const target_lpn = lpn_list.find((l) => l.lpn_id === lpn_id);

    Alert.prompt(
      "Scan Destination Bin",
      `Target Storage Bin: ${target_lpn.to_sbin_code}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Drop-off",
          onPress: async (bin_val) => {
            if (
              bin_val?.toUpperCase() === target_lpn.to_sbin_code.toUpperCase()
            ) {
              try {
                const today = new Date();
                const formatted_date = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;

                const inventory_ref = doc(
                  firestore_db,
                  "DB1_ERP_SYSTEM",
                  "TBL_INVENTORY_MASTER",
                  "DATA",
                  lpn_id,
                );

                await Promise.all([
                  updateDoc(inventory_ref, {
                    lpn_status: "Available",
                    sbin_code: target_lpn.to_sbin_code,
                    stype_code: target_lpn.to_stype_code,
                    warehouse_code: target_lpn.to_warehouse_code,
                    last_updated_by: user_data?.user_id || "DEV-001",
                    last_updated_date: formatted_date,
                  }),
                  update_to_data_array(lpn_id, "Available"),
                ]);

                set_lpn_list((prev) =>
                  prev.map((item) =>
                    item.lpn_id === lpn_id
                      ? { ...item, lpn_status: "Available" }
                      : item,
                  ),
                );
                Vibration.vibrate(200);
              } catch (error) {
                Alert.alert(
                  "Sync Error",
                  "Failed to finalize transfer in database.",
                );
              }
            } else {
              Alert.alert("Wrong Bin", "Scan does not match destination bin.");
            }
          },
        },
      ],
    );
  };

  const render_lpn_item = ({ item }) => {
    const display_qty = qty_unit_conversion(
      item.qty_base_transfer,
      item.uom_display,
      item.item_code,
      item_master_list,
    );

    // Status Logic
    const is_completed = item.lpn_status === "Complete";
    const is_picked = item.lpn_status === "In Transit";

    return (
      <View
        className={`p-5 rounded-xl mb-4 border ${is_completed ? "bg-green-50 border-green-500" : "bg-slate-50 border-slate-200"}`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => copy_to_clipboard(item.lpn_id)}
              activeOpacity={0.6}
              className="flex-row items-center"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`text-base ${is_completed ? "text-green-600" : "text-slate-800"}`}
              >
                {`LPN: ${item.lpn_id}`}
              </Text>
              {/* Optional: Maliit na copy icon para sa UX hint */}
              <View className="ml-2 opacity-40">
                <Copy size={12} color={is_completed ? "#16a34a" : "#64748b"} />
              </View>
            </TouchableOpacity>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs mt-1"
            >
              {item.item_code}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              {item.item_desc}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`${is_completed ? "text-green-600" : "text-sky-700"}  text-xs uppercase`}
            >{`${display_qty} ${item.uom_display}`}</Text>
          </View>
          <View
            className={`${is_completed ? "bg-green-200" : is_picked ? "bg-orange-100" : "bg-slate-200"} px-3 py-1 rounded-full`}
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`${is_completed ? "text-green-700" : is_picked ? "text-orange-700" : "text-slate-600"} text-[10px] uppercase`}
            >
              {item.lpn_status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <View>
            <Text className="text-[9px] text-slate-400 uppercase font-[Outfit-Bold]">
              From Bin
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-600 text-xs"
            >
              {item.sbin_code}
            </Text>
          </View>
          {is_completed ? (
            <ChevronsRight size={16} color="#16a34a" />
          ) : (
            <ChevronsRight size={16} color="#0284c7" />
          )}
          <View className="items-end">
            <Text className="text-[9px] text-slate-400 uppercase font-[Outfit-Bold]">
              To Bin
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`${is_completed ? "text-green-600" : "text-sky-600"} text-xs`}
            >
              {item.to_sbin_code}
            </Text>
          </View>
        </View>

        {is_picked && (
          <TouchableOpacity
            onPress={() => start_destination_process(item.lpn_id)} // Bagong function trigger
            className="mt-4 bg-sky-600 flex-row items-center justify-center py-3 rounded-xl shadow-sm"
          >
            <MapPin size={16} color="white" />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white text-xs ml-2 uppercase"
            >
              Scan Bin Destination
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const completed_count = lpn_list.filter(
    (l) => l.lpn_status === "Complete",
  ).length;

  const start_destination_process = (lpn_id) => {
    set_processing_lpn_id(lpn_id);
    set_is_bin_modal_visible(true);
    set_is_manual_bin(false); // Default ay scan mode
    set_bin_input_value("");
  };

  const validate_and_drop = async (input_bin) => {
    const target_lpn = lpn_list.find((l) => l.lpn_id === processing_lpn_id);
    const scanned_bin = input_bin.trim().toUpperCase();

    if (scanned_bin === target_lpn.to_sbin_code.toUpperCase()) {
      try {
        const today = new Date();
        const formatted_date = `${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}-${today.getFullYear()}`;

        const inventory_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_INVENTORY_MASTER",
          "DATA",
          processing_lpn_id,
        );

        // 1. UPDATE INVENTORY MASTER (With Field Cleanup)
        const update_inventory = updateDoc(inventory_ref, {
          // Transfer logic: Move values to primary fields
          lpn_status: "Available",
          qty_base: target_lpn.qty_base_transfer, // Transfer qty becomes the new base qty
          plant_code: target_lpn.to_plant_code,
          warehouse_code: target_lpn.to_warehouse_code,
          sbin_code: target_lpn.to_sbin_code,
          stype_code: target_lpn.to_stype_code,

          // Metadata
          last_updated_by: user_data?.user_id || "DEV-001",
          last_updated_date: formatted_date,

          // CLEANUP: Burahin ang transfer-related fields
          qty_display: deleteField(),
          qty_base_transfer: deleteField(),
          qty_display_transfer: deleteField(),
          to_plant_code: deleteField(),
          to_warehouse_code: deleteField(),
          to_sbin_code: deleteField(),
          to_stype_code: deleteField(),
          movement_type_code: deleteField(),
        });

        // 2. UPDATE TRANSFER ORDER ARRAY (Status only)
        const update_to = update_to_data_array(processing_lpn_id, "Complete");

        // Execute both updates
        await Promise.all([update_inventory, update_to]);

        // 3. UPDATE LOCAL STATE (UI Feedback)
        set_lpn_list((prev) =>
          prev.map((item) =>
            item.lpn_id === processing_lpn_id
              ? { ...item, lpn_status: "Complete" }
              : item,
          ),
        );

        Vibration.vibrate(200);
        set_is_bin_modal_visible(false);
        set_processing_lpn_id(null);
        set_bin_input_value("");
      } catch (error) {
        console.error("Drop-off Error:", error);
        Alert.alert("Sync Error", "Failed to finalize transfer.");
      }
    } else {
      Vibration.vibrate([100, 100, 100]);
      Alert.alert(
        "Wrong Bin",
        `In-scan: ${scanned_bin}\nRequired: ${target_lpn.to_sbin_code}`,
      );
      set_bin_input_value("");
    }
  };

  const finalize_transfer_order = async () => {
    try {
      const to_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_TRANSFER_ORDER",
        "DATA",
        to_data.id.toString(),
      );

      await updateDoc(to_ref, {
        to_status: "Complete",
        complete_date: format_date(get_date_now()),
        last_updated_by: user_data?.user_id || "SYSTEM",
      });

      Vibration.vibrate([100, 200, 100]);
      Alert.alert("Success", "Transfer Order is complete. Thank you.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Finalize TO Error:", error);
      Alert.alert("Error", "Failed to close the Transfer Order.");
    }
  };

  const copy_to_clipboard = (text) => {
    set_manual_lpn(text);
  };

  // RETURN ORIGIN
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* HIDDEN SCANNER INPUT */}
      <TextInput
        ref={scanner_input_ref}
        value={scanned_value}
        onChangeText={set_scanned_value}
        onSubmitEditing={() => handle_scan(scanned_value)}
        autoFocus={true}
        showSoftInputOnFocus={false}
        style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
      />

      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <View className="ml-2">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xl text-slate-900"
            >
              Processing Transfer
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-sky-600 text-xs"
            >
              {to_data.to_number}
            </Text>
          </View>
        </View>
        <View className="bg-slate-100 px-4 py-2 rounded-xl">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-700 text-xs"
          >{`${completed_count} / ${lpn_list.length}`}</Text>
        </View>
      </View>

      <FlatList
        data={lpn_list}
        renderItem={render_lpn_item}
        keyExtractor={(item) => item.lpn_id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <View className="mb-6 bg-sky-50 p-5 rounded-xl border border-sky-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-sky-500 p-2 rounded-lg">
                  <Barcode size={20} color="#ffffff" />
                </View>
                <View className="ml-4">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-900 text-sm"
                  >
                    Scanning Active
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-sky-700 text-[11px]"
                  >
                    Scan tag or enter manually
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => set_is_modal_visible(true)}
                className="bg-white px-3 py-2 rounded-lg border border-sky-200 shadow-sm"
              >
                <View className="flex-row items-center">
                  <Keyboard size={14} color="#0284c7" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-700 text-[10px] ml-1 uppercase"
                  >
                    Manual
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        }
      />

      {/* PICK MODAL */}
      <Modal visible={is_pick_modal} animationType="fade" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[32px] p-8 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Confirm Pick
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Medium" }}
                  className="text-sky-600"
                >
                  LPN: {selected_lpn?.lpn_id}
                </Text>
              </View>
              <TouchableOpacity onPress={() => set_is_pick_modal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-xs"
              >
                Target Quantity
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-700 text-lg"
              >
                {selected_lpn?.qty_base_transfer} {selected_lpn?.uom_display}
              </Text>
            </View>
            <View className="bg-slate-100 border border-slate-200 rounded-xl px-4 mb-8">
              <TextInput
                placeholder="0"
                keyboardType="numeric"
                className="py-4 text-2xl font-[Outfit-Bold] text-slate-900"
                value={confirm_qty}
                onChangeText={set_confirm_qty}
                autoFocus={true}
              />
            </View>
            <TouchableOpacity
              onPress={confirm_pick_action}
              className="bg-green-600 py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
            >
              <PackageCheck size={20} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg ml-2"
              >
                Confirm Pick
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MANUAL MODAL */}
      <Modal visible={is_modal_visible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-slate-900/60 justify-center px-6"
        >
          <View className="bg-white rounded-xl p-8 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Manual Entry
              </Text>
              <TouchableOpacity
                onPress={() => {
                  set_is_modal_visible(false);
                  set_manual_lpn("");
                }}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 mb-6">
              <TextInput
                ref={manual_input_ref}
                placeholder="Enter LPN ID..."
                className="py-4 text-lg font-[Outfit-Medium] text-slate-900"
                value={manual_lpn}
                onChangeText={set_manual_lpn}
                autoFocus={true}
                autoCapitalize="characters"
                onSubmitEditing={() => handle_scan(manual_lpn)}
              />
            </View>
            <TouchableOpacity
              onPress={() => handle_scan(manual_lpn)}
              className="bg-sky-600 py-4 rounded-lg items-center shadow-md shadow-sky-200"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-base"
              >
                Confirm LPN
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* BIN DESTINATION MODAL */}
      <Modal visible={is_bin_modal_visible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-slate-900/80 justify-end"
        >
          <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl">
            {/* Hidden Input for Scanner Gun */}
            {!is_manual_bin && (
              <TextInput
                ref={bin_scanner_ref}
                value={bin_input_value}
                onChangeText={set_bin_input_value}
                onSubmitEditing={() => validate_and_drop(bin_input_value)}
                autoFocus={true}
                showSoftInputOnFocus={false}
                style={{ position: "absolute", opacity: 0 }}
              />
            )}

            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-2xl text-slate-700"
                >
                  Confirm Drop-off
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Medium" }}
                  className="text-sky-600"
                >
                  LPN: {processing_lpn_id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set_is_bin_modal_visible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="bg-sky-50 p-6 rounded-2xl mb-6 border border-sky-100 items-center">
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-sky-600 text-xs uppercase mb-1"
              >
                Move to Target Bin
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-900 text-3xl"
              >
                {
                  lpn_list.find((l) => l.lpn_id === processing_lpn_id)
                    ?.to_sbin_code
                }
              </Text>
            </View>

            {is_manual_bin ? (
              <View className="mb-6">
                <View className="bg-slate-100 border-2 border-slate-200 rounded-xl px-4 flex-row items-center">
                  <MapPin size={20} color="#64748b" />
                  <TextInput
                    placeholder="Type Bin Code..."
                    className="flex-1 py-4 ml-3 text-lg font-[Outfit-Bold] text-slate-900"
                    value={bin_input_value}
                    onChangeText={set_bin_input_value}
                    autoFocus={true}
                    autoCapitalize="characters"
                    onSubmitEditing={() => validate_and_drop(bin_input_value)}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => set_is_manual_bin(false)}
                  className="mt-4 items-center"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-xs uppercase"
                  >
                    Switch to Scanner
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center py-6 mb-4">
                <View className="bg-sky-100 p-6 rounded-full mb-4">
                  <Barcode size={48} color="#0284c7" />
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-800 text-base uppercase"
                >
                  Waiting for Bin Scan...
                </Text>
                <TouchableOpacity
                  onPress={() => set_is_manual_bin(true)}
                  className="mt-6 bg-slate-100 px-6 py-3 rounded-xl"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-600 text-xs uppercase tracking-wide"
                  >
                    Enter Bin Manually
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {is_manual_bin && (
              <TouchableOpacity
                onPress={() => validate_and_drop(bin_input_value)}
                className="bg-green-600 py-5 rounded-2xl items-center shadow-lg shadow-green-200"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Verify & Complete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FOOTER ACTION */}
      {completed_count === lpn_list.length && (
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-2xl">
          <TouchableOpacity
            className="bg-sky-600 py-5 rounded-2xl items-center justify-center shadow-lg shadow-sky-200"
            onPress={finalize_transfer_order} // Eto ang tatawag sa DB update
          >
            <View className="flex-row items-center">
              <CheckCircle2 size={20} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg ml-2"
              >
                Confirm & Close Order
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TO_Process;
