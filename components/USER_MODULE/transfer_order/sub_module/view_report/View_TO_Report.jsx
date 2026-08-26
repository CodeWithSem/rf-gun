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
  Keyboard,
  X,
  FileText,
  User,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Send,
  Layers,
  Cpu,
  Eye,
  SquareArrowUp,
  SquareArrowDown,
  PackageMinus,
  PackagePlus,
  ChevronRight,
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
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");

  return `${month}-${day}-${year} ${strHours}:${minutes} ${ampm}`;
};

const View_TO_Report = ({ navigation, route }) => {
  const scanner_input_ref = useRef(null);
  const modal_input_ref = useRef(null);
  const isFocused = useIsFocused();

  const [loading, set_loading] = useState(false);
  const [to_data, set_to_data] = useState(null);

  // MODAL STATES
  const [search_modal_visible, set_search_modal_visible] = useState(false);
  const [manual_to_id, set_manual_to_id] = useState("");
  const [selected_lpn_modal, set_selected_lpn_modal] = useState(null);

  // Auto-focus para sa RF Gun kapag sarado ang mga modal
  useEffect(() => {
    let focus_interval = null;

    if (isFocused && !search_modal_visible && !selected_lpn_modal) {
      focus_interval = setInterval(() => {
        scanner_input_ref.current?.focus();
      }, 1000);
    }

    return () => {
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused, search_modal_visible, selected_lpn_modal]);

  // Autofocus sa search modal input
  useEffect(() => {
    if (search_modal_visible) {
      setTimeout(() => {
        modal_input_ref.current?.focus();
      }, 150);
    }
  }, [search_modal_visible]);

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

        set_search_modal_visible(false);
        set_manual_to_id("");
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `Transfer Order ${clean_id} does not exist in the records.`,
        );
      }
    } catch (e) {
      console.error("Search TO Report Error: ", e);
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
            View TO Report
          </Text>
          <Text className="text-slate-500 text-xs">
            Transfer Order breakdown & material status
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => set_search_modal_visible(true)}
          className="p-2 bg-sky-50 rounded-full"
        >
          <Search size={20} color="#0284c7" />
        </TouchableOpacity>
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
              READY TO SCAN / LOOKUP
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-center mt-2 leading-5"
            >
              Scan a Transfer Order barcode or enter TO ID manually to view item
              status report.
            </Text>

            <TouchableOpacity
              onPress={() => set_search_modal_visible(true)}
              activeOpacity={0.7}
              className="mt-8 bg-sky-50 border border-sky-200 px-6 py-3.5 rounded-2xl flex-row items-center"
            >
              <Keyboard size={18} color="#0284c7" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-700 text-sm ml-2"
              >
                Search TO Report
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* TO REPORT DISPLAY */
          <ScrollView
            className="flex-1 py-6"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER CARD */}
            <View className="bg-white mx-6 p-6 rounded-2xl border border-slate-300 mb-4 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-2">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-[10px] uppercase tracking-[1px] mb-1"
                  >
                    Transfer Order No.
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-base text-slate-900"
                  >
                    {to_data.to_number || to_data.id}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  className={`px-3.5 py-1.5 rounded-full ${
                    to_data.to_status === "Complete" ||
                    to_data.to_status === "Received"
                      ? "bg-emerald-100"
                      : "bg-amber-100"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      to_data.to_status === "Complete" ||
                      to_data.to_status === "Received"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {to_data.to_status || "Pending"}
                  </Text>
                </View>
              </View>

              {/* MACHINE & PRODUCT REF */}
              {(to_data.item_desc_ref || to_data.machine_id_ref) && (
                <View className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 mb-4">
                  <Text className="text-[9px] text-sky-600 font-bold uppercase tracking-wider mb-0.5">
                    Target Reference
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-800 text-xs"
                  >
                    {to_data.item_desc_ref || "N/A"}
                  </Text>
                  {to_data.machine_id_ref && (
                    <View className="flex-row items-center mt-1">
                      <Cpu size={12} color="#0284c7" />
                      <Text className="text-[11px] text-sky-800 font-medium ml-1">
                        Machine: {to_data.machine_id_ref}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* MOVEMENT TYPE & REQUESTED BY */}
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

              {/* CREATION DATE */}
              <View className="border-t border-slate-100 pt-3 flex-row justify-between items-center">
                <Text className="text-slate-400 text-xs font-medium">
                  Date Needed:
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-700 text-xs"
                >
                  {formatDate(to_data.date_needed)}
                </Text>
              </View>
            </View>

            {/* LIST TITLE */}
            <View className="mx-6 mb-3 mt-2 flex-row justify-between items-center">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-md uppercase tracking-wider"
              >
                Transfer List ({to_data.transfer_list?.length || 0})
              </Text>
              <Package size={18} color="#64748b" />
            </View>

            {/* BREAKDOWN LIST */}
            <View className="mx-6 space-y-3 mb-6 gap-3">
              {to_data.transfer_list &&
                to_data.transfer_list.map((item, index) => {
                  const lpn_list = item.lpn_list || [];

                  // 1. Picked Qty (LPNs na may `to_picked_by`)
                  const total_picked_qty = lpn_list.reduce((sum, lpn) => {
                    return lpn.to_picked_by
                      ? sum + (Number(lpn.qty_base) || 0)
                      : sum;
                  }, 0);

                  // 2. Received Qty (LPNs na may `to_received_by`)
                  const total_received_qty = lpn_list.reduce((sum, lpn) => {
                    return lpn.to_received_by
                      ? sum + (Number(lpn.qty_base) || 0)
                      : sum;
                  }, 0);

                  // 3. Consumed Qty (LPNs na may `to_dispatched_by`)
                  const total_consumed_qty = lpn_list.reduce((sum, lpn) => {
                    return lpn.to_dispatched_by
                      ? sum + (Number(lpn.qty_base) || 0)
                      : sum;
                  }, 0);

                  const assigned_lpn_count = lpn_list.length;
                  const req_qty = item.quantity || 0;

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => set_selected_lpn_modal(item)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
                    >
                      {/* HEADER ROW: Index, Code, and Status Badge */}
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center flex-1 pr-2">
                          <View className="px-2 py-0.5 bg-sky-100 rounded-md">
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className="text-xs text-sky-600"
                            >
                              {index + 1}
                            </Text>
                          </View>
                          <Text
                            style={{ fontFamily: "Outfit-Bold" }}
                            className="text-slate-900 text-sm ml-2"
                          >
                            {item.item_code}
                          </Text>
                        </View>

                        {/* <View className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                          <Text className="text-[9px] font-bold uppercase tracking-wide text-slate-700">
                            {item.transfer_status || "Pending"}
                          </Text>
                        </View> */}
                      </View>

                      {/* ITEM DESCRIPTION */}
                      <Text
                        style={{ fontFamily: "Outfit-Regular" }}
                        className="text-slate-500 text-xs mb-3"
                      >
                        {item.item_desc}
                      </Text>

                      {/* SUMMARY GRID */}
                      <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5">
                        {/* COL 3 & COL 7: Request Qty & Assigned LPNs */}
                        <View className="flex-row justify-between items-center border-b border-slate-200/60 pb-2 mb-1">
                          <View className="flex-row items-center">
                            <PackagePlus size={14} color="#64748b" />
                            <Text className="text-xs text-slate-500 ml-1.5">
                              Request Qty:{" "}
                            </Text>
                          </View>

                          <View className="flex-row items-center">
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className="text-xs text-slate-800"
                            >
                              {req_qty.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.uom || item.uom_base}
                            </Text>
                            {/* <Layers size={14} color="#64748b" />
                            <Text className="text-xs text-slate-500 ml-1.5">
                              Assign LPNs:{" "}
                              <Text
                                style={{ fontFamily: "Outfit-Bold" }}
                                className="text-sky-700"
                              >
                                {assigned_lpn_count}
                              </Text>
                            </Text> */}
                          </View>
                        </View>

                        {/* PICKED, RECEIVED, CONSUMED WITH GAPS AND NEW COLORS */}
                        <View className="gap-2">
                          {/* Picked Qty - SKY */}
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <SquareArrowUp size={13} color="#0284c7" />
                              <Text className="text-xs text-slate-500 ml-1.5">
                                Picked Qty:
                              </Text>
                            </View>
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className="text-xs text-sky-700"
                            >
                              {total_picked_qty.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.uom || item.uom_base}
                            </Text>
                          </View>

                          {/* Received Qty - EMERALD */}
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <SquareArrowDown size={13} color="#10b981" />
                              <Text className="text-xs text-slate-500 ml-1.5">
                                Received Qty:
                              </Text>
                            </View>
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className="text-xs text-emerald-700"
                            >
                              {total_received_qty.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.uom || item.uom_base}
                            </Text>
                          </View>

                          {/* Consumed Qty - ROSE */}
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <PackageMinus size={13} color="#f43f5e" />
                              <Text className="text-xs text-slate-500 ml-1.5">
                                Consumed Qty:
                              </Text>
                            </View>
                            <Text
                              style={{ fontFamily: "Outfit-Bold" }}
                              className="text-xs text-rose-700"
                            >
                              {total_consumed_qty.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.uom || item.uom_base}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* VIEW LPN DRILLDOWN BUTTON */}
                      <View className="flex-row items-center justify-end mt-2 pt-1">
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-[11px] text-slate-500 mr-0.5"
                        >
                          View LPN Details ({assigned_lpn_count})
                        </Text>
                        <ChevronRight size={13} color="#64748b" />
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
                  Lookup Another TO
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ================= SEARCH TO MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={search_modal_visible}
        onRequestClose={() => set_search_modal_visible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View className="bg-white rounded-[24px] p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-lg text-slate-900"
              >
                Manual TO Lookup
              </Text>
              <TouchableOpacity
                onPress={() => {
                  set_search_modal_visible(false);
                  set_manual_to_id("");
                }}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Enter the exact Transfer Order (TO) number to view report.
            </Text>

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

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  set_search_modal_visible(false);
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
                    View Report
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= LPN BREAKDOWN DRILLDOWN MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selected_lpn_modal}
        onRequestClose={() => set_selected_lpn_modal(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[28px] p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-100">
              <View className="flex-1 pr-2">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-base text-slate-900"
                >
                  {selected_lpn_modal?.item_code}
                </Text>
                <Text className="text-xs text-slate-500">
                  {selected_lpn_modal?.item_desc}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set_selected_lpn_modal(null)}
                className="p-1.5 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView className="py-4" showsVerticalScrollIndicator={false}>
              {!selected_lpn_modal?.lpn_list ||
              selected_lpn_modal.lpn_list.length === 0 ? (
                <Text className="text-center text-slate-400 py-8">
                  No LPNs assigned to this item yet.
                </Text>
              ) : (
                selected_lpn_modal.lpn_list.map((lpn, idx) => (
                  <View
                    key={idx}
                    className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-3 space-y-2"
                  >
                    {/* LPN ID & QTY */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-xs text-sky-700"
                      >
                        LPN: {lpn.lpn_id}
                      </Text>
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-xs text-slate-900"
                      >
                        {lpn.qty_base}{" "}
                        {lpn.uom_base || lpn.uom_display || "KGS"}
                      </Text>
                    </View>

                    {/* TRACKING USERS & DATES (UPDATED COLORS HERE TOO) */}
                    <View className="pt-2 border-t border-slate-200/60 flex gap-2">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <SquareArrowUp size={13} color="#0284c7" />
                          <Text className="text-xs text-slate-500 ml-1.5">
                            Picked By:
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-xs text-sky-700"
                        >
                          {lpn.to_picked_by}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <SquareArrowDown size={13} color="#10b981" />
                          <Text className="text-xs text-slate-500 ml-1.5">
                            Received By:
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className={`text-xs ${lpn.to_received_by ? "text-emerald-700" : "text-slate-500"} `}
                        >
                          {lpn.to_received_by || "-"}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <PackageMinus size={13} color="#f43f5e" />
                          <Text className="text-xs text-slate-500 ml-1.5">
                            Dispatch By:
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className={`text-xs ${lpn.to_dispatched_by ? "text-rose-700" : "text-slate-500"} `}
                        >
                          {lpn.to_dispatched_by || "-"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => set_selected_lpn_modal(null)}
              className="flex-1 bg-slate-100 border border-slate-200 py-3.5 rounded-xl items-center"
            >
              <Text className="text-slate-600 font-bold">Close</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              onPress={() => set_selected_lpn_modal(null)}
              className="bg-slate-900 py-3.5 rounded-xl items-center mt-2"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white"
              >
                Close
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default View_TO_Report;
