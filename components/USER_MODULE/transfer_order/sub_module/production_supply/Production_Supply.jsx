import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Barcode,
  History,
  Keyboard,
  X,
  FileText,
  User,
  Package,
  MapPin,
  Layers,
  ChevronRight,
  CheckCircle2,
  CircleX,
  QrCode, // Idinagdag para sa short-quantity state indication
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

import { firestore_db } from "@assets/scripts/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Helper function para sa date formatting: MM-DD-YYYY hh:mm AM/PM
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const strHours = String(hours).padStart(2, "0");

  return `${month}-${day}-${year} ${strHours}:${minutes} ${ampm}`;
};

const Production_Supply = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);
  const modal_input_ref = useRef(null);
  const isFocused = useIsFocused();

  const [loading, set_loading] = useState(false);
  const [to_data, set_to_data] = useState(null);

  // MODAL STATES
  const [modal_visible, set_modal_visible] = useState(false);
  const [manual_to_id, set_manual_to_id] = useState("");

  // CONTINUOUS AUTO-FOCUS PARA SA RF GUN (Basta sarado ang modal)
  useEffect(() => {
    let focus_interval = null;

    if (isFocused && !modal_visible) {
      focus_interval = setInterval(() => {
        scanner_input_ref.current?.focus();
      }, 1000);
    }

    return () => {
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused, modal_visible]);

  // Autofocus sa text input sa loob ng modal kapag binuksan
  useEffect(() => {
    if (modal_visible) {
      setTimeout(() => {
        modal_input_ref.current?.focus();
      }, 150);
    }
  }, [modal_visible]);

  const handle_search = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;

    set_loading(true);
    Vibration.vibrate(50);

    try {
      const data_collection_ref = collection(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_TRANSFER_ORDER",
        "DATA",
      );

      const q = query(data_collection_ref, where("to_number", "==", clean_id));
      const query_snapshot = await getDocs(q);

      if (!query_snapshot.empty) {
        const first_doc = query_snapshot.docs[0];
        set_to_data(first_doc.data());

        set_modal_visible(false);
        set_manual_to_id("");
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `Transfer Order ${clean_id} does not exist in the records.`,
        );
      }
    } catch (e) {
      console.error("Search TO Error: ", e);
      Alert.alert("Error", "Failed to fetch Transfer Order information.");
    } finally {
      set_loading(false);
    }
  };

  const handle_manual_submit = () => {
    const clean_id = manual_to_id.trim();
    if (!clean_id) {
      Alert.alert("Validation Error", "Please enter a valid TO Number.");
      return;
    }
    handle_search(clean_id);
  };

  // HANDLER KAPAG PININDOT ANG ISANG ITEM SA LISTAHAN
  const handle_item_press = (selected_item, index) => {
    Vibration.vibrate(30);

    navigation.navigate("add_lpn", {
      user_data: user_data,
      to_number: to_data.to_number,
      selected_item: selected_item,
      item_index: index,
      onReturn: (updatedLpnList, updatedStatus) => {
        set_to_data((prevToData) => {
          if (!prevToData) return null;

          const updatedItems = prevToData.transfer_list.map((item, idx) => {
            if (idx === index) {
              return {
                ...item,
                lpn_list: updatedLpnList,
                // I-update ang status kung naipasa mula sa Add_LPN screen
                transfer_status: updatedStatus || item.transfer_status,
              };
            }
            return item;
          });

          // I-check kung "Picked" na lahat ng items para sa buong TO Status
          const all_picked = updatedItems.every(
            (item) => item.transfer_status === "Picked",
          );

          return {
            ...prevToData,
            transfer_list: updatedItems,
            to_status: all_picked ? "Completed" : prevToData.to_status,
          };
        });
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      {/* HIDDEN SCANNER INPUT PARA SA RF GUN */}
      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_search(code);
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
            Production Supply
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan TO QR code or enter details manually
          </Text>
        </View>
        <Search size={24} color="#0284c7" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50">
        {!to_data ? (
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
              Please point your RF Gun scanner at the TO QR code or use manual
              search.
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
                Manual Search TO
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* TO DATA DISPLAY */
          <ScrollView
            className="flex-1 py-6"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER CARD */}
            <View className="bg-white mx-6 p-6 rounded-2xl border border-slate-300 mb-4 shadow-sm">
              {/* 1. TO NUMBER & 4. TO STATUS */}
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 pr-2">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-[10px] uppercase tracking-[1px] mb-1"
                  >
                    TO Number
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sm text-slate-900"
                  >
                    {to_data.to_number}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  className={`px-3.5 py-1.5 rounded-full ${
                    to_data.to_status === "Complete"
                      ? "bg-emerald-100"
                      : "bg-amber-100"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      to_data.to_status === "Complete"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {to_data.to_status || "Pending"}
                  </Text>
                </View>
              </View>

              {/* MOVEMENT TYPE & 3. REQUESTED BY */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <FileText size={16} color="#0284c7" className="mb-1" />
                  <Text className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    Movement Type
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-900 text-xs mt-0.5"
                    numberOfLines={2}
                  >
                    {to_data.move_type_desc || "N/A"}
                  </Text>
                </View>

                <View className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <User size={16} color="#f59e0b" className="mb-1" />
                  <Text className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    Requested By
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-900 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {to_data.created_by || "N/A"}
                  </Text>
                </View>
              </View>

              {/* 2. CREATION DATE */}
              <View className="border-t border-slate-100 pt-3 flex-row justify-between items-center">
                <Text className="text-slate-400 text-xs font-medium">
                  Date Needed:
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-700 text-xs"
                >
                  {formatDate(to_data.creation_date)}
                </Text>
              </View>
            </View>

            {/* 5. SCROLLABLE TRANSFER LIST SECTION */}
            <View className="mx-6 mb-3 mt-2 flex-row justify-between items-center">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-md uppercase tracking-wider"
              >
                Transfer List ({to_data.transfer_list?.length || 0})
              </Text>
              <Package size={18} color="#64748b" />
            </View>

            {/* CARDS LIST */}
            <View className="mx-6 space-y-3 mb-6 gap-3">
              {to_data.transfer_list &&
                to_data.transfer_list.map((item, index) => {
                  const assigned_lpn_count = item.lpn_list?.length || 0;
                  const target_lpn_count = item.lpn_quantity_ref || 0;

                  // Computation ng summation ng qty_base sa lpn_list
                  const picked_qty =
                    item.lpn_list?.reduce(
                      (acc, curr) => acc + (Number(curr.qty_base) || 0),
                      0,
                    ) || 0;

                  // Dynamic Check: Nareach ba ang required items quantity?
                  const is_qty_reached = picked_qty >= item.quantity;

                  // Color styling base sa conditional condition (is_qty_reached)
                  let border_color = is_qty_reached
                    ? "border-emerald-400"
                    : "border-rose-400";
                  let status_bg = is_qty_reached
                    ? "bg-emerald-100"
                    : "bg-rose-100";
                  let status_text = is_qty_reached
                    ? "text-emerald-700"
                    : "text-rose-700";

                  // Determine Status label text
                  let current_status = item.transfer_status || "Pending";
                  if (
                    current_status !== "Complete" &&
                    assigned_lpn_count >= target_lpn_count &&
                    target_lpn_count > 0
                  ) {
                    current_status = "Picked";
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => handle_item_press(item, index)}
                      className={`bg-white p-4 rounded-2xl border ${border_color} shadow-sm`}
                    >
                      {/* TOP BAR: Item Index, Item Code, & Transfer Status */}
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center flex-1 pr-2 space-x-2">
                          {/* 1. No. (Index) */}
                          <View
                            className={`px-2 py-0.5 rounded-md ${is_qty_reached ? "bg-emerald-100" : "bg-rose-100"}`}
                          >
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className={`text-xs ${is_qty_reached ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {index + 1}
                            </Text>
                          </View>
                          {/* 2. Item Code */}
                          <Text
                            style={{ fontFamily: "Outfit-Bold" }}
                            className="text-slate-900 text-sm ml-1.5"
                          >
                            {item.item_code}
                          </Text>
                        </View>

                        {/* 8. Transfer Status Badge */}
                        <View
                          className={`px-2.5 py-1 rounded-full ${status_bg}`}
                        >
                          <Text
                            className={`text-[9px] font-bold uppercase tracking-wide ${status_text}`}
                          >
                            {current_status}
                          </Text>
                        </View>
                      </View>

                      {/* 3. Item Desc */}
                      <Text
                        style={{ fontFamily: "Outfit-Regular" }}
                        className="text-slate-500 text-xs mb-3"
                      >
                        {item.item_desc}
                      </Text>

                      {/* DETAILS GRID: Quantity, LPNs, Picked Qty & Destination */}
                      <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 gap-2">
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
                                {item.quantity.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {item.uom}
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
                                {assigned_lpn_count}
                              </Text>{" "}
                              {target_lpn_count !== 0 &&
                                `/ ${target_lpn_count}`}
                            </Text>
                          </View>
                        </View>

                        {/* Picked Qty with Dynamic Icon & Style */}
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
                                is_qty_reached
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }
                            >
                              {picked_qty} {item.uom}
                            </Text>
                          </Text>
                        </View>

                        {/* Destination - Icon color updated to Sky (#0284c7) */}
                        <View className="flex-row items-center border-t border-slate-200/60 pt-2">
                          <MapPin size={14} color="#64748b" />
                          <Text className="text-xs text-slate-500 ml-1.5">
                            Destination:{" "}
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className="text-slate-800"
                            >
                              {item.warehouse_code || "N/A"}{" "}
                              {item.sbin_code || "N/A"}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      {/* CLICK INDICATOR FOOTER */}
                      <View className="flex-row items-center justify-end mt-2 pt-1">
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-[11px] text-slate-500 mr-0.5"
                        >
                          Tap to Manage LPNs
                        </Text>
                        <ChevronRight size={14} color="#64748b" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* ACTION BUTTONS */}
            <View className="px-6 space-y-3 mb-10 gap-3">
              <TouchableOpacity
                onPress={() => set_to_data(null)}
                activeOpacity={0.7}
                className="bg-white border border-slate-300 py-4 rounded-2xl items-center flex-row justify-center"
              >
                <Barcode size={20} color="#64748b" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="ml-2 text-slate-600"
                >
                  Scan Another TO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => set_modal_visible(true)}
                activeOpacity={0.7}
                className="bg-sky-50 border border-sky-200 px-6 py-4 rounded-2xl flex-row justify-center items-center"
              >
                <Keyboard size={18} color="#0284c7" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-sky-700 text-sm ml-2"
                >
                  Manual Search TO
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ================= MANUAL INPUT MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modal_visible}
        onRequestClose={() => set_modal_visible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View className="bg-white rounded-[24px] p-6 shadow-xl">
            {/* MODAL HEADER */}
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-lg text-slate-900"
              >
                Manual TO Lookup
              </Text>
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_to_id("");
                }}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Enter the exact Transfer Order (TO) number (e.g.,
              TO-20260727-1722038400000).
            </Text>

            {/* INPUT FIELD */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex-row items-center">
              <Barcode size={20} color="#94a3b8" />
              <TextInput
                ref={modal_input_ref}
                placeholder="Enter TO Number..."
                placeholderTextColor="#94a3b8"
                value={manual_to_id}
                onChangeText={set_manual_to_id}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handle_manual_submit}
                className="flex-1 ml-3 text-slate-900 font-medium p-0"
              />
            </View>

            {/* BUTTON CONTROLS */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_to_id("");
                }}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-600 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handle_manual_submit}
                disabled={loading || !manual_to_id.trim()}
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
                    Search TO
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Production_Supply;
