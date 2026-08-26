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
  KeyboardAvoiding,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Barcode,
  Warehouse,
  MapPin,
  Layers,
  History,
  Keyboard,
  X,
  ArrowRight,
  FileText,
  MessageSquareText,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc } from "firebase/firestore";

const LPN_Search = ({ navigation }) => {
  const scanner_input_ref = useRef(null);
  const modal_input_ref = useRef(null);
  const isFocused = useIsFocused();

  const [loading, set_loading] = useState(false);
  const [lpn_data, set_lpn_data] = useState(null);

  // MODAL STATES
  const [modal_visible, set_modal_visible] = useState(false);
  const [manual_lpn_id, set_manual_lpn_id] = useState("");

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
      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        clean_id,
      );
      const doc_snap = await getDoc(doc_ref);

      if (doc_snap.exists()) {
        set_lpn_data(doc_snap.data());
        set_modal_visible(false); // Isara ang modal kung doon nag-execute ang search
        set_manual_lpn_id(""); // Reset manual text string
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `LPN ${clean_id} does not exist in the records.`,
        );
      }
    } catch (e) {
      console.error("Search LPN Error: ", e);
      Alert.alert("Error", "Failed to fetch LPN information.");
    } finally {
      set_loading(false);
    }
  };

  const handle_manual_submit = () => {
    const clean_id = manual_lpn_id.trim();
    if (!clean_id) {
      Alert.alert("Validation Error", "Please enter a valid LPN ID.");
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
            Search LPN
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan sticker or enter details manually
          </Text>
        </View>
        <Search size={24} color="#0284c7" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50">
        {!lpn_data ? (
          /* EMPTY STATE WITH MANUAL INPUT ACCESS */
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
              Please point your scanner at the LPN barcode or trigger the manual
              lookup.
            </Text>

            {/* INTUITIVE MANUAL INPUT BUTTON ON EMPTY STATE */}
            <TouchableOpacity
              onPress={() => set_modal_visible(true)}
              activeOpacity={0.7}
              className="mt-8 bg-sky-50 border border-sky-200 px-6 py-3.5 rounded-2xl flex-row items-center space-x-2"
            >
              <Keyboard size={18} color="#0284c7" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-700 text-sm ml-2"
              >
                Manual Search LPN
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* LPN DATA DISPLAY */
          <ScrollView
            className="flex-1 py-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white mx-6 p-6 rounded-2xl border border-slate-300">
              {/* TOP SECTION: ID & STATUS */}
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-2">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-xs uppercase tracking-[1px] mb-1"
                  >
                    LPN: {lpn_data.lpn_id}
                  </Text>
                </View>
                <View className="bg-green-100 px-4 py-1.5 rounded-full">
                  <Text className="text-green-700 text-[10px] font-bold uppercase tracking-wider">
                    {lpn_data.lpn_status || "ACTIVE"}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-4 mt-6">
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Text className="text-lg text-sky-600 font-bold uppercase">
                    {lpn_data?.item_code || ""}
                  </Text>
                  {lpn_data.item_desc && (
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-900 text-xs"
                    >
                      {lpn_data?.item_desc || ""}
                    </Text>
                  )}
                </View>
              </View>

              {/* LOCATION GRID */}
              <View className="flex-row gap-4 mt-4">
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
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
                    {lpn_data.warehouse_code}
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
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
                    {lpn_data.sbin_code}
                  </Text>
                </View>
              </View>

              {/* REMARKS */}
              {lpn_data?.remarks && (
                <View className="flex-row gap-4 mt-4">
                  <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <View className="flex-row gap-1.5 items-center">
                      <MessageSquareText size={18} color="#0284c7" />
                      <Text className="text-[10px] text-slate-400 font-bold uppercase">
                        Remarks
                      </Text>
                    </View>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-900 text-xs mt-2"
                    >
                      {lpn_data?.remarks}
                    </Text>
                  </View>
                </View>
              )}

              {/* QUANTITY SECTION */}
              <View className="space-y-3 border-t border-slate-50 pt-5 mt-6">
                <View className="flex-row justify-between items-center bg-slate-50/50 p-3 rounded-xl">
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
                    {lpn_data.qty_base.toLocaleString()}{" "}
                    <Text className="text-xs text-slate-400">
                      {lpn_data.uom_base}
                    </Text>
                  </Text>
                </View>

                {lpn_data.qty_in_kg > 0 && (
                  <View className="flex-row justify-between items-center bg-sky-50/50 p-3 rounded-xl">
                    <View className="flex-row items-center">
                      <Text className="text-lg">⚖️</Text>
                      <Text
                        style={{ fontFamily: "Outfit-Medium" }}
                        className="text-slate-600 ml-2"
                      >
                        Measured Weight
                      </Text>
                    </View>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-lg text-sky-700"
                    >
                      {lpn_data.qty_in_kg}{" "}
                      <Text className="text-xs text-sky-400">KG</Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* TRANSFER ORDER REFERENCE CARD (Lalabas lang kung may to_number_ref) */}
            {lpn_data?.to_number_ref &&
              lpn_data.to_number_ref.trim() !== "" && (
                <View className="mt-5 bg-amber-50/60 mx-6 p-4 rounded-2xl border border-amber-200">
                  <View className="flex-row items-center justify-between border-b border-amber-200/60 pb-2 mb-3">
                    <View className="flex-row items-center space-x-2">
                      <View className="bg-amber-100 p-1.5 rounded-lg">
                        <FileText size={14} color="#d97706" />
                      </View>
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="ml-1 text-xs text-amber-800 uppercase tracking-wide"
                      >
                        {lpn_data.to_number_ref}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    {/* FROM LOCATION */}
                    <View className="flex-1">
                      <Text className="text-[9px] text-amber-600 font-bold uppercase mb-0.5">
                        Current Location
                      </Text>
                      <Text
                        style={{ fontFamily: "Outfit-Medium" }}
                        className="text-slate-800 text-xs"
                        numberOfLines={1}
                      >
                        {lpn_data?.warehouse_code || "-"}
                      </Text>
                      <Text className="text-[10px] text-slate-500 font-medium">
                        Bin: {lpn_data?.sbin_code || "-"}
                      </Text>
                    </View>

                    <View className="px-2">
                      <ArrowRight size={16} color="#d97706" />
                    </View>

                    {/* TO LOCATION */}
                    <View className="flex-1 items-end">
                      <Text className="text-[9px] text-amber-600 font-bold uppercase mb-0.5">
                        Target Destination
                      </Text>
                      <Text
                        style={{ fontFamily: "Outfit-Medium" }}
                        className="text-slate-800 text-xs text-right"
                        numberOfLines={1}
                      >
                        {lpn_data?.to_warehouse_code || "-"}
                      </Text>
                      <Text className="text-[10px] text-slate-500 font-medium text-right">
                        Bin: {lpn_data?.to_sbin_code || "-"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

            {/* ACTION BUTTONS */}
            <View className="px-6 mt-5 pb-10">
              {/* SCAN ANOTHER LPN */}
              <TouchableOpacity
                onPress={() => set_lpn_data(null)}
                activeOpacity={0.7}
                className="bg-white border border-slate-300 py-4 rounded-2xl items-center flex-row justify-center space-x-2"
              >
                <Barcode size={20} color="#64748b" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="ml-1 text-slate-500"
                >
                  Scan Another LPN
                </Text>
              </TouchableOpacity>

              {/* MANUAL ENTRY FOR NEXT ATTEMPT */}
              <TouchableOpacity
                onPress={() => set_modal_visible(true)}
                activeOpacity={0.7}
                className="mt-2 bg-sky-50 border border-sky-300 py-4 rounded-2xl flex-row justify-center items-center space-x-2"
              >
                <Keyboard size={18} color="#0284c7" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-sky-700 ml-2"
                >
                  Manual Search LPN
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
                Manual LPN Lookup
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
              Enter the exact License Plate Number (LPN) registered on the
              pallet label.
            </Text>

            {/* INPUT FIELD */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex-row items-center">
              <Barcode size={20} color="#94a3b8" />
              <TextInput
                ref={modal_input_ref}
                placeholder="Enter LPN..."
                placeholderTextColor="#94a3b8"
                value={manual_lpn_id}
                onChangeText={set_manual_lpn_id}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handle_manual_submit}
                className="flex-1 ml-3 text-slate-900 font-medium p-0"
              />
            </View>

            {/* BUTTON CONTROLS */}
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
                onPress={handle_manual_submit}
                disabled={loading || !manual_lpn_id.trim()} // Disabled kapag loading o walang laman
                className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row space-x-2 ${
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
                    Search LPN
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

export default LPN_Search;
