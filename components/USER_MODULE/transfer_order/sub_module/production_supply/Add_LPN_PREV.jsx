import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Vibration,
  SafeAreaView,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { firestore_db } from "../../../../../assets/scripts/firebase";
import {
  ChevronLeft,
  Trash2,
  Package,
  Layers,
  CheckCircle2,
  MapPin,
  QrCode,
  CircleX,
  Barcode,
} from "lucide-react-native";

const Add_LPN = ({ route, navigation }) => {
  const { user_data, to_number, selected_item, item_index } = route.params;

  const scanner_input_ref = useRef(null);
  const isFocused = useIsFocused();

  const [loading, set_loading] = useState(false);

  // Local state para sa na-scan na LPN list
  const [scanned_lpns, set_scanned_lpns] = useState(
    selected_item.lpn_list || [],
  );

  // Transfer status state
  const [current_status, set_current_status] = useState(
    selected_item.transfer_status || "Pending",
  );

  const [scan_input_text, set_scan_input_text] = useState("");

  // Kina-calculate ang kabuuang Picked Qty mula sa na-assign na LPNs
  const total_picked_qty = scanned_lpns.reduce(
    (acc, curr) => acc + Number(curr.qty_base || 0),
    0,
  );

  const target_qty = Number(
    selected_item.quantity || selected_item.req_qty || 0,
  );

  // Tukuyin kung na-reach o nalampasan na ang required quantity
  const is_qty_reached = total_picked_qty >= target_qty;

  // CONTINUOUS AUTO-FOCUS FOR DIRECT BARCODE SCANNING
  useEffect(() => {
    let focus_interval = null;
    if (isFocused) {
      focus_interval = setInterval(() => {
        scanner_input_ref.current?.focus();
      }, 500);
    }
    return () => {
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused]);

  // CONFIRM PICK: ATOMIC UPDATE TO FIRESTORE (Tagging Ref Fields & Substitute Status)
  const process_lpn_confirmation = async (
    fetched_lpn_data,
    is_substitute = false,
  ) => {
    set_loading(true);

    try {
      // 1. Get Transfer Order Reference
      const to_collection_ref = collection(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_TRANSFER_ORDER",
        "DATA",
      );
      const to_query = query(
        to_collection_ref,
        where("to_number", "==", to_number),
      );
      const to_snapshot = await getDocs(to_query);

      if (to_snapshot.empty)
        throw new Error(`Transfer Order ${to_number} not found.`);

      const to_doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_TRANSFER_ORDER",
        "DATA",
        to_snapshot.docs[0].id,
      );

      // 2. Inventory Ref
      const inv_doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        fetched_lpn_data.lpn_id,
      );

      // Automatic payload update with substitute flag
      const updated_lpn_payload = {
        ...fetched_lpn_data,
        is_substitute: is_substitute,
        to_number_ref: to_number,
        to_warehouse_code:
          selected_item.to_warehouse_code || selected_item.warehouse_code || "",
        to_sbin_code:
          selected_item.to_sbin_code || selected_item.sbin_code || "",
        to_picked_by: `${user_data?.first_name} ${user_data?.last_name}`,
      };

      const new_scanned_list = [...scanned_lpns, updated_lpn_payload];

      // Dynamic Status Check
      const new_picked_qty = new_scanned_list.reduce(
        (acc, c) => acc + Number(c.qty_base || 0),
        0,
      );

      const target_lpn_ref_count = Number(selected_item.lpn_quantity_ref || 0);

      let item_status = "Pending";
      if (
        (target_lpn_ref_count > 0 &&
          new_scanned_list.length >= target_lpn_ref_count) ||
        (target_qty > 0 && new_picked_qty >= target_qty)
      ) {
        item_status = "Picked";
      }

      // Execute Firestore Transaction
      await runTransaction(firestore_db, async (transaction) => {
        const to_snap = await transaction.get(to_doc_ref);
        if (!to_snap.exists()) throw new Error("TO record no longer exists.");

        const inv_snap = await transaction.get(inv_doc_ref);
        if (!inv_snap.exists()) throw new Error("LPN record no longer exists.");

        // Update Transfer Order List
        const current_to_data = to_snap.data();
        const updated_transfer_list = current_to_data.transfer_list.map(
          (item, idx) => {
            if (
              idx === item_index ||
              item.item_code === selected_item.item_code
            ) {
              return {
                ...item,
                lpn_list: new_scanned_list,
                transfer_status: item_status,
              };
            }
            return item;
          },
        );

        const today = new Date();
        const formatted_date = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-${today.getFullYear()}`;
        const formatted_time = today.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        transaction.update(to_doc_ref, {
          transfer_list: updated_transfer_list,
          update_date: formatted_date,
          update_time: formatted_time,
        });

        // Update inventory reference fields
        transaction.update(inv_doc_ref, {
          to_number_ref: to_number,
          to_warehouse_code:
            selected_item.to_warehouse_code ||
            selected_item.warehouse_code ||
            "",
          to_sbin_code:
            selected_item.to_sbin_code || selected_item.sbin_code || "",
          to_picked_by: `${user_data.first_name} ${user_data.last_name}`,
        });
      });

      // Update Local State UI
      set_scanned_lpns(new_scanned_list);
      set_current_status(item_status);

      if (route.params?.onReturn) {
        route.params.onReturn(new_scanned_list, item_status);
      }

      Vibration.vibrate(40);
    } catch (error) {
      console.error("Confirm LPN Error: ", error);
      Alert.alert(
        "Transaction Error",
        error.message || "Failed to process LPN.",
      );
    } finally {
      set_loading(false);
    }
  };

  // SEARCH, VALIDATE & AUTO CONFIRM LPN FROM FIRESTORE
  const handle_search_lpn = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;

    set_scan_input_text("");

    // 1. Check kung na-add na sa local session
    const is_already_scanned = scanned_lpns.some(
      (lpn) => lpn.lpn_id === clean_id,
    );
    if (is_already_scanned) {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert(
        "Duplicate Scan",
        `LPN ${clean_id} is already in the picked list.`,
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
        const fetched_data = doc_snap.data();

        // 2. VALIDATION: Check kung pareho ang item_code o magsisilbing substitute
        if (fetched_data.item_code !== selected_item.item_code) {
          Vibration.vibrate([100, 50, 100]);
          set_loading(false);

          Alert.alert(
            "Substitute Item Confirmation",
            `The scanned LPN item (${fetched_data.item_code}) does not match the target item (${selected_item.item_code}). Do you want to process this item as a substitute?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Confirm Substitute",
                onPress: () => process_lpn_confirmation(fetched_data, true),
              },
            ],
          );
          return;
        }

        // 3. AUTO CONFIRM: Exact match, no substitute flag (is_substitute = false)
        await process_lpn_confirmation(fetched_data, false);
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `LPN ${clean_id} does not exist in inventory.`,
        );
        set_loading(false);
      }
    } catch (e) {
      console.error("Search LPN Error: ", e);
      Alert.alert("Error", "Failed to search LPN in database.");
      set_loading(false);
    }
  };

  // REMOVE LPN & CLEAR REFERENCE FIELDS IN INVENTORY
  const handle_remove_lpn = (index) => {
    const item_to_remove = scanned_lpns[index];

    Alert.alert(
      "Remove LPN",
      `Are you sure you want to remove LPN ${item_to_remove.lpn_id}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            set_loading(true);
            try {
              const to_collection_ref = collection(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_TRANSFER_ORDER",
                "DATA",
              );
              const to_query = query(
                to_collection_ref,
                where("to_number", "==", to_number),
              );
              const to_snapshot = await getDocs(to_query);

              if (to_snapshot.empty) throw new Error("TO Document not found.");

              const to_doc_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_TRANSFER_ORDER",
                "DATA",
                to_snapshot.docs[0].id,
              );

              const inv_doc_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_INVENTORY_COUNT",
                "DATA",
                item_to_remove.lpn_id,
              );

              const new_scanned_list = scanned_lpns.filter(
                (_, i) => i !== index,
              );
              const new_status = "Pending";

              await runTransaction(firestore_db, async (transaction) => {
                const to_snap = await transaction.get(to_doc_ref);
                const inv_snap = await transaction.get(inv_doc_ref);

                if (!to_snap.exists()) throw new Error("TO Record missing.");

                const current_to_data = to_snap.data();
                const updated_transfer_list = current_to_data.transfer_list.map(
                  (item, idx) => {
                    if (
                      idx === item_index ||
                      item.item_code === selected_item.item_code
                    ) {
                      return {
                        ...item,
                        lpn_list: new_scanned_list,
                        transfer_status: new_status,
                      };
                    }
                    return item;
                  },
                );

                transaction.update(to_doc_ref, {
                  transfer_list: updated_transfer_list,
                });

                if (inv_snap.exists()) {
                  transaction.update(inv_doc_ref, {
                    to_number_ref: "",
                    to_warehouse_code: "",
                    to_sbin_code: "",
                    to_picked_by: "",
                  });
                }
              });

              set_scanned_lpns(new_scanned_list);
              set_current_status(new_status);

              if (route.params?.onReturn) {
                route.params.onReturn(new_scanned_list, new_status);
              }
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to remove LPN.");
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
      {/* INVISIBLE INPUT FOR CONTINUOUS HARDWARE SCANNER READS */}
      <TextInput
        ref={scanner_input_ref}
        className="w-0.5 h-0.5 opacity-0 absolute"
        value={scan_input_text}
        onChangeText={set_scan_input_text}
        onSubmitEditing={(e) => handle_search_lpn(e.nativeEvent.text)}
        autoFocus
        showSoftInputOnFocus={false}
      />

      {/* MATCHED TOP HEADER DESIGN */}
      <View className="mt-[55px] px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            LPN Allocation
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan barcode to add LPN
          </Text>
        </View>
        <Layers size={24} color="#0284c7" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50 px-4 pt-3">
        {/* ITEM DETAILS CARD */}
        <View className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-3">
          {/* TOP BAR: Item Index, Item Code, & Transfer Status */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-row items-center flex-1 pr-2">
              {/* 1. Item Index (No.) */}
              <View
                className={`px-2 py-0.5 rounded-md ${is_qty_reached ? "bg-emerald-100" : "bg-rose-100"}`}
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-xs ${is_qty_reached ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {item_index !== undefined ? item_index + 1 : 1}
                </Text>
              </View>
              {/* 2. Item Code */}
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-sm ml-2"
              >
                {selected_item.item_code}
              </Text>
            </View>

            {/* Status Badge */}
            <View
              className={`px-2.5 py-1 rounded-full ${
                current_status === "Picked" ? "bg-emerald-100" : "bg-rose-100"
              }`}
            >
              <Text
                className={`text-[9px] font-bold uppercase tracking-wide ${
                  current_status === "Picked"
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {current_status}
              </Text>
            </View>
          </View>

          {/* 3. Item Description */}
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs mb-3"
          >
            {selected_item.item_desc}
          </Text>

          {/* DETAILS GRID: Quantity, LPNs, Picked Qty & Destination */}
          <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 gap-2">
            {/* Requested Qty & Target LPNs */}
            <View className="flex-row justify-between items-center">
              {/* Requested Qty with UOM */}
              <View className="flex-row items-center">
                <Package size={14} color="#64748b" />
                <Text className="text-xs text-slate-500 ml-1.5">
                  Req Qty:{" "}
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-800"
                  >
                    {selected_item.quantity.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    }) || 0}{" "}
                    {selected_item.uom_base || selected_item.uom}
                  </Text>
                </Text>
              </View>

              {/* Target LPNs & Assigned LPN Count */}
              <View className="flex-row items-center">
                <QrCode size={14} color="#64748b" />
                <Text className="text-xs text-slate-500 ml-1.5">
                  LPNs:{" "}
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className={`${is_qty_reached ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {scanned_lpns.length}
                  </Text>{" "}
                  {selected_item.lpn_quantity_ref !== 0 &&
                    `/ ${selected_item.lpn_quantity_ref}`}
                </Text>
              </View>
            </View>

            {/* Picked Qty (Dynamic Color Changes between rose and emerald) */}
            <View className="flex-row items-center border-t border-slate-200/60 pt-2">
              {is_qty_reached ? (
                <CheckCircle2 size={14} color={"#10b981"} />
              ) : (
                <CircleX size={14} color={"#e11d48"} />
              )}
              <Text className="text-xs text-slate-500 ml-1.5">
                Picked Qty:{" "}
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={
                    is_qty_reached ? "text-emerald-600" : "text-rose-600"
                  }
                >
                  {total_picked_qty}{" "}
                  {selected_item.uom_base || selected_item.uom}
                </Text>
              </Text>
            </View>

            {/* Destination */}
            <View className="flex-row items-center border-t border-slate-200/60 pt-2">
              <MapPin size={14} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-1.5">
                Destination:{" "}
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-800"
                >
                  {selected_item.to_warehouse_code ||
                    selected_item.warehouse_code ||
                    "N/A"}{" "}
                  {selected_item.to_sbin_code ||
                    selected_item.sbin_code ||
                    "N/A"}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ASSIGNED LPN LIST HEADER */}
        <View className="mb-2">
          <Text className="text-sm font-semibold text-slate-600">
            Assigned LPN List ({scanned_lpns.length})
          </Text>
        </View>

        {/* ASSIGNED LPN FLATLIST */}
        <FlatList
          data={scanned_lpns}
          keyExtractor={(item, idx) => item.lpn_id + idx}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <View className="bg-white p-3.5 rounded-xl border border-slate-200/90 mb-2.5 shadow-sm">
              {/* TOP ROW: LPN ID & Delete Button */}
              <View className="flex-row justify-between items-center pb-2 border-b border-slate-100">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm text-slate-500 ml-1">LPN:</Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sm text-slate-800"
                  >
                    {item.lpn_id && item.lpn_id.length > 32
                      ? `${item.lpn_id.slice(0, 32)}...`
                      : item.lpn_id}
                  </Text>
                </View>

                {/* Retained Trash Button */}
                <TouchableOpacity
                  className="bg-red-50 p-2 rounded-lg"
                  onPress={() => handle_remove_lpn(index)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>

              {/* BOTTOM CONTENT: Item Code, Qty, & Location */}
              <View className="mt-2.5 gap-1.5">
                {/* Item Code & Qty/UOM */}
                <View className="flex-row justify-between items-center">
                  <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-xs text-slate-700"
                    >
                      {item.item_code}
                    </Text>
                  </View>

                  <Text className="text-xs text-slate-500">
                    Qty:{" "}
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-sky-700 text-xs"
                    >
                      {item.qty_base} {item.uom_base}
                    </Text>
                  </Text>
                </View>

                {/* Location */}
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-xs text-slate-500 ml-1">
                    Location:{" "}
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-slate-800"
                    >
                      {item.warehouse_code} {item.sbin_code}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="flex-1 mt-10 justify-center items-center px-10">
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
                Please point your scanner at the LPN QR code to add it on the
                list.
              </Text>
            </View>
          }
        />
      </View>

      {/* LOADING OVERLAY */}
      {loading && (
        <View className="absolute inset-0 bg-white/70 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Add_LPN;
