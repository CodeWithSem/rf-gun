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
import { ChevronLeft, ChevronDown, CalendarDays } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, setDoc } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";
import { use_item_master } from "@assets/scripts/functions/item_master_context";
import Item_Master_Modal from "@assets/elements/item_master_modal/Item_Master_Moda";

const SHIFT_OPTIONS = ["DAY", "NIGHT"];

const FG_Registration_Input = ({ navigation, route }) => {
  const { user_data, set_fg_list } = route.params || {};
  const { item_master_data, is_loading_items } = use_item_master();

  const [loading, set_loading] = useState(false);

  // PRE-CONFIGURED DEFAULTS
  const warehouse_code = "PROD";
  const sbin_code = "FG STAGING";

  // OBJECT STATE PARA SA NAPILING ITEM
  const [selected_item, set_selected_item] = useState(null);

  // FORM FIELDS
  const [qty_input, set_qty_input] = useState("1");
  const [uom_base, set_uom_base] = useState("");
  const [batch_code, set_batch_code] = useState("");
  const [lot_number, set_lot_number] = useState("");
  const [stacker_id, set_stacker_id] = useState("");
  const [shift, set_shift] = useState("");

  // DATES CONFIGURATION
  const [mfg_date, set_mfg_date] = useState(new Date()); // Default: Date Today
  const [expiry_date, set_expiry_date] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3); // Default: 3 Years from now
    return d;
  });

  // DATE PICKER & MODAL VISIBILITY STATES
  const [show_mfg_picker, set_show_mfg_picker] = useState(false);
  const [show_expiry_picker, set_show_expiry_picker] = useState(false);
  const [is_item_modal_visible, set_is_item_modal_visible] = useState(false);
  const [is_shift_modal_visible, set_is_shift_modal_visible] = useState(false);

  const format_display_date = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const format_db_date = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handle_select_shift = (selected_shift) => {
    set_shift(selected_shift);
    set_is_shift_modal_visible(false);
    Vibration.vibrate(30);
  };

  const handle_save_fg = async () => {
    if (
      !selected_item?.item_code ||
      !uom_base ||
      !qty_input ||
      !batch_code ||
      !lot_number ||
      !stacker_id ||
      !shift
    ) {
      Alert.alert(
        "Missing Info",
        "Please fill up all required fields including Item Code, Batch, Lot Number, Stacker ID, and Shift.",
      );
      return;
    }

    set_loading(true);
    const date_now = get_date_now();
    const creation_date_str = format_date(get_date_now());
    const creation_time_str = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");

    const generated_lpn_id = `${year}${month}${day}-${hours}${minutes}${seconds}${ms}-FG`;

    try {
      const new_fg_entry = {
        batch_code: String(batch_code).toUpperCase(),
        lot_number: String(lot_number).toUpperCase(),
        stacker_id: String(stacker_id).toUpperCase(),
        shift: String(shift).toUpperCase(),
        created_by: String(user_data?.username || "ADMIN"),
        creation_date: String(creation_date_str),
        creation_time: creation_time_str,
        mfg_date: String(format_db_date(mfg_date)),
        expiry_date: String(format_db_date(expiry_date)),
        gr_number: "",
        item_code: String(selected_item.item_code).toUpperCase(),
        item_desc: String(selected_item.item_desc || "").toUpperCase(),
        lpn_id: String(generated_lpn_id),
        lpn_status: "Pending",
        plant_code: "PL01",
        po_number: "",
        qty_base: Number(qty_input),
        qty_in_kg: 0,
        sbin_code: String(sbin_code),
        sloc_code: "",
        stype_code: "BULK",
        uom_base: String(uom_base).toUpperCase(),
        uom_display: String(uom_base).toUpperCase(),
        warehouse_code: String(warehouse_code),
      };

      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM/TBL_FG_REGISTRATION/DATA",
        generated_lpn_id,
      );
      await setDoc(doc_ref, new_fg_entry);

      if (set_fg_list) {
        set_fg_list((prev_list) => [
          { ...new_fg_entry, id: String(generated_lpn_id) },
          ...prev_list,
        ]);
      }

      Vibration.vibrate(70);

      Alert.alert(
        "Success",
        `LPN ${generated_lpn_id} successfully registered. Clear fields or continue?`,
        [
          {
            text: "Done (Go Back)",
            onPress: () => navigation.goBack(),
          },
          {
            text: "Register Another",
            onPress: () => {
              set_selected_item(null);
              set_uom_base("");
              set_qty_input("1");
            },
          },
        ],
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save production output registration.");
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
            Register Production Output
          </Text>
          <Text className="text-slate-400 text-xs">
            Enter production floor batch details
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {/* ITEM CODE SELECTOR */}
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Item Code
            </Text>
            <TouchableOpacity
              onPress={() => set_is_item_modal_visible(true)}
              activeOpacity={0.7}
              className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
            >
              <View className="flex-1 mr-2">
                <Text
                  className={`font-bold text-base ${
                    selected_item?.item_code
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {selected_item?.item_code || "Select Item Code"}
                </Text>
                {selected_item?.item_desc ? (
                  <Text
                    className="text-slate-500 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {selected_item.item_desc}
                  </Text>
                ) : null}
              </View>
              <ChevronDown size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* QUANTITY AND AUTOMATIC UOM ROW */}
          <View className="flex-row gap-3 mb-4 items-end">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Qty
              </Text>
              <TextInput
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900"
                value={qty_input}
                onChangeText={set_qty_input}
              />
            </View>

            {/* AUTOMATIC UOM (READ ONLY) */}
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                UOM
              </Text>
              <View className="bg-slate-100 border border-slate-200 p-4 rounded-xl">
                <Text
                  className={`font-bold text-base ${
                    uom_base ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {uom_base || "Auto"}
                </Text>
              </View>
            </View>
          </View>

          {/* BATCH CODE & LOT NUMBER ROW */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Batch Code
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-slate-900 text-base"
                value={batch_code}
                onChangeText={set_batch_code}
                autoCapitalize="characters"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Lot Number
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-slate-900 text-base"
                value={lot_number}
                onChangeText={set_lot_number}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* DATES SELECTION SECTION (MFG & EXPIRY) */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                MFG Date
              </Text>
              <TouchableOpacity
                onPress={() => set_show_mfg_picker(true)}
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
              >
                <Text className="font-bold text-sm text-slate-900">
                  {format_db_date(mfg_date)}
                </Text>
                <CalendarDays size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Expiry Date
              </Text>
              <TouchableOpacity
                onPress={() => set_show_expiry_picker(true)}
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
              >
                <Text className="font-bold text-sm text-slate-900">
                  {format_db_date(expiry_date)}
                </Text>
                <CalendarDays size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* STACKER ID & SHIFT ROW */}
          <View className="flex-row gap-3 mb-6 items-end">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Stacker ID
              </Text>
              <TextInput
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-slate-900 text-base"
                value={stacker_id}
                onChangeText={set_stacker_id}
                autoCapitalize="characters"
              />
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Shift
              </Text>
              <TouchableOpacity
                onPress={() => set_is_shift_modal_visible(true)}
                activeOpacity={0.7}
                className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
              >
                <Text
                  className={`font-bold text-base ${
                    shift ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {shift || "Select"}
                </Text>
                <ChevronDown size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* NATIVE DATE PICKERS */}
          {show_mfg_picker && (
            <DateTimePicker
              value={mfg_date}
              mode="date"
              display="default"
              onChange={(e, d) => {
                set_show_mfg_picker(false);
                if (d) set_mfg_date(d);
              }}
            />
          )}

          {show_expiry_picker && (
            <DateTimePicker
              value={expiry_date}
              mode="date"
              display="default"
              onChange={(e, d) => {
                set_show_expiry_picker(false);
                if (d) set_expiry_date(d);
              }}
            />
          )}

          {/* ACTION BUTTONS */}
          <TouchableOpacity
            onPress={handle_save_fg}
            activeOpacity={0.8}
            className="bg-emerald-600 py-5 rounded-2xl items-center mb-4"
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white text-lg"
            >
              Confirm & Register FG
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-slate-100 py-5 rounded-2xl justify-center items-center mb-12"
          >
            <Text className="text-slate-500 font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
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
          if (item?.uom_base) {
            set_uom_base(String(item.uom_base).toUpperCase());
          } else {
            set_uom_base("");
          }
          Vibration.vibrate(30);
        }}
      />

      {/* SHIFT SELECTION MODAL */}
      <Modal visible={is_shift_modal_visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-6 shadow-2xl pb-8">
            <View className="items-center mb-5">
              <View className="w-12 h-1 bg-slate-200 rounded-full mb-3" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Select Shift
              </Text>
            </View>
            <View className="flex-row gap-3 mb-6">
              {SHIFT_OPTIONS.map((opt) => {
                const isSelected = shift === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handle_select_shift(opt)}
                    activeOpacity={0.7}
                    className={`flex-1 py-4 rounded-xl border items-center justify-center ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Text
                      className={`font-black text-sm tracking-wide ${
                        isSelected ? "text-emerald-700" : "text-slate-700"
                      }`}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => set_is_shift_modal_visible(false)}
              className="w-full bg-slate-100 py-4 rounded-xl justify-center items-center"
            >
              <Text className="text-slate-500 font-bold text-sm">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default FG_Registration_Input;
