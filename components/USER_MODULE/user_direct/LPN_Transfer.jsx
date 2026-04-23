import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  PackageCheck,
  X,
  Keyboard,
  Box,
  MapPin,
  Trash2,
  ScanBarcode,
} from "lucide-react-native";
import { item_master_list } from "@assets/data/item_master/item_master_list";

// FIREBASE
import { firestore_db } from "@assets/scripts/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch, // Idagdag ito
  deleteField, // Idagdag ito para malinis ang temporary fields
} from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";
import { sbin_list } from "@assets/data/storage_bin_master/sbin_list";

const LPN_Transfer = ({ navigation, route }) => {
  const { user_data, transaction_id, existing_data } = route.params || {};
  const scanner_input_ref = useRef(null);

  // BIN DESTINATION STATES
  const bin_scanner_ref = useRef(null);
  const [is_bin_modal_visible, set_is_bin_modal_visible] = useState(false);
  const [is_manual_bin, set_is_manual_bin] = useState(false);
  const [bin_input_value, set_bin_input_value] = useState("");
  const [processing_lpn_id, set_processing_lpn_id] = useState(null);

  // STATES
  const [scanned_value, set_scanned_value] = useState("");
  const [is_manual_modal, set_is_manual_modal] = useState(false);
  const [is_pick_modal, set_is_pick_modal] = useState(false);

  const [loading, set_loading] = useState(false);
  const [found_lpn_data, set_found_lpn_data] = useState(null);
  const [pick_qty, set_pick_qty] = useState("");

  const is_completed = existing_data?.status === "Completed";

  // LIST NG MGA NA-PICK NA LPN (Galing sa Firestore existing data)
  const [picked_lpns, set_picked_lpns] = useState(
    existing_data?.selected_lpn_list || [],
  );

  // AUTO-FOCUS para sa Scanner Gun
  useEffect(() => {
    const focus_interval = setInterval(() => {
      if (!is_manual_modal && !is_pick_modal && !is_bin_modal_visible) {
        scanner_input_ref.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focus_interval);
  }, [is_manual_modal, is_pick_modal, is_bin_modal_visible]);

  const handle_search_lpn = async (lpn_id) => {
    if (!lpn_id) return;
    const clean_id = lpn_id.trim().toUpperCase();

    // Check kung nasa listahan na locally
    if (picked_lpns.find((item) => item.lpn_id === clean_id)) {
      Alert.alert(
        "Already Added",
        "This LPN is already in your transfer list.",
      );
      set_scanned_value("");
      return;
    }

    set_loading(true);
    try {
      const lpn_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_MASTER",
        "DATA",
        clean_id,
      );
      const lpn_snap = await getDoc(lpn_ref);

      if (lpn_snap.exists()) {
        const data = lpn_snap.data();

        if (data.lpn_status !== "Available") {
          Alert.alert(
            "LPN Not Available",
            `Current status: ${data.lpn_status}`,
          );
          return;
        }

        set_found_lpn_data({ ...data, id: clean_id });
        set_pick_qty(data.qty_base.toString());
        set_is_pick_modal(true);
        set_is_manual_modal(false);
      } else {
        Vibration.vibrate([100, 100]);
        Alert.alert(
          "Not Found",
          `LPN ${clean_id} does not exist in inventory.`,
        );
      }
    } catch (error) {
      console.error("Search Error:", error);
      Alert.alert("Error", "Failed to connect to database.");
    } finally {
      set_loading(false);
      set_scanned_value("");
    }
  };

  const handle_confirm_pick = async () => {
    const qty_to_pick = parseFloat(pick_qty);

    if (
      isNaN(qty_to_pick) ||
      qty_to_pick <= 0 ||
      qty_to_pick > found_lpn_data.qty_base
    ) {
      Alert.alert(
        "Invalid Quantity",
        "Please check the quantity before confirming.",
      );
      return;
    }

    set_loading(true);
    const timestamp = format_date(get_date_now());

    try {
      const item_def = item_master_list.find(
        (m) => m.item_code === found_lpn_data.item_code,
      );
      const multiplier = item_def?.conversion?.[found_lpn_data.uom_base] || 1;
      const qty_base_transfer = qty_to_pick * multiplier;

      // 1. Data Object para sa selected_lpn_list (Transaction Table)
      const lpn_entry = {
        ...found_lpn_data, // Lahat ng fields galing sa TBL_INVENTORY_MASTER
        qty_display_transfer: qty_to_pick,
        qty_base_transfer: qty_base_transfer,
        target_bin: "", // Placeholder para sa scan destination
        status: "In Transit",
        picked_at: timestamp,
        // Siguraduhin na ang lpn_id ay tama (kung ang firestore ID ay iba sa lpn_id field)
        lpn_id: found_lpn_data.lpn_id || found_lpn_data.id,
      };

      // 2. Update TBL_USER_DIRECT_TRANSFER (Header)
      const header_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_USER_DIRECT_TRANSFER",
        "DATA",
        transaction_id,
      );
      await updateDoc(header_ref, {
        selected_lpn_list: arrayUnion(lpn_entry),
        total_lpn: increment(1),
      });

      // 3. Update TBL_INVENTORY_MASTER (Dito natin nilagay ang missing fields)
      const master_lpn_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_MASTER",
        "DATA",
        found_lpn_data.id,
      );
      await updateDoc(master_lpn_ref, {
        lpn_status: "In Transit",
        qty_display_transfer: qty_to_pick,
        qty_base_transfer: qty_base_transfer,
        last_updated_by: user_data?.username || "SYSTEM",
        last_updated_date: timestamp,
      });

      // 4. Update Local State
      set_picked_lpns([...picked_lpns, lpn_entry]);

      Vibration.vibrate(100);
      set_is_pick_modal(false);
      set_found_lpn_data(null);
      set_pick_qty("");
    } catch (error) {
      console.error("Confirm Pick Error:", error);
      Alert.alert("Error", "Failed to update LPN records.");
    } finally {
      set_loading(false);
    }
  };

  const validate_and_drop = async (scanned_bin) => {
    if (!scanned_bin) return;
    const clean_bin = scanned_bin.trim().toUpperCase();

    // 1. I-validate kung existing ang bin sa sbin_list
    const bin_info = sbin_list.find(
      (b) => b.sbin_code.toUpperCase() === clean_bin,
    );

    if (!bin_info) {
      Vibration.vibrate(200);
      Alert.alert("Invalid Bin", `Bin: ${clean_bin} is not existing.`);
      return;
    }

    set_loading(true);
    try {
      const header_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_USER_DIRECT_TRANSFER",
        "DATA",
        transaction_id,
      );

      // 2. I-update ang local state gamit ang impormasyon mula sa bin_info
      const updated_list = picked_lpns.map((item) =>
        item.lpn_id === processing_lpn_id
          ? {
              ...item,
              target_bin: bin_info.sbin_code, // Maintain pa rin natin ito for legacy logic if needed
              to_plant_code: bin_info.plant_code,
              to_warehouse_code: bin_info.warehouse_code,
              to_sloc_code: bin_info.sloc_code,
              to_sbin_code: bin_info.sbin_code,
              to_stype_code: bin_info.stype_code,
            }
          : item,
      );

      // 3. Update Firestore Header
      await updateDoc(header_ref, {
        selected_lpn_list: updated_list,
      });

      set_picked_lpns(updated_list);
      Vibration.vibrate(70);
      set_bin_input_value("");
      set_is_bin_modal_visible(false);
      set_processing_lpn_id(null);
      set_is_manual_bin(false);
    } catch (error) {
      console.error("Drop-off Error:", error);
      Alert.alert("Error", "Failed to update bin destination.");
    } finally {
      set_loading(false);
    }
  };

  const remove_item = async (lpn_id) => {
    Alert.alert(
      "Remove LPN",
      "Are you sure you want to remove this LPN from the transfer list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            set_loading(true);
            try {
              const item_to_remove = picked_lpns.find(
                (l) => l.lpn_id === lpn_id,
              );
              const header_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_USER_DIRECT_TRANSFER",
                "DATA",
                transaction_id,
              );
              await updateDoc(header_ref, {
                selected_lpn_list: arrayRemove(item_to_remove),
                total_lpn: increment(-1),
              });
              const master_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_INVENTORY_MASTER",
                "DATA",
                lpn_id,
              );
              await updateDoc(master_ref, {
                lpn_status: "Available",
              });

              set_picked_lpns((prev) =>
                prev.filter((l) => l.lpn_id !== lpn_id),
              );
            } catch (e) {
              console.log(e);
            } finally {
              set_loading(false);
            }
          },
        },
      ],
    );
  };

  const handle_finalize_transfer = async () => {
    // 1. Validation
    const incomplete = picked_lpns.some((lpn) => !lpn.target_bin);
    if (incomplete) {
      Alert.alert(
        "Incomplete Destination",
        "Please scan a destination bin for all LPNs.",
      );
      return;
    }

    Alert.alert(
      "Confirm Transfer",
      `Are you sure you want to transfer ${picked_lpns.length} LPN(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: async () => {
            set_loading(true);
            const batch = writeBatch(firestore_db);
            const timestamp = format_date(get_date_now());

            try {
              for (const lpn of picked_lpns) {
                const original_lpn_ref = doc(
                  firestore_db,
                  "DB1_ERP_SYSTEM",
                  "TBL_INVENTORY_MASTER",
                  "DATA",
                  lpn.lpn_id,
                );

                const is_full_transfer = lpn.qty_base === lpn.qty_base_transfer;

                // --- DATA CLEANING TECHIQUE ---
                // Hiwalayin ang 'Master fields' sa 'Transfer fields'
                const {
                  qty_base_transfer,
                  qty_display_transfer,
                  target_bin,
                  status,
                  picked_at,
                  to_plant_code,
                  to_warehouse_code,
                  to_sloc_code,
                  to_sbin_code,
                  to_stype_code,
                  id, // Huwag isama ang document ID sa loob ng fields
                  ...clean_master_data
                } = lpn;

                if (is_full_transfer) {
                  // CASE 1: FULL TRANSFER
                  batch.update(original_lpn_ref, {
                    // I-update sa bagong location
                    plant_code: lpn.to_plant_code,
                    warehouse_code: lpn.to_warehouse_code,
                    sloc_code: lpn.to_sloc_code,
                    sbin_code: lpn.to_sbin_code,
                    stype_code: lpn.to_stype_code,
                    lpn_status: "Available",
                    last_updated_by: user_data?.username || "SYSTEM",
                    last_updated_date: timestamp,
                    // Tanggalin ang lahat ng temporary fields
                    qty_base_transfer: deleteField(),
                    qty_display_transfer: deleteField(),
                    qty_display: deleteField(),
                    target_bin: deleteField(),
                    status: deleteField(),
                    picked_at: deleteField(),
                    to_plant_code: deleteField(),
                    to_warehouse_code: deleteField(),
                    to_sloc_code: deleteField(),
                    to_sbin_code: deleteField(),
                    to_stype_code: deleteField(),
                  });
                } else {
                  // CASE 2: PARTIAL TRANSFER (Split LPN)

                  // A. Update Original LPN (Maiiwan sa lumang bin)
                  const remaining_qty = lpn.qty_base - lpn.qty_base_transfer;
                  batch.update(original_lpn_ref, {
                    qty_base: remaining_qty,
                    lpn_status: "Available",
                    last_updated_by: user_data?.username || "SYSTEM",
                    last_updated_date: timestamp,
                    // Tanggalin din ang temporary fields dito
                    qty_base_transfer: deleteField(),
                    qty_display_transfer: deleteField(),
                    target_bin: deleteField(),
                    status: deleteField(),
                    picked_at: deleteField(),
                  });

                  // B. Create New LPN Record
                  const now = new Date();
                  const new_lpn_id = now
                    .toISOString()
                    .replace(/[-T:.Z]/g, "")
                    .slice(0, 14);
                  const new_lpn_ref = doc(
                    firestore_db,
                    "DB1_ERP_SYSTEM",
                    "TBL_INVENTORY_MASTER",
                    "DATA",
                    new_lpn_id,
                  );

                  batch.set(new_lpn_ref, {
                    ...clean_master_data, // Isasama lang nito ang batch_code, item_code, etc.
                    lpn_id: new_lpn_id,
                    qty_base: lpn.qty_base_transfer,
                    plant_code: lpn.to_plant_code,
                    warehouse_code: lpn.to_warehouse_code,
                    sloc_code: lpn.to_sloc_code,
                    sbin_code: lpn.to_sbin_code,
                    stype_code: lpn.to_stype_code,
                    lpn_status: "Available",
                    last_updated_by: user_data?.username || "SYSTEM",
                    last_updated_date: timestamp,
                    creation_date: timestamp,
                  });
                }
              }

              // Update Header Status
              const header_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_USER_DIRECT_TRANSFER",
                "DATA",
                transaction_id,
              );
              batch.update(header_ref, {
                status: "Completed",
                completed_at: timestamp,
              });

              await batch.commit();
              Vibration.vibrate([100, 100]);
              Alert.alert("Success", "Transfer completed successfully!", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Finalize Error:", error);
              Alert.alert("Error", "Failed to finalize transfer.");
            } finally {
              set_loading(false);
            }
          },
        },
      ],
    );
  };

  const open_bin_modal = (lpn_id) => {
    set_processing_lpn_id(lpn_id);
    set_is_bin_modal_visible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/50 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      <TextInput
        ref={scanner_input_ref}
        value={scanned_value}
        onChangeText={set_scanned_value}
        onSubmitEditing={() => handle_search_lpn(scanned_value)}
        showSoftInputOnFocus={false}
        style={{ position: "absolute", opacity: 0 }}
      />

      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-xl text-slate-900"
          >
            LPN Transfer
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-500 text-xs uppercase tracking-wider"
          >
            {transaction_id} • {picked_lpns.length} Collected
          </Text>
        </View>
        {!is_completed && (
          <TouchableOpacity
            onPress={() => set_is_manual_modal(true)}
            className="bg-slate-100 p-2 rounded-lg"
          >
            <Keyboard size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        className="bg-slate-50"
      >
        {picked_lpns.length === 0 ? (
          <View className="items-center py-10 bg-slate-100 rounded-[32px] border border-slate-200 border-dashed">
            <View className="bg-sky-100 p-6 rounded-full mb-4">
              <Barcode size={48} color="#0284c7" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-800 text-lg"
            >
              Ready to Scan
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center px-10 mt-2"
            >
              Scan the LPN barcode or use manual entry to start the pick process
              for this transfer.
            </Text>
            <TouchableOpacity
              onPress={() => set_is_manual_modal(true)}
              className="mt-8 flex-row items-center bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm"
            >
              <Keyboard size={18} color="#64748b" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-600 ml-2"
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {picked_lpns.map((item, index) => (
              <View
                key={index}
                className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm"
              >
                <View className="flex-row justify-between items-center mb-4">
                  <View className="bg-sky-100 px-3 py-1 rounded-lg">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-sky-700 text-xs tracking-widest"
                    >
                      {item.lpn_id}
                    </Text>
                  </View>
                  {!is_completed && (
                    <TouchableOpacity onPress={() => remove_item(item.lpn_id)}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-900 text-base"
                >
                  {item.item_code}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-500 text-xs mb-4"
                >
                  {item.item_desc}
                </Text>

                <View className="flex-row items-center justify-between bg-slate-50 p-3 rounded-xl mb-2">
                  <View>
                    <Text className="text-[10px] text-slate-400 font-[Outfit-Bold] uppercase">
                      From Bin
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-700"
                    >
                      {item.sbin_code}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-slate-400 font-[Outfit-Bold] uppercase">
                      Transfer Qty
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-sky-700"
                    >
                      {item.qty_display_transfer} {item.uom_base}
                    </Text>
                  </View>
                </View>

                {item.target_bin ? (
                  <View className="flex-row items-center justify-between bg-green-50 p-3 rounded-xl mb-4 border border-green-200">
                    <View>
                      <Text className="text-[10px] text-green-600 font-[Outfit-Bold] uppercase">
                        To Bin
                      </Text>
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-green-800"
                      >
                        {item.target_bin}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="bg-green-200 px-2 py-0.5 rounded-md">
                        <Text className="text-[8px] text-green-700 font-[Outfit-Bold] uppercase tracking-wider">
                          {is_completed ? "Transfered" : "Ready"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {!is_completed && (
                  <TouchableOpacity
                    className={`${item.target_bin ? "bg-green-600" : "bg-sky-600"} py-4 rounded-xl flex-row items-center justify-center`}
                    onPress={() => open_bin_modal(item.lpn_id)}
                  >
                    {item.target_bin ? (
                      <>
                        <MapPin size={16} color="white" />
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-white text-xs ml-2 uppercase tracking-wider"
                        >
                          Change Bin Destination
                        </Text>
                      </>
                    ) : (
                      <>
                        <ScanBarcode size={16} color="white" />
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-white text-xs ml-2 uppercase tracking-wider"
                        >
                          Scan Bin Destination
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FOOTER ACTION */}
      {picked_lpns.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100">
          {is_completed ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-1 bg-gray-100 py-4 border border-slate-200 rounded-lg justify-center items-center"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-500"
              >
                Go Back
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handle_finalize_transfer}
              className="bg-sky-600 py-5 rounded-xl items-center justify-center"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg"
              >
                Confirm Transfer
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* PICK MODAL */}
      <Modal visible={is_pick_modal} animationType="fade" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 shadow-2xl">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <View className="bg-sky-100 self-start px-3 py-1 rounded-full mb-2">
                  <Text className="text-sky-700 text-[10px] font-[Outfit-Bold] uppercase tracking-wider">
                    LPN Picking
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-2xl text-slate-700"
                >
                  LPN: {found_lpn_data?.id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set_is_pick_modal(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4 mb-8">
              <View className="flex-row items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <Box size={24} color="#0284c7" />
                <View className="ml-4">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-800"
                  >
                    {found_lpn_data?.item_code}
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-slate-500 text-xs"
                  >
                    {found_lpn_data?.item_desc}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 mr-2">
                  <Text className="text-[10px] text-slate-400 font-[Outfit-Bold] uppercase mb-1">
                    Current Bin
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-700"
                  >
                    {found_lpn_data?.sbin_code}
                  </Text>
                </View>
                <View className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 ml-2">
                  <Text className="text-[10px] text-slate-400 font-[Outfit-Bold] uppercase mb-1">
                    Max Available
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-700"
                  >
                    {found_lpn_data?.qty_base} {found_lpn_data?.uom_base}
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-700 mb-2 ml-1"
            >
              Quantity to Pick
            </Text>
            <View className="bg-slate-100 border border-slate-200 rounded-xl px-5 mb-8 flex-row items-center">
              <TextInput
                className="flex-1 py-5 text-2xl font-[Outfit-Bold] text-slate-700"
                placeholder="0"
                keyboardType="numeric"
                value={pick_qty}
                onChangeText={set_pick_qty}
                selectTextOnFocus
              />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-400"
              >
                {found_lpn_data?.uom_base}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handle_confirm_pick}
              className="bg-sky-600 py-5 rounded-xl flex-row items-center justify-center shadow-lg shadow-sky-200"
            >
              <PackageCheck size={22} color="white" />
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

      {/* MANUAL ENTRY MODAL */}
      <Modal visible={is_manual_modal} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-slate-900/60 justify-center px-6"
        >
          <View className="bg-white rounded-3xl p-8">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xl text-slate-900 mb-6"
            >
              Manual LPN Entry
            </Text>
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 mb-6">
              <TextInput
                placeholder="Enter LPN ID"
                className="py-4 text-lg font-[Outfit-Medium]"
                autoFocus
                autoCapitalize="characters"
                value={scanned_value}
                onChangeText={set_scanned_value}
                onSubmitEditing={() => handle_search_lpn(scanned_value)}
              />
            </View>
            <View className="flex-row gap-4 space-x-3">
              <TouchableOpacity
                onPress={() => handle_search_lpn(scanned_value)}
                className="flex-1 bg-sky-600 py-4 rounded-lg justify-center items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white"
                >
                  Search LPN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => set_is_manual_modal(false)}
                className="flex-1 bg-gray-100 py-4 border border-slate-200 rounded-lg justify-center items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-500"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
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
                Current Target Bin
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-900 text-3xl"
              >
                {picked_lpns.find((l) => l.lpn_id === processing_lpn_id)
                  ?.target_bin || "---"}
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
                  <ScanBarcode size={48} color="#0284c7" />
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
    </SafeAreaView>
  );
};

export default LPN_Transfer;
