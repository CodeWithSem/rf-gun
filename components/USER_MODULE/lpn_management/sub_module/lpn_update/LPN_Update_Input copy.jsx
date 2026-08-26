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
  X,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";
import { use_item_master } from "@assets/scripts/functions/item_master_context";
import Item_Master_Modal from "@assets/elements/item_master_modal/Item_Master_Moda";

const LPN_Update_Input = ({ navigation, route }) => {
  const {
    old_lpn_data,
    user_data,
    transfer_order_data: initial_to_data,
  } = route.params || {};
  const { item_master_data, is_loading_items } = use_item_master();

  const bin_scanner_ref = useRef(null);
  const qty_input_ref = useRef(null);
  const [loading, set_loading] = useState(false);

  // TRANSFER ORDER CONTEXT DETECT
  const to_number_ref =
    initial_to_data?.to_number ||
    old_lpn_data?.to_number_ref ||
    old_lpn_data?.to_number ||
    null;

  const [to_data, set_to_data] = useState(initial_to_data || null);

  // FETCH TRANSFER ORDER IF TO_NUMBER EXISTS BUT FULL DATA IS MISSING
  useEffect(() => {
    const fetch_transfer_order = async () => {
      if (to_number_ref && !to_data) {
        try {
          const to_doc_ref = doc(
            firestore_db,
            "DB1_ERP_SYSTEM",
            "TBL_TRANSFER_ORDER",
            "DATA",
            to_number_ref,
          );
          const snap = await getDoc(to_doc_ref);
          if (snap.exists()) {
            set_to_data(snap.data());
          }
        } catch (err) {
          console.error("Error fetching transfer order ref: ", err);
        }
      }
    };
    fetch_transfer_order();
  }, [to_number_ref]);

  // Target bin extraction from Transfer Order (if matched with this item)
  const matched_to_item = to_data?.transfer_list?.find((t_item) =>
    t_item.lpn_list?.some(
      (lpn) => String(lpn.lpn_id) === String(old_lpn_data?.lpn_id),
    ),
  );

  const target_to_wh = matched_to_item?.warehouse_code || "";
  const target_to_sbin = matched_to_item?.sbin_code || "";

  // OBJECT STATE PARA SA NAPILING ITEM
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
  const [warehouse_code, set_warehouse_code] = useState(
    old_lpn_data?.warehouse_code || "",
  );
  const [sbin_code, set_sbin_code] = useState(old_lpn_data?.sbin_code || "");

  // MODAL STATES
  const [is_item_modal_visible, set_is_item_modal_visible] = useState(false);
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [temp_warehouse, set_temp_warehouse] = useState("");
  const [temp_sbin, set_temp_sbin] = useState("");

  // DYNAMIC QUANTITY MODAL STATES
  const [is_qty_modal_visible, set_is_qty_modal_visible] = useState(false);
  const [qty_modal_mode, set_qty_modal_mode] = useState("OVERWRITE"); // 'OVERWRITE' | 'ADD' | 'SUBTRACT'
  const [temp_qty_value, set_temp_qty_value] = useState("");

  useEffect(() => {
    let focus_interval;
    if (is_bin_modal_visible) {
      focus_interval = setInterval(() => {
        bin_scanner_ref.current?.focus();
      }, 800);
    }
    return () => clearInterval(focus_interval);
  }, [is_bin_modal_visible]);

  // Auto focus input inside modal once it pops open
  useEffect(() => {
    if (is_qty_modal_visible) {
      setTimeout(() => qty_input_ref.current?.focus(), 150);
    }
  }, [is_qty_modal_visible]);

  const handle_bin_scan = (scanned_string) => {
    if (!scanned_string) return;

    const clean_str = scanned_string.trim();
    Vibration.vibrate(50);
    const parts = clean_str.split("_");
    const wh_part = parts[0]?.toUpperCase() || "";
    const bin_part = parts[1]?.toUpperCase() || "";

    // Kung may Transfer Order, dapat match sa target destination
    if (to_data && (target_to_wh || target_to_sbin)) {
      const is_wh_match = target_to_wh
        ? wh_part === target_to_wh.toUpperCase()
        : true;
      const is_bin_match = target_to_sbin
        ? bin_part === target_to_sbin.toUpperCase()
        : true;

      if (!is_wh_match || !is_bin_match) {
        Alert.alert(
          "Bin Mismatch",
          `Scanned bin (${wh_part} ${bin_part}) does not match Transfer Order target destination (${target_to_wh} ${target_to_sbin}).`,
        );
        return;
      }
    }

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

  // 1. TRIGGER FOR DIRECT QTY EDIT (CONFIRMATION FIRST)
  const trigger_qty_edit_confirmation = () => {
    Alert.alert(
      "Confirm Action",
      "Are you sure you want to edit the quantity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            set_qty_modal_mode("OVERWRITE");
            set_temp_qty_value(qty_input);
            set_is_qty_modal_visible(true);
          },
        },
      ],
    );
  };

  // 2. TRIGGER FOR ADD OR SUBTRACT MATH MODALS
  const trigger_math_qty_modal = (mode) => {
    set_qty_modal_mode(mode);
    set_temp_qty_value("");
    set_is_qty_modal_visible(true);
  };

  // 3. LOGIC FOR DYNAMIC QUANTITY MODAL CONFIRMATION
  const handle_confirm_qty_modal_changes = () => {
    const input_num = Number(temp_qty_value || 0);
    const current_num = Number(qty_input || 0);

    if (isNaN(input_num) || input_num < 0) {
      Alert.alert("Invalid Quantity", "Please input a valid positive number.");
      return;
    }

    let final_calculated_qty = current_num;

    if (qty_modal_mode === "OVERWRITE") {
      final_calculated_qty = input_num;
    } else if (qty_modal_mode === "ADD") {
      final_calculated_qty = current_num + input_num;
    } else if (qty_modal_mode === "SUBTRACT") {
      if (current_num - input_num < 0) {
        Alert.alert(
          "Invalid Operation",
          "Resulting quantity cannot be lower than 0.",
        );
        return;
      }
      final_calculated_qty = current_num - input_num;
    }

    set_qty_input(String(final_calculated_qty));
    set_is_qty_modal_visible(false);
    set_temp_qty_value("");
    Vibration.vibrate(30);
  };

  const handle_update_lpn = async () => {
    if (
      !selected_item?.item_code ||
      !sbin_code ||
      !selected_item?.uom_base ||
      !warehouse_code ||
      !qty_input
    ) {
      Alert.alert(
        "Missing Info",
        "Please fill up all required fields and ensure storage bin is selected.",
      );
      return;
    }

    set_loading(true);

    const timestamp_str = format_date(get_date_now());
    const iso_now_str = new Date().toISOString();
    const unix_timestamp = Math.floor(Date.now() / 1000);
    const current_time_str = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
    const full_name = `${user_data?.first_name} ${user_data?.last_name}`;
    const current_user = String(user_data?.username || "ADMIN");
    const target_lpn_id = String(old_lpn_data?.lpn_id);

    try {
      const batch = writeBatch(firestore_db);

      // 1. UPDATE TBL_INVENTORY_COUNT (NILINIS ANG TO REFERENCES)
      const updated_lpn_entry = {
        ...old_lpn_data,
        item_code: String(selected_item.item_code).toUpperCase(),
        item_desc: String(selected_item.item_desc),
        qty_base: Number(qty_input),
        qty_in_kg: Number(old_lpn_data?.qty_in_kg ?? 0),
        uom_base: String(selected_item.uom_base).toUpperCase(),
        uom_display: String(selected_item.uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code).toUpperCase(),
        sbin_code: String(sbin_code).toUpperCase(),
        update_date: String(timestamp_str),
        update_by: full_name,

        // CLEAR / EMPTY TO REFERENCES UPON SUCCESSFUL TRANSFER
        to_number_ref: "",
        to_warehouse_code: "",
        to_sbin_code: "",
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
        qty_in_kg: Number(old_lpn_data?.qty_in_kg ?? 0),
        sbin_code: String(sbin_code).toUpperCase(),
        sloc_code: String(old_lpn_data?.sloc_code || ""),
        stype_code: String(old_lpn_data?.stype_code || "BULK"),
        uom_base: String(selected_item.uom_base).toUpperCase(),
        uom_display: String(selected_item.uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code).toUpperCase(),

        update_date: String(timestamp_str),
        update_time: current_time_str,
        update_by: full_name,
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

      // 3. UPDATE TBL_TRANSFER_ORDER (KUNG MAY NAKATAG NA TRANSFER ORDER)
      if (to_number_ref) {
        const to_doc_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_TRANSFER_ORDER",
          "DATA",
          to_number_ref,
        );

        let latest_to_data = to_data;

        // Ensure we have fresh document snapshot from Firestore if missing locally
        if (!latest_to_data) {
          const snap = await getDoc(to_doc_ref);
          if (snap.exists()) {
            latest_to_data = snap.data();
          }
        }

        if (latest_to_data) {
          let has_to_changed = false;

          const updated_transfer_list = (
            latest_to_data.transfer_list || []
          ).map((t_item) => {
            let lpn_found_in_item = false;

            const updated_lpn_list = (t_item.lpn_list || []).map((lpn) => {
              if (String(lpn.lpn_id) === target_lpn_id) {
                has_to_changed = true;
                lpn_found_in_item = true;
                return {
                  ...lpn,
                  item_code: String(selected_item.item_code).toUpperCase(),
                  item_desc: String(selected_item.item_desc),
                  qty_base: Number(qty_input),
                  uom_base: String(selected_item.uom_base).toUpperCase(),
                  uom_display: String(selected_item.uom_base).toUpperCase(),
                  warehouse_code: String(warehouse_code).toUpperCase(),
                  sbin_code: String(sbin_code).toUpperCase(),
                  is_received: true, // Internal tracking marker
                };
              }
              return lpn;
            });

            if (!lpn_found_in_item) return t_item;

            // Check if ALL LPNs under this transfer_list item are scanned/transferred
            const all_lpns_received = updated_lpn_list.every((lpn) => {
              if (String(lpn.lpn_id) === target_lpn_id) return true;
              return (
                lpn.is_received === true ||
                (lpn.warehouse_code === t_item.warehouse_code &&
                  lpn.sbin_code === t_item.sbin_code)
              );
            });

            const new_transfer_status = all_lpns_received
              ? "Received"
              : t_item.transfer_status || "Picked";

            const new_received_date = all_lpns_received
              ? t_item.received_date || iso_now_str
              : t_item.received_date || "";

            return {
              ...t_item,
              lpn_list: updated_lpn_list,
              transfer_status: new_transfer_status,
              received_date: new_received_date,
            };
          });

          if (has_to_changed) {
            // Check if ALL transfer_list items now have status === "Received"
            const is_entire_to_complete = updated_transfer_list.every(
              (item) => item.transfer_status === "Received",
            );

            const updated_to_payload = {
              ...latest_to_data,
              transfer_list: updated_transfer_list,
              to_status: is_entire_to_complete
                ? "Complete"
                : latest_to_data.to_status || "Pending",
              ...(is_entire_to_complete && { complete_date: iso_now_str }),
            };

            batch.set(to_doc_ref, updated_to_payload, { merge: true });
          }
        }
      }

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
              <TouchableOpacity
                onPress={trigger_qty_edit_confirmation}
                activeOpacity={0.7}
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl"
              >
                <Text className="font-bold text-base text-slate-900">
                  {qty_input}
                </Text>
              </TouchableOpacity>
            </View>

            {/* UOM DISPLAY FIELD */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                UOM
              </Text>
              <Text className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900">
                {selected_item?.uom_base || "---"}
              </Text>
            </View>

            {/* MATH ACTION FLAT BUTTONS GROUP */}
            <View className="flex-1 flex-row gap-3">
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => trigger_math_qty_modal("ADD")}
                  className="bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center"
                  activeOpacity={0.8}
                >
                  <Plus size={23} color="white" />
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => trigger_math_qty_modal("SUBTRACT")}
                  className="bg-rose-600 p-4 rounded-xl flex-row justify-center items-center"
                  activeOpacity={0.8}
                >
                  <Minus size={23} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* STORAGE LOCATION METRICS CONTAINER */}
          <View className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xs text-slate-700 uppercase tracking-wider"
              >
                Bin Location Assignment
              </Text>
              {to_number_ref && (
                <View className="bg-orange-100 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-orange-700">
                    {to_number_ref}
                  </Text>
                </View>
              )}
            </View>

            {/* CONDITIONAL RENDERING FOR BIN LOCATION DISPLAY */}
            {to_number_ref && (target_to_wh || target_to_sbin) ? (
              /* TRANSFER ORDER MODE: SOURCE VS TARGET DESTINATION */
              <View className="mb-4">
                <View className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
                  {/* SOURCE */}
                  <View className="flex-1">
                    <Text className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Source Bin
                    </Text>
                    <Text className="text-xs font-black text-slate-700">
                      {old_lpn_data?.warehouse_code || "---"}
                    </Text>
                    <Text className="text-sm font-black text-slate-900">
                      {old_lpn_data?.sbin_code || "---"}
                    </Text>
                  </View>

                  <View className="px-2">
                    <ArrowRight size={18} color="#f97316" />
                  </View>

                  {/* TARGET DESTINATION */}
                  <View className="flex-1 items-end">
                    <Text className="text-[9px] font-bold text-orange-500 uppercase mb-0.5">
                      Target Destination
                    </Text>
                    <Text className="text-xs font-black text-slate-700">
                      {target_to_wh || "---"}
                    </Text>
                    <Text className="text-sm font-black text-orange-600">
                      {target_to_sbin || "---"}
                    </Text>
                  </View>
                </View>

                {/* CURRENT CONFIRMED LOCATION METRIC */}
                <View className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex-row justify-between items-center">
                  <Text className="text-[10px] font-bold text-emerald-700 uppercase">
                    Current Location:
                  </Text>
                  <Text className="text-xs font-black text-emerald-800">
                    {warehouse_code && sbin_code
                      ? `${warehouse_code} ${sbin_code}`
                      : "Pending Scan"}
                  </Text>
                </View>
              </View>
            ) : (
              /* NORMAL PROCESS: REGULAR BIN DISPLAY */
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
            )}

            {/* BIN SCANNING ACTION BUTTON */}
            <TouchableOpacity
              onPress={() => set_is_bin_modal_visible(true)}
              className={`${
                to_number_ref ? "bg-emerald-600" : "bg-sky-600"
              } py-4 rounded-xl flex-row justify-center items-center`}
              activeOpacity={0.8}
            >
              <QrCode size={18} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white ml-2 text-sm"
              >
                {to_number_ref
                  ? "Confirm Bin Location"
                  : "Scan New Bin Location"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUBMIT TRANSACTION ACTION BUTTONS */}

          <View className="flex-row gap-3 my-4">
            <TouchableOpacity
              onPress={handle_update_lpn}
              activeOpacity={0.8}
              className="flex-1 bg-orange-500 py-5 rounded-2xl justify-center items-center"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-base"
              >
                Save & Apply Changes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-[140px] bg-slate-100 border border-slate-300 py-5 rounded-2xl justify-center items-center"
            >
              <Text className="text-slate-500 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* <TouchableOpacity
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
          </TouchableOpacity> */}
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

      {/* DYNAMIC MULTI-OPTION QUANTITY INTERACTION MODAL */}
      <Modal visible={is_qty_modal_visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View className="bg-white rounded-[24px] p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-md text-slate-900"
                >
                  {qty_modal_mode === "OVERWRITE" && "LPN Information"}
                  {qty_modal_mode === "ADD" && "Add Quantity"}
                  {qty_modal_mode === "SUBTRACT" && "Subtract Quantity"}
                </Text>
                <Text className="text-xs text-sky-600 font-bold">
                  ID: {old_lpn_data?.lpn_id || "---"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set_is_qty_modal_visible(false)}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <View className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 gap-1">
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Item Code:</Text>
                <Text className="text-slate-800 text-xs font-bold">
                  {selected_item?.item_code || "---"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Bin:</Text>
                <Text className="text-slate-800 text-xs font-bold">
                  {sbin_code || "---"}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-slate-200/60 pt-2 mt-2">
                <Text className="text-slate-500 text-xs font-bold">
                  Max Available Qty:
                </Text>
                <Text className="text-slate-900 text-xs font-black">
                  {qty_input} {selected_item?.uom_base || ""}
                </Text>
              </View>
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xs text-slate-700 mb-2 uppercase"
            >
              {qty_modal_mode === "OVERWRITE" && "Enter Quantity to Edit"}
              {qty_modal_mode === "ADD" && "Enter Quantity to Add"}
              {qty_modal_mode === "SUBTRACT" && "Enter Quantity to Pick"}
            </Text>

            <View
              className={`bg-slate-50 border-2 rounded-xl px-4 py-2 mb-4 flex-row items-center ${
                qty_modal_mode === "SUBTRACT"
                  ? "border-rose-500"
                  : qty_modal_mode === "ADD"
                    ? "border-emerald-500"
                    : "border-sky-500"
              }`}
            >
              {qty_modal_mode === "ADD" && <Plus size={16} color="#059669" />}
              {qty_modal_mode === "SUBTRACT" && (
                <Minus size={16} color="#dc2626" />
              )}
              <TextInput
                ref={qty_input_ref}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={temp_qty_value}
                onChangeText={set_temp_qty_value}
                keyboardType="numeric"
                returnKeyType="done"
                className="flex-1 ml-2 text-slate-900 font-bold text-md p-0"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handle_confirm_qty_modal_changes}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  qty_modal_mode === "SUBTRACT"
                    ? "bg-rose-600"
                    : qty_modal_mode === "ADD"
                      ? "bg-emerald-600"
                      : "bg-sky-600"
                }`}
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-xs"
                >
                  Confirm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => set_is_qty_modal_visible(false)}
                className="flex-1 bg-slate-100 py-3 rounded-xl items-center"
              >
                <Text className="text-slate-600 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
