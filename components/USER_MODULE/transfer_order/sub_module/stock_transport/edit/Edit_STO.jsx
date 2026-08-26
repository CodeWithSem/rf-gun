import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import {
  ChevronLeft,
  Truck,
  User,
  UserCheck,
  FileText,
  MapPin,
  Barcode,
  Trash2,
  Package,
  Plus,
  X,
  CheckCircle2,
  Save,
  Keyboard,
  ArrowLeft,
  Warehouse,
  Layers,
} from "lucide-react-native";
import { firestore_db } from "@assets/scripts/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const Edit_STO = ({ navigation, route }) => {
  const { sto_data: initial_sto_data, user_data } = route.params || {};

  const [sto, set_sto] = useState(initial_sto_data || { transfer_list: [] });
  const [loading, set_loading] = useState(false);

  // Form Fields State
  const [truck_no, set_truck_no] = useState(initial_sto_data?.truck_no || "");
  const [truck_driver, set_truck_driver] = useState(
    initial_sto_data?.truck_driver || "",
  );
  const [helper, set_helper] = useState(initial_sto_data?.helper || "");
  const [doc_no, set_doc_no] = useState(initial_sto_data?.doc_no || "");
  const [location, set_location] = useState(
    initial_sto_data?.location || "To Caloocan",
  );

  // Focus Tracker for header input editing
  const [is_editing_header, set_is_editing_header] = useState(false);

  // RF Gun & Modal Scanning States
  const isFocused = useIsFocused();
  const main_scanner_ref = useRef(null);
  const modal_hidden_scanner_ref = useRef(null);
  const manual_input_ref = useRef(null);

  const [modal_visible, set_modal_visible] = useState(false);
  const [is_manual_mode, set_is_manual_mode] = useState(false);
  const [manual_lpn_id, set_manual_lpn_id] = useState("");
  const [scanned_lpn_data, set_scanned_lpn_data] = useState(null);
  const [sto_qty_roll, set_sto_qty_roll] = useState("");

  // CONTINUOUS AUTO-FOCUS FOR BACKGROUND SCANNER
  useEffect(() => {
    let focus_interval = null;

    if (isFocused && !modal_visible && !is_editing_header) {
      focus_interval = setInterval(() => {
        main_scanner_ref.current?.focus();
      }, 1000);
    }

    return () => {
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused, modal_visible, is_editing_header]);

  // AUTO-FOCUS FOR HIDDEN SCANNER OR MANUAL INPUT INSIDE MODAL
  useEffect(() => {
    let focus_interval = null;

    if (modal_visible && !scanned_lpn_data) {
      if (is_manual_mode) {
        setTimeout(() => manual_input_ref.current?.focus(), 150);
      } else {
        focus_interval = setInterval(() => {
          modal_hidden_scanner_ref.current?.focus();
        }, 800);
      }
    }

    return () => {
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [modal_visible, is_manual_mode, scanned_lpn_data]);

  // Save Header Info to Firestore
  const handleSaveHeader = async () => {
    try {
      set_loading(true);
      const sto_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_STOCK_TRANSPORT",
        "DATA",
        sto.id,
      );

      const updatePayload = {
        truck_no,
        truck_driver,
        helper,
        doc_no,
        location,
      };

      await updateDoc(sto_ref, updatePayload);
      set_sto((prev) => ({ ...prev, ...updatePayload }));
      set_loading(false);

      Alert.alert("Success", "STO details updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error(error);
      set_loading(false);
      Alert.alert("Error", "Failed to update STO header.");
    }
  };

  // Open Tag Modal
  const handleOpenModal = () => {
    set_manual_lpn_id("");
    set_scanned_lpn_data(null);
    set_sto_qty_roll("");
    set_is_manual_mode(false);
    set_modal_visible(true);
  };

  // Close Tag Modal
  const handleCloseModal = () => {
    set_modal_visible(false);
    set_is_manual_mode(false);
    set_manual_lpn_id("");
    set_scanned_lpn_data(null);
    set_sto_qty_roll("");
  };

  // Search LPN from Firestore
  const handle_search = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;

    if (sto.transfer_list?.some((item) => item.lpn_id === clean_id)) {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert("Duplicate", "This LPN is already added in this STO.");
      set_manual_lpn_id("");
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
        const lpn_doc_data = doc_snap.data();

        if (
          lpn_doc_data.sto_number_ref &&
          lpn_doc_data.sto_number_ref !== sto.id
        ) {
          Vibration.vibrate([100, 50, 100]);
          Alert.alert(
            "Already Tagged",
            `This LPN is already tagged under STO: ${lpn_doc_data.sto_number_ref}`,
          );
          set_loading(false);
          return;
        }

        if (!modal_visible) {
          set_modal_visible(true);
        }

        set_scanned_lpn_data({ ...lpn_doc_data, lpn_id: clean_id });
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `LPN "${clean_id}" does not exist in inventory.`,
        );
      }
    } catch (e) {
      console.error("Search LPN Error: ", e);
      Alert.alert("Error", "Failed to fetch LPN information.");
    } finally {
      set_loading(false);
    }
  };

  // Confirm and Tag LPN to STO
  const handleConfirmAddLPN = async () => {
    if (!scanned_lpn_data) return;

    if (!sto_qty_roll || isNaN(sto_qty_roll) || Number(sto_qty_roll) <= 0) {
      Alert.alert("Input Error", "Please enter a valid number of Bundle/Roll.");
      return;
    }

    try {
      set_loading(true);

      const picker_fullname = `${user_data?.first_name || ""} ${
        user_data?.last_name || ""
      }`.trim();

      const tagged_lpn_item = {
        ...scanned_lpn_data,
        sto_number_ref: sto.id,
        sto_picked_by: picker_fullname || "Unknown User",
        sto_qty_roll: Number(sto_qty_roll),
      };

      const lpn_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        scanned_lpn_data.lpn_id,
      );
      await updateDoc(lpn_ref, {
        sto_number_ref: sto.id,
        sto_picked_by: picker_fullname || "Unknown User",
        sto_qty_roll: Number(sto_qty_roll),
      });

      const sto_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_STOCK_TRANSPORT",
        "DATA",
        sto.id,
      );

      await updateDoc(sto_ref, {
        transfer_list: arrayUnion(tagged_lpn_item),
        truck_no,
        truck_driver,
        helper,
        doc_no,
        location,
      });

      set_sto((prev) => ({
        ...prev,
        transfer_list: [...(prev.transfer_list || []), tagged_lpn_item],
      }));

      handleCloseModal();
      set_loading(false);
      Alert.alert("Success", "LPN successfully tagged to STO.");
    } catch (error) {
      console.error("Error tagging LPN:", error);
      set_loading(false);
      Alert.alert("Error", "Failed to tag LPN. Check connection.");
    }
  };

  // Remove LPN Tagging Function
  const handleRemoveLPN = async (lpn_item) => {
    try {
      set_loading(true);

      const lpn_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        lpn_item.lpn_id,
      );
      await updateDoc(lpn_ref, {
        sto_number_ref: "",
        sto_picked_by: "",
        sto_qty_roll: 0,
      });

      const sto_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_STOCK_TRANSPORT",
        "DATA",
        sto.id,
      );
      await updateDoc(sto_ref, {
        transfer_list: arrayRemove(lpn_item),
      });

      set_sto((prev) => ({
        ...prev,
        transfer_list: prev.transfer_list.filter(
          (i) => i.lpn_id !== lpn_item.lpn_id,
        ),
      }));

      set_loading(false);
    } catch (error) {
      console.error("Error removing LPN:", error);
      set_loading(false);
      Alert.alert("Error", "Failed to remove LPN tag.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/70 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      {/* HIDDEN MAIN SCANNER INPUT (Outside Modal) */}
      <TextInput
        ref={main_scanner_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_search(code);
            main_scanner_ref.current?.clear();
          }
        }}
        blurOnSubmit={false}
      />

      {/* HEADER */}
      <View className="px-6 pb-4 pt-2 flex-row items-center bg-white border-b border-slate-200 shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-sky-50"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Edit STO
          </Text>
          <Text className="text-sky-600 text-xs font-bold">{sto.id}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4 bg-sky-50/40"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER DETAILS FORM */}
        <View className="bg-white p-4 rounded-xl border border-slate-200 mb-4 gap-y-2">
          <Text className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-1">
            Transport Information
          </Text>

          {/* Location Picker Buttons */}
          <View className="flex-row items-center gap-x-2">
            <TouchableOpacity
              onPress={() => set_location("To Caloocan")}
              className={`flex-1 h-12 px-3 rounded-xl border flex-row items-center justify-center ${
                location === "To Caloocan"
                  ? "bg-sky-600 border-sky-600"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Warehouse
                size={14}
                color={location === "To Caloocan" ? "white" : "#64748b"}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  location === "To Caloocan" ? "text-white" : "text-slate-600"
                }`}
              >
                To Caloocan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => set_location("To Filspin")}
              className={`flex-1 h-12 px-3 rounded-xl border flex-row items-center justify-center ${
                location === "To Filspin"
                  ? "bg-sky-600 border-sky-600"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Warehouse
                size={14}
                color={location === "To Filspin" ? "white" : "#64748b"}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  location === "To Filspin" ? "text-white" : "text-slate-600"
                }`}
              >
                To Filspin
              </Text>
            </TouchableOpacity>
          </View>
          {/* Reference Doc No */}
          <View className="flex-row items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <FileText size={16} color="#64748b" />
            <TextInput
              value={doc_no}
              onChangeText={set_doc_no}
              autoCapitalize="characters"
              onFocus={() => set_is_editing_header(true)}
              onBlur={() => set_is_editing_header(false)}
              placeholder="Reference Code"
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 font-semibold text-slate-800 text-xs h-[28px]"
              style={{ includeFontPadding: false, paddingVertical: 0 }}
            />
          </View>
          {/* Truck No */}
          <View className="flex-row items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Truck size={16} color="#64748b" />
            <TextInput
              value={truck_no}
              onChangeText={set_truck_no}
              autoCapitalize="characters"
              onFocus={() => set_is_editing_header(true)}
              onBlur={() => set_is_editing_header(false)}
              placeholder="Truck No."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 font-semibold text-slate-800 text-xs h-[28px]"
              style={{ includeFontPadding: false, paddingVertical: 0 }}
            />
          </View>

          {/* Driver & Helper Inputs */}
          <View className="flex-row items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <User size={16} color="#64748b" />
            <TextInput
              value={truck_driver}
              onChangeText={set_truck_driver}
              autoCapitalize="characters"
              onFocus={() => set_is_editing_header(true)}
              onBlur={() => set_is_editing_header(false)}
              placeholder="Driver Name"
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 font-semibold text-slate-800 text-xs h-[28px]"
              style={{ includeFontPadding: false, paddingVertical: 0 }}
            />
          </View>

          <View className="flex-row items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <UserCheck size={16} color="#64748b" />
            <TextInput
              value={helper}
              onChangeText={set_helper}
              autoCapitalize="characters"
              onFocus={() => set_is_editing_header(true)}
              onBlur={() => set_is_editing_header(false)}
              placeholder="Helper Name"
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 font-semibold text-slate-800 text-xs h-[28px]"
              style={{ includeFontPadding: false, paddingVertical: 0 }}
            />
          </View>
        </View>

        {/* TAGGED LPNS LIST */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Transfer List ({sto.transfer_list?.length || 0})
          </Text>
        </View>

        {!sto.transfer_list || sto.transfer_list.length === 0 ? (
          <View className="bg-white border border-dashed border-sky-200 p-4 rounded-xl items-center justify-center mb-4">
            <Package size={28} color="#94a3b8" />
            <Text className="text-slate-500 font-bold text-xs mt-2">
              No LPN tagged yet
            </Text>
            <Text className="text-slate-400 text-[10px] text-center mt-1">
              Click "Add LPN" below or use the RF gun to scan and tag items.
            </Text>
          </View>
        ) : (
          sto.transfer_list.map((item, index) => (
            <View
              key={item.lpn_id || index}
              className="bg-white border border-slate-200 p-3.5 rounded-xl mb-2 flex-row items-center justify-between"
            >
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-x-2 mb-2">
                  <View className="bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-sky-700">
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="font-bold text-slate-500 text-xs">
                    {item.lpn_id}
                  </Text>
                </View>

                <Text className="text-sky-700 font-semibold text-sm mt-0.5">
                  {item.item_code || "No Description"}
                </Text>
                <Text className="text-slate-700 font-semibold text-xs mt-0.5">
                  {item.item_desc || "No Description"}
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Quantity:{" "}
                  <Text className="font-bold text-sky-700">
                    {item.qty_base} {item.uom_base}
                  </Text>
                </Text>
                <Text className="text-[11px] text-slate-500">
                  No. of Bundle/Roll:{" "}
                  <Text className="font-bold text-sky-700">
                    {item.sto_qty_roll || 0}
                  </Text>
                </Text>
                {/* <View className="flex-row items-center gap-x-3 mt-1.5 flex-wrap">
                  
                </View> */}
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveLPN(item)}
                className="p-3 bg-rose-50 rounded-lg border border-rose-100 active:bg-rose-100"
              >
                <Trash2 size={20} color="#e11d48" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ADD LPN BUTTON */}
        <TouchableOpacity
          onPress={handleOpenModal}
          className="bg-sky-50 border border-dashed border-sky-400 h-14 rounded-xl flex-row items-center justify-center active:bg-sky-100 mb-6"
        >
          <Plus size={18} color="#0284c7" />
          <Text className="text-sky-700 font-bold text-sm ml-2">Add LPN</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* STICKY FOOTER - UPDATE BUTTON */}
      <SafeAreaView
        edges={["bottom"]}
        className="bg-white border-t border-slate-200 px-5 py-3"
      >
        <TouchableOpacity
          onPress={handleSaveHeader}
          className="bg-sky-600 py-3.5 rounded-xl flex-row items-center justify-center active:bg-sky-700 shadow-sm"
        >
          <Save size={18} color="white" />
          <Text className="text-white font-bold text-sm ml-2">Save</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* MODAL SCANNER & TAGGING */}
      <Modal
        visible={modal_visible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white min-h-[100%] flex-col justify-between">
            {/* Modal Top Header Bar */}
            <View className="flex-row items-center justify-between py-3 px-5 border-b border-slate-100 mb-2">
              <Text className="text-base font-bold text-sky-950">
                {scanned_lpn_data
                  ? "LPN Details"
                  : is_manual_mode
                    ? "Manual LPN Search"
                    : "Scan LPN Barcode"}
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                className="p-1.5 rounded-full bg-slate-100 active:bg-slate-200 outline-none"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* HIDDEN INPUT FOR RF GUN INSIDE MODAL */}
            {!scanned_lpn_data && !is_manual_mode && (
              <TextInput
                ref={modal_hidden_scanner_ref}
                showSoftInputOnFocus={false}
                style={{ opacity: 0, height: 0, position: "absolute" }}
                onSubmitEditing={(e) => {
                  const code = e.nativeEvent.text;
                  if (code) {
                    handle_search(code);
                    modal_hidden_scanner_ref.current?.clear();
                  }
                }}
                blurOnSubmit={false}
                autoFocus={true}
              />
            )}

            {/* MODAL CONTENT BODY */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, justifyStyle: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              {/* STATE 1: SCANNED LPN FOUND DETAILS & ROLL INPUT */}
              {scanned_lpn_data ? (
                <View className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 mt-5 mx-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-bold text-sky-900">
                      LPN: {scanned_lpn_data.lpn_id}
                    </Text>
                  </View>

                  <View className="bg-white p-3 rounded-xl border border-sky-100 gap-y-1 mb-3">
                    {/* + ITEM DESCRIPTION */}
                    <View className="flex-row gap-4">
                      <View className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <Text className="text-lg text-sky-600 font-bold uppercase">
                          {scanned_lpn_data?.item_code || ""}
                        </Text>
                        {scanned_lpn_data.item_desc && (
                          <Text
                            style={{ fontFamily: "Outfit-Bold" }}
                            className="text-slate-900 text-xs"
                          >
                            {scanned_lpn_data?.item_desc || ""}
                          </Text>
                        )}
                      </View>
                    </View>
                    {/* - ITEM DESCRIPTION */}
                    {/* + BIN LOCATION */}
                    <View className="flex-row gap-4 mt-2">
                      <View className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <View className="flex-row gap-1.5 items-center">
                          <Warehouse size={18} color="#0284c7" />
                          <Text className="text-[10px] text-slate-400 font-bold uppercase">
                            Warehouse
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-slate-900 text-sm mt-2"
                        >
                          {scanned_lpn_data.warehouse_code}
                        </Text>
                      </View>
                      <View className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <View className="flex-row gap-1.5 items-center">
                          <MapPin size={18} color="#0284c7" />
                          <Text className="text-[10px] text-slate-400 font-bold uppercase">
                            Bin Location
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-slate-900 text-sm mt-2"
                        >
                          {scanned_lpn_data.sbin_code}
                        </Text>
                      </View>
                    </View>
                    {/* - BIN LOCATION */}
                    {/* + QUANTITY */}
                    <View className="flex-row justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                      <View className="flex-row items-center">
                        <Layers size={18} color="#64748b" />
                        <Text
                          style={{ fontFamily: "Outfit-Medium" }}
                          className="text-slate-600 ml-2"
                        >
                          Stock Quantity
                        </Text>
                      </View>
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-lg text-slate-900"
                      >
                        {scanned_lpn_data.qty_base.toLocaleString()}{" "}
                        <Text className="text-xs text-slate-400">
                          {scanned_lpn_data.uom_base}
                        </Text>
                      </Text>
                    </View>
                    {/* - QUANTITY */}
                  </View>

                  {/* INPUT FOR BUNDLE / ROLL */}
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-slate-700 mb-1">
                      No. of Bundle/Roll{" "}
                      <Text className="text-rose-500">*</Text>
                    </Text>
                    <TextInput
                      value={sto_qty_roll}
                      style={{
                        includeFontPadding: false,
                        paddingVertical: 0,
                      }}
                      onChangeText={set_sto_qty_roll}
                      keyboardType="numeric"
                      placeholder="Enter quantity"
                      placeholderTextColor="#94a3b8"
                      className="bg-white border border-slate-300 rounded-xl px-3 h-12 text-sm font-bold text-slate-800"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-x-2">
                    <TouchableOpacity
                      disabled={loading}
                      onPress={() => {
                        set_scanned_lpn_data(null);
                        set_sto_qty_roll("");
                      }}
                      className={`flex-1 bg-slate-100 h-14 rounded-xl items-center justify-center active:bg-slate-200 border border-slate-200 ${
                        loading ? "opacity-50" : ""
                      }`}
                    >
                      <Text className="text-slate-700 font-bold text-xs">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={loading}
                      onPress={handleConfirmAddLPN}
                      className={`flex-[2] bg-sky-600 h-14 rounded-xl items-center justify-center active:bg-sky-700 flex-row ${
                        loading ? "opacity-70" : ""
                      }`}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="white" />
                          <Text className="text-white font-bold text-xs uppercase tracking-wider ml-1.5">
                            Confirm & Tag
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : is_manual_mode ? (
                /* STATE 2: MANUAL SEARCH MODE (Text Input Visible) */
                <View className="my-auto px-2">
                  <TouchableOpacity
                    onPress={() => set_is_manual_mode(false)}
                    className="flex-row items-center mb-4 self-start"
                  >
                    <ArrowLeft size={16} color="#0284c7" />
                    <Text className="text-sky-700 font-bold text-xs ml-1">
                      Back to Scanner
                    </Text>
                  </TouchableOpacity>

                  <Text className="text-xs font-bold text-slate-700 mb-2">
                    Enter LPN ID Barcode Number
                  </Text>
                  <View className="flex-row items-center gap-x-2 mb-4">
                    <View className="flex-1 flex-row items-center bg-slate-50 border border-sky-300 px-3 py-2.5 rounded-xl">
                      <Barcode size={18} color="#0284c7" />
                      <TextInput
                        ref={manual_input_ref}
                        value={manual_lpn_id}
                        onChangeText={set_manual_lpn_id}
                        onSubmitEditing={() => handle_search(manual_lpn_id)}
                        placeholder="e.g. LPN100234"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        className="flex-1 ml-2 font-bold text-slate-800 text-sm h-[32px]"
                        style={{
                          includeFontPadding: false,
                          paddingVertical: 0,
                        }}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => handle_search(manual_lpn_id)}
                      className="bg-sky-600 px-5 h-[46px] rounded-xl justify-center items-center active:bg-sky-700"
                    >
                      <Text className="text-white font-bold text-xs">
                        SEARCH
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* STATE 3: READY TO SCAN DISPLAY */
                <View className="flex-1 justify-center items-center px-6 py-6">
                  {loading ? (
                    <View>
                      <ActivityIndicator size="large" color="#0284c7" />
                    </View>
                  ) : (
                    <React.Fragment>
                      <View className="bg-sky-100 border-2 border-sky-500 p-8 rounded-full shadow-sm mb-6">
                        <Barcode size={80} color="#0284c7" />
                      </View>
                      <Text className="text-slate-800 uppercase font-bold text-base text-center mb-1">
                        Ready to Scan
                      </Text>
                      <Text className="text-slate-500 text-xs text-center mb-6">
                        Point the RF gun at an LPN QR code to tag it directly to
                        this STO.
                      </Text>

                      <TouchableOpacity
                        onPress={() => set_is_manual_mode(true)}
                        className="flex-row items-center bg-sky-50 border border-sky-200 px-4 py-2.5 rounded-xl active:bg-sky-100"
                      >
                        <Keyboard size={16} color="#0284c7" />
                        <Text className="text-sky-700 font-bold text-xs ml-2">
                          Enter LPN Manually
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Edit_STO;
