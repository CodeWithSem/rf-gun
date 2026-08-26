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
  Warehouse,
  MapPin,
  Layers,
  Keyboard,
  X,
  Package,
  List,
  Boxes,
  PackageSearch,
  QrCode,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

import { firestore_db } from "@assets/scripts/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

const Bin_Lookup = ({ navigation }) => {
  const scanner_input_ref = useRef(null);
  const modal_warehouse_ref = useRef(null);
  const isFocused = useIsFocused();

  const [loading, set_loading] = useState(false);

  // BIN & LPN DATA STATES
  const [bin_info, set_bin_info] = useState(null); // { warehouse_code, sbin_code }
  const [lpn_list, set_lpn_list] = useState([]);
  const [view_mode, set_view_mode] = useState("PER_ITEM"); // 'PER_ITEM' | 'PER_LPN'

  // MODAL STATES
  const [modal_visible, set_modal_visible] = useState(false);
  const [manual_warehouse_code, set_manual_warehouse_code] = useState("");
  const [manual_sbin_code, set_manual_sbin_code] = useState("");

  // CONTINUOUS AUTO-FOCUS PARA SA RF GUN (Kapag sarado ang modal)
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

  // Autofocus sa warehouse input sa loob ng modal kapag binuksan
  useEffect(() => {
    if (modal_visible) {
      setTimeout(() => {
        modal_warehouse_ref.current?.focus();
      }, 150);
    }
  }, [modal_visible]);

  // CORE SEARCH LOGIC VIA FIRESTORE QUERY
  const execute_bin_search = async (wh_code, bin_code) => {
    const clean_wh = wh_code.trim().toUpperCase();
    const clean_bin = bin_code.trim().toUpperCase();

    if (!clean_wh || !clean_bin) {
      Alert.alert(
        "Validation Error",
        "Please provide both Warehouse Code and Bin Code.",
      );
      return;
    }

    set_loading(true);
    Vibration.vibrate(50);

    try {
      // Query sa TBL_INVENTORY_COUNT matching warehouse_code and sbin_code
      const collection_ref = collection(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
      );

      // 💡 Nagdagdag ng limit(201) para sa efficient check
      const q = query(
        collection_ref,
        where("warehouse_code", "==", clean_wh),
        where("sbin_code", "==", clean_bin),
        limit(201),
      );

      const query_snapshot = await getDocs(q);
      const fetched_items = [];

      query_snapshot.forEach((doc) => {
        fetched_items.push(doc.data());
      });

      // 🛑 Validation 1: Kapag lumagpas sa 200 items (More than 200 LPNs)
      if (fetched_items.length > 200) {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Too Many Records",
          `Bin Location ${clean_bin} contains more than 200 LPNs (${fetched_items.length - 1}+ items). Please refine your search or process this bin via desktop.`,
          [{ text: "OK" }],
        );
        return; // ⛔ Hinto agad ang execution dito
      }

      // ✅ Normal Flow: Kapag 1 hanggang 200 items lang ang nahanap
      if (fetched_items.length > 0) {
        set_bin_info({ warehouse_code: clean_wh, sbin_code: clean_bin });
        set_lpn_list(fetched_items);
        set_modal_visible(false);
        set_manual_warehouse_code("");
        set_manual_sbin_code("");
      } else {
        // ⚠️ Validation 2: Walang nahanap na item
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "No Items Found",
          `No inventory found for Bin Location: ${clean_bin} in Warehouse: ${clean_wh}.`,
        );
      }
    } catch (e) {
      console.error("Search Bin Error: ", e);
      Alert.alert("Error", "Failed to fetch Bin information.");
    } finally {
      set_loading(false);
    }
  };

  // HANDLER FOR SCANNED DATA PARSING (e.g., "MS-CAL-PROD_M1")
  const handle_scanned_barcode = (raw_code) => {
    const clean_code = raw_code.trim();
    if (!clean_code) return;

    const parts = clean_code.split("_");
    if (parts.length >= 2) {
      const parsed_wh = parts[0];
      const parsed_bin = parts.slice(1).join("_"); // Para sa cases na may extra underscore sa bin name
      execute_bin_search(parsed_wh, parsed_bin);
    } else {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert(
        "Invalid Barcode",
        "Scanned barcode format is invalid. Expected format: WAREHOUSE_BIN (e.g., MS-CAL-PROD_M1)",
      );
    }
  };

  const handle_manual_submit = () => {
    execute_bin_search(manual_warehouse_code, manual_sbin_code);
  };

  // HELPER TO GROUP AND SUMMARIZE ITEMS FOR "PER ITEM" VIEW
  const get_grouped_items = () => {
    const map = new Map();

    lpn_list.forEach((item) => {
      const key = `${item.item_code}_${item.item_desc || ""}_${item.uom_base}`;
      if (!map.has(key)) {
        map.set(key, {
          item_code: item.item_code,
          item_desc: item.item_desc || "",
          uom_base: item.uom_base,
          total_qty_base: 0,
          total_qty_kg: 0,
          lpn_count: 0,
        });
      }

      const existing = map.get(key);
      existing.total_qty_base += Number(item.qty_base || 0);
      existing.total_qty_kg += Number(item.qty_in_kg || 0);
      existing.lpn_count += 1;
    });

    return Array.from(map.values());
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
            handle_scanned_barcode(code);
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
            Storage Bin Lookup
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan storage bin barcode or enter details manually
          </Text>
        </View>
        <PackageSearch size={24} color="#0284c7" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50">
        {!bin_info ? (
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
              Please point your scanner at the Bin location barcode or trigger
              the manual lookup.
            </Text>

            {/* MANUAL INPUT BUTTON */}
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
                Manual Search Bin
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* BIN DATA & LPN LIST DISPLAY */
          <ScrollView
            className="flex-1 py-6"
            showsVerticalScrollIndicator={false}
          >
            {/* CONTAINER 1: STORAGE BIN INFORMATION CARD */}
            <View className="bg-white mx-6 p-6 rounded-2xl border border-slate-300 shadow-xs">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-sky-600 text-xs uppercase tracking-[1px] mb-3"
              >
                Storage Bin Location
              </Text>

              <View className="flex-row gap-4">
                {/* WAREHOUSE CODE */}
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
                    numberOfLines={1}
                  >
                    {bin_info.warehouse_code}
                  </Text>
                </View>

                {/* BIN CODE */}
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
                    numberOfLines={1}
                  >
                    {bin_info.sbin_code}
                  </Text>
                </View>
              </View>
            </View>

            {/* TOGGLE VIEW SWITCHER (PER ITEM vs PER LPN) */}
            <View className="mx-6 mt-6 flex-row bg-slate-200 p-1.5 rounded-xl">
              <TouchableOpacity
                onPress={() => set_view_mode("PER_ITEM")}
                activeOpacity={0.8}
                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center space-x-2 ${
                  view_mode === "PER_ITEM" ? "bg-white shadow-xs" : ""
                }`}
              >
                <Package
                  size={16}
                  color={view_mode === "PER_ITEM" ? "#0284c7" : "#64748b"}
                />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-xs ml-1.5 ${
                    view_mode === "PER_ITEM" ? "text-sky-700" : "text-slate-500"
                  }`}
                >
                  Per Item
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => set_view_mode("PER_LPN")}
                activeOpacity={0.8}
                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center space-x-2 ${
                  view_mode === "PER_LPN" ? "bg-white shadow-xs" : ""
                }`}
              >
                <QrCode
                  size={16}
                  color={view_mode === "PER_LPN" ? "#0284c7" : "#64748b"}
                />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-xs ml-1.5 ${
                    view_mode === "PER_LPN" ? "text-sky-700" : "text-slate-500"
                  }`}
                >
                  Per LPN
                </Text>
              </TouchableOpacity>
            </View>

            {/* CONTAINER 2: LIST OF ITEMS OR LPNS */}
            <View className="mx-6 mt-4 space-y-3">
              {view_mode === "PER_ITEM"
                ? /* PER ITEM LISTING */
                  get_grouped_items().map((item, index) => (
                    <View
                      key={`item_${index}`}
                      className="bg-white p-5 rounded-2xl border border-slate-200 mb-3"
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-2">
                          <Text
                            style={{ fontFamily: "Outfit-Bold" }}
                            className="text-lg text-sky-600 uppercase"
                          >
                            {item.item_code}
                          </Text>
                          {item.item_desc ? (
                            <Text
                              style={{ fontFamily: "Outfit-Medium" }}
                              className="text-slate-700 text-xs mt-0.5"
                            >
                              {item.item_desc}
                            </Text>
                          ) : null}
                        </View>
                        <View className="bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                          <Text className="text-sky-700 text-[10px] font-bold">
                            {item.lpn_count}{" "}
                            {item.lpn_count === 1 ? "LPN" : "LPNs"}
                          </Text>
                        </View>
                      </View>

                      <View className="border-t border-slate-100 mt-4 pt-3 flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Layers size={16} color="#64748b" />
                          <Text
                            style={{ fontFamily: "Outfit-Medium" }}
                            className="text-slate-500 text-xs ml-2"
                          >
                            Total Quantity
                          </Text>
                        </View>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-base text-slate-900"
                        >
                          {item.total_qty_base.toLocaleString()}{" "}
                          <Text className="text-xs text-slate-400 font-normal">
                            {item.uom_base}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  ))
                : /* PER LPN LISTING */
                  lpn_list.map((item, index) => (
                    <View
                      key={`lpn_${index}`}
                      className="bg-white p-5 rounded-2xl border border-slate-200 mb-3"
                    >
                      <View className="flex-row justify-between items-center mb-3">
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-xs text-sky-600 uppercase tracking-wider"
                        >
                          LPN: {item.lpn_id}
                        </Text>
                        <View className="bg-green-100 px-3 py-1 rounded-full">
                          <Text className="text-green-700 text-[9px] font-bold uppercase">
                            {item.lpn_status || "AVAILABLE"}
                          </Text>
                        </View>
                      </View>

                      <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                        <Text className="text-sm font-bold text-slate-800 uppercase">
                          {item.item_code}
                        </Text>
                        {item.item_desc ? (
                          <Text className="text-xs text-slate-500 mt-0.5">
                            {item.item_desc}
                          </Text>
                        ) : null}
                      </View>

                      <View className="flex-row justify-between items-center px-1">
                        <Text
                          style={{ fontFamily: "Outfit-Medium" }}
                          className="text-xs text-slate-500"
                        >
                          Quantity:
                        </Text>
                        <Text
                          style={{ fontFamily: "Outfit-Bold" }}
                          className="text-sm text-slate-900"
                        >
                          {Number(item.qty_base).toLocaleString()}{" "}
                          <Text className="text-xs text-slate-400 font-normal">
                            {item.uom_base}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  ))}
            </View>

            {/* ACTION BUTTONS */}
            <View className="px-6 mt-4 pb-10">
              {/* SCAN ANOTHER BIN */}
              <TouchableOpacity
                onPress={() => {
                  set_bin_info(null);
                  set_lpn_list([]);
                }}
                activeOpacity={0.7}
                className="bg-white border border-slate-300 py-4 rounded-2xl items-center flex-row justify-center space-x-2"
              >
                <Barcode size={20} color="#64748b" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="ml-1 text-slate-500"
                >
                  Scan Another Bin
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
                  Manual Search Bin
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
                Manual Bin Lookup
              </Text>
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_warehouse_code("");
                  set_manual_sbin_code("");
                }}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Enter the exact Warehouse Code and Bin Location Code below.
            </Text>

            {/* WAREHOUSE INPUT FIELD */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 flex-row items-center">
              <Warehouse size={20} color="#94a3b8" />
              <TextInput
                ref={modal_warehouse_ref}
                placeholder="Warehouse Code (e.g. MS-CAL-PROD)"
                placeholderTextColor="#94a3b8"
                value={manual_warehouse_code}
                onChangeText={set_manual_warehouse_code}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
                className="flex-1 ml-3 text-slate-900 font-medium p-0 text-sm"
              />
            </View>

            {/* BIN LOCATION INPUT FIELD */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex-row items-center">
              <MapPin size={20} color="#94a3b8" />
              <TextInput
                placeholder="Bin Location Code (e.g. M1)"
                placeholderTextColor="#94a3b8"
                value={manual_sbin_code}
                onChangeText={set_manual_sbin_code}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handle_manual_submit}
                className="flex-1 ml-3 text-slate-900 font-medium p-0 text-sm"
              />
            </View>

            {/* BUTTON CONTROLS */}
            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_warehouse_code("");
                  set_manual_sbin_code("");
                }}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-600 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handle_manual_submit}
                disabled={
                  loading ||
                  !manual_warehouse_code.trim() ||
                  !manual_sbin_code.trim()
                }
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
                    Search Bin
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

export default Bin_Lookup;
