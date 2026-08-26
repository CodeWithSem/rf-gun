import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  Keyboard,
  X,
  Trash2,
  CheckCircle2,
  QrCode,
  AlertCircle,
  ArrowRightLeft,
  Move,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";

const Bulk_Transfer = ({ navigation, route }) => {
  const scanner_input_ref = useRef(null);
  const modal_input_ref = useRef(null);
  const bin_scanner_ref = useRef(null);
  const isFocused = useIsFocused();

  // Route Params o User Data Context
  const user_data = route?.params?.user_data || {
    first_name: "John",
    last_name: "Doe",
    username: "ADMIN",
  };

  const [loading, set_loading] = useState(false);
  const [scanned_lpns, set_scanned_lpns] = useState([]);

  // LPN MANUAL MODAL STATES
  const [modal_visible, set_modal_visible] = useState(false);
  const [manual_lpn_id, set_manual_lpn_id] = useState("");

  // BIN LOCATION STATES
  const [warehouse_code, set_warehouse_code] = useState("");
  const [sbin_code, set_sbin_code] = useState("");
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [temp_warehouse, set_temp_warehouse] = useState("");
  const [temp_sbin, set_temp_sbin] = useState("");

  // 1. MAIN SCREEN CONTINUOUS HARDWARE SCANNER
  useEffect(() => {
    let focus_interval;
    if (isFocused && !modal_visible && !is_bin_modal_visible) {
      focus_interval = setInterval(() => {
        scanner_input_ref.current?.focus();
      }, 800);
    }
    return () => clearInterval(focus_interval);
  }, [isFocused, modal_visible, is_bin_modal_visible]);

  // 2. BIN MODAL CONTINUOUS HARDWARE SCANNER
  useEffect(() => {
    let focus_interval;
    if (is_bin_modal_visible) {
      focus_interval = setInterval(() => {
        bin_scanner_ref.current?.focus();
      }, 800);
    }
    return () => clearInterval(focus_interval);
  }, [is_bin_modal_visible]);

  // 3. MANUAL ENTRY MODAL AUTO-FOCUS (SOFT KEYBOARD)
  useEffect(() => {
    if (modal_visible) {
      setTimeout(() => {
        modal_input_ref.current?.focus();
      }, 150);
    }
  }, [modal_visible]);

  // DATE HELPERS
  const get_date_now = () => new Date();
  const format_date = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // HANDLE SCAN / SEARCH LPN
  const handle_search_lpn = async (val) => {
    const clean_id = val.trim().toUpperCase();
    if (!clean_id) return;

    const is_duplicate = scanned_lpns.some((item) => item.lpn_id === clean_id);
    if (is_duplicate) {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert(
        "Duplicate Scan",
        `LPN ${clean_id} is already in the transfer list.`,
      );
      return;
    }

    set_loading(true);
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
        const data = doc_snap.data();

        set_scanned_lpns((prev_items) => [
          { ...data, lpn_id: clean_id },
          ...prev_items,
        ]);
        set_modal_visible(false);
        set_manual_lpn_id("");
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `LPN ${clean_id} does not exist in inventory records.`,
        );
      }
    } catch (e) {
      console.error("Bulk Transfer LPN Scan Error: ", e);
      Alert.alert("Error", "Failed to fetch LPN information.");
    } finally {
      set_loading(false);
    }
  };

  const handle_manual_lpn_submit = () => {
    const clean_id = manual_lpn_id.trim();
    if (!clean_id) {
      Alert.alert("Validation Error", "Please enter a valid LPN ID.");
      return;
    }
    handle_search_lpn(clean_id);
  };

  const remove_lpn_item = (lpn_id) => {
    set_scanned_lpns((prev) => prev.filter((item) => item.lpn_id !== lpn_id));
    Vibration.vibrate(30);
  };

  // HANDLE BIN SCANNING
  const handle_bin_scan = (code) => {
    const clean_code = code.trim().toUpperCase();
    if (!clean_code) return;

    Vibration.vibrate(50);

    let wh = "";
    let bin = "";

    if (clean_code.includes("_")) {
      const parts = clean_code.split("_");
      wh = parts[0];
      bin = parts.slice(1).join("_");
    } else if (clean_code.includes("/")) {
      const parts = clean_code.split("/");
      wh = parts[0];
      bin = parts.slice(1).join("/");
    } else {
      wh = warehouse_code || "WH01";
      bin = clean_code;
    }

    set_temp_warehouse(wh);
    set_temp_sbin(bin);
  };

  const handle_confirm_bin = () => {
    if (!temp_warehouse || !temp_sbin) return;
    set_warehouse_code(temp_warehouse);
    set_sbin_code(temp_sbin);
    set_is_bin_modal_visible(false);
    set_temp_warehouse("");
    set_temp_sbin("");
    Vibration.vibrate(50);
  };

  // MAIN PROCESS BULK TRANSFER TRANSACTION
  const handle_bulk_transfer = async () => {
    if (scanned_lpns.length === 0) {
      Alert.alert("Empty List", "Please scan at least one LPN to transfer.");
      return;
    }

    if (!warehouse_code || !sbin_code) {
      Alert.alert(
        "Missing Bin Location",
        "Please scan and assign a target Storage Bin location before transferring.",
      );
      return;
    }

    set_loading(true);

    const timestamp_str = format_date(get_date_now());
    const current_time_str = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
    const full_name = `${user_data?.first_name} ${user_data?.last_name}`.trim();
    const current_user = String(user_data?.username || "ADMIN");

    try {
      const batch = writeBatch(firestore_db);

      for (const item of scanned_lpns) {
        const target_lpn_id = String(item.lpn_id);
        const unix_timestamp = Math.floor(Date.now() / 1000);

        // 1. UPDATE TBL_INVENTORY_COUNT
        const count_doc_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_INVENTORY_COUNT",
          "DATA",
          target_lpn_id,
        );

        batch.update(count_doc_ref, {
          warehouse_code: String(warehouse_code).toUpperCase(),
          sbin_code: String(sbin_code).toUpperCase(),
          update_date: String(timestamp_str),
          update_by: full_name,
        });

        // 2. AUDIT LOG SA TBL_INVENTORY_HISTORY
        const history_doc_id = `${unix_timestamp}_TRANSFER_${target_lpn_id}_${current_user}`;

        const history_entry = {
          batch_code: String(item?.batch_code || ""),
          created_by: String(item?.created_by || ""),
          creation_date: String(item?.creation_date || ""),
          expiry_date: String(item?.expiry_date || ""),
          gr_number: String(item?.gr_number || ""),
          item_code: String(item?.item_code || "").toUpperCase(),
          item_desc: String(item?.item_desc || ""),
          lpn_id: target_lpn_id,
          lpn_status: String(item?.lpn_status || "Available"),
          mfg_date: String(item?.mfg_date || ""),
          plant_code: String(item?.plant_code || "PL01"),
          po_number: String(item?.po_number || ""),
          qty_base: Number(item?.qty_base ?? 0),
          qty_in_kg: Number(item?.qty_in_kg ?? 0),
          sbin_code: String(sbin_code).toUpperCase(),
          sloc_code: String(item?.sloc_code || ""),
          stype_code: String(item?.stype_code || "BULK"),
          uom_base: String(item?.uom_base || "").toUpperCase(),
          uom_display: String(
            item?.uom_display || item?.uom_base || "",
          ).toUpperCase(),
          warehouse_code: String(warehouse_code).toUpperCase(),

          update_date: String(timestamp_str),
          update_time: current_time_str,
          update_by: full_name,
          transaction_type: "BULK_TRANSFER",

          from_batch_code: String(item?.batch_code || ""),
          from_expiry_date: String(item?.expiry_date || ""),
          from_gr_number: String(item?.gr_number || ""),
          from_item_code: String(item?.item_code || ""),
          from_lpn_id: target_lpn_id,
          from_lpn_status: String(item?.lpn_status || "Available"),
          from_mfg_date: String(item?.mfg_date || ""),
          from_po_number: String(item?.po_number || ""),
          from_qty_base: Number(item?.qty_base ?? 0),
          from_qty_in_kg: Number(item?.qty_in_kg ?? 0),
          from_sbin_code: String(item?.sbin_code || ""),
          from_uom_base: String(item?.uom_base || ""),
          from_uom_display: String(item?.uom_display || ""),
          from_warehouse_code: String(item?.warehouse_code || ""),
        };

        const history_doc_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_INVENTORY_HISTORY",
          "DATA",
          history_doc_id,
        );

        batch.set(history_doc_ref, history_entry);
      }

      await batch.commit();

      Vibration.vibrate([50, 100, 50]);
      Alert.alert(
        "Success",
        `${scanned_lpns.length} LPN(s) successfully transferred to ${warehouse_code} ${sbin_code}.`,
        [
          {
            text: "OK",
            onPress: () => {
              set_scanned_lpns([]);
              set_warehouse_code("");
              set_sbin_code("");
            },
          },
        ],
      );
    } catch (error) {
      console.error("Bulk Transfer Error: ", error);
      Alert.alert(
        "Transaction Error",
        "Failed to update database. Please check connection and try again.",
      );
    } finally {
      set_loading(false);
    }
  };

  const render_lpn_item = ({ item, index }) => (
    <View className="bg-white mx-6 rounded-xl border border-slate-200 mb-2 shadow-sm overflow-hidden">
      {/* TOP SECTION */}
      <View className="p-3.5 pb-2.5 flex-row items-start">
        <View className="bg-slate-50 w-7 h-7 rounded-md items-center justify-center mr-3 border border-slate-200/60 mt-0.5">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-[11px] text-slate-400"
          >
            {index + 1}
          </Text>
        </View>

        <View className="flex-1 pr-2">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-sky-600 text-[14px] uppercase tracking-wide"
          >
            {item?.lpn_id || "-"}
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-800 text-xs mt-0.5"
          >
            {item?.item_code || "-"}
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-500 text-xs"
            numberOfLines={1}
          >
            {item?.item_desc || "No Description"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => remove_lpn_item(item.lpn_id)}
          className="p-2 bg-rose-50 rounded-lg border border-rose-100"
          activeOpacity={0.7}
        >
          <Trash2 size={14} color="#e11d48" />
        </TouchableOpacity>
      </View>

      <View className="border-t border-slate-100 mx-3.5" />

      {/* BOTTOM SECTION */}
      <View className="px-3.5 py-2.5 flex-row items-center justify-between bg-slate-50/50">
        <View className="flex-row items-center bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-600 text-[10px] uppercase tracking-wide"
          >
            CURR: {item?.warehouse_code || "-"} {item?.sbin_code || "-"}
          </Text>
        </View>

        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-sky-700 text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-100"
        >
          {item?.qty_base?.toLocaleString()} {item?.uom_base || ""}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      {/* HIDDEN MAIN SCANNER INPUT */}
      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_search_lpn(code);
            scanner_input_ref.current?.clear();
          }
        }}
        blurOnSubmit={false}
        autoFocus={true}
      />

      {/* HEADER DESIGN */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Bulk Transfer
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan multiple LPNs & reassign bin
          </Text>
        </View>
        <Move size={24} color="#0284c7" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50">
        {scanned_lpns.length === 0 ? (
          /* EMPTY STATE */
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
              className="text-slate-400 text-center mt-2 leading-5"
            >
              Scan LPN QR codes continuously to populate the transfer queue.
            </Text>

            <TouchableOpacity
              onPress={() => set_modal_visible(true)}
              activeOpacity={0.7}
              className="mt-8 bg-sky-50 border border-sky-200 px-6 py-3.5 rounded-2xl flex-row items-center"
            >
              <Keyboard size={18} color="#0284c7" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-700 text-sm ml-2"
              >
                Manual LPN Entry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* LIST VIEW WITH CARDS & BIN ASSIGNMENT AT THE BOTTOM */
          <FlatList
            data={scanned_lpns}
            keyExtractor={(item) => item.lpn_id}
            renderItem={render_lpn_item}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="px-6 pb-2 flex-row justify-between items-center">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-500 text-xs uppercase tracking-[1px]"
                >
                  Scanned LPN List ({scanned_lpns.length})
                </Text>
                <TouchableOpacity
                  onPress={() => set_modal_visible(true)}
                  className="flex-row items-center bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100"
                >
                  <Keyboard size={14} color="#0284c7" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-700 text-[11px] ml-1"
                  >
                    Manual LPN
                  </Text>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              <View className="px-6 mt-4">
                {/* STORAGE LOCATION METRICS CONTAINER */}
                <View className="p-4 bg-white border border-slate-200 rounded-2xl mb-4 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-xs text-slate-700 uppercase tracking-wider"
                    >
                      Target Bin Location Assignment
                    </Text>
                  </View>

                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <Text className="text-[9px] font-bold text-slate-500 mb-1">
                        WAREHOUSE
                      </Text>
                      <Text className="text-sm font-black text-slate-800">
                        {warehouse_code || "---"}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <Text className="text-[9px] font-bold text-slate-500 mb-1">
                        STORAGE BIN
                      </Text>
                      <Text className="text-sm font-black text-slate-800">
                        {sbin_code || "---"}
                      </Text>
                    </View>
                  </View>

                  {/* BIN SCANNING ACTION BUTTON */}
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
              </View>
            }
          />
        )}
      </View>

      {/* FLOATING ACTION BOTTOM BAR */}
      {scanned_lpns.length > 0 && (
        <View className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-4 flex-row items-center space-x-3 gap-3">
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Clear Queue",
                "Are you sure you want to drop all currently scanned LPNs?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Yes, Clear All",
                    style: "destructive",
                    onPress: () => {
                      set_scanned_lpns([]);
                      set_warehouse_code("");
                      set_sbin_code("");
                    },
                  },
                ],
              );
            }}
            className="flex-1 bg-slate-100 py-4 rounded-2xl items-center"
          >
            <Text className="text-slate-600 font-bold">Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handle_bulk_transfer}
            disabled={!warehouse_code || !sbin_code}
            className={`flex-[2] py-4 rounded-2xl flex-row items-center justify-center ${
              !warehouse_code || !sbin_code ? "bg-sky-300" : "bg-sky-600"
            }`}
          >
            <CheckCircle2 size={18} color="#ffffff" />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white ml-2"
            >
              Transfer ({scanned_lpns.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MANUAL LPN ENTRY MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modal_visible}
        onRequestClose={() => set_modal_visible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/50 justify-center p-6"
        >
          <View className="bg-white rounded-[24px] p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-lg text-slate-900"
              >
                Manual LPN Entry
              </Text>
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_lpn_id("");
                }}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Manually type the License Plate Number (LPN) for bulk transfer
              list.
            </Text>

            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex-row items-center">
              <Barcode size={20} color="#94a3b8" />
              <TextInput
                ref={modal_input_ref}
                placeholder="Enter LPN ID..."
                placeholderTextColor="#94a3b8"
                value={manual_lpn_id}
                onChangeText={set_manual_lpn_id}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handle_manual_lpn_submit}
                className="flex-1 ml-3 text-slate-900 font-medium p-0"
              />
            </View>

            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_lpn_id("");
                }}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-600 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handle_manual_lpn_submit}
                disabled={loading || !manual_lpn_id.trim()}
                className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row ${
                  loading ? "bg-sky-400" : "bg-sky-600"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white"
                  >
                    Validate LPN
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL SCANNING WINDOW FOR BIN LOCATION */}
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

          <View className="bg-white w-full rounded-[30px] p-6 items-center max-w-sm shadow-2xl">
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
                    className="text-lg text-emerald-600 mt-2"
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

export default Bulk_Transfer;
