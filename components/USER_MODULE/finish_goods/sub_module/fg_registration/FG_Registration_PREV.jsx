import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  PlusCircle,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  CalendarDays,
  X,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// FIREBASE INTEGRATION
import { firestore_db } from "@assets/scripts/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { format_date, get_date_now } from "@assets/scripts/functions/format";

const UOM_OPTIONS = [
  "BUNDLE",
  "BOX",
  "CASE",
  "PACK",
  "PAD",
  "PCS",
  "ROLL",
  "SACK",
];
const SHIFT_OPTIONS = ["DAY", "NIGHT"];

const FG_Registration = ({ navigation, route }) => {
  const { user_data } = route.params || {};

  // MAIN SESSION STATES
  const [fg_list, set_fg_list] = useState([]);
  const [current_date] = useState(new Date());
  const [is_input_modal_visible, set_is_input_modal_visible] = useState(false);

  // FORM FIELDS STATES
  const item_code_ref = useRef(null);
  const [loading, set_loading] = useState(false);
  const warehouse_code = "PROD";
  const sbin_code = "FG STAGING";

  const [item_code_input, set_item_code_input] = useState("");
  const [qty_input, set_qty_input] = useState("1");
  const [uom_base, set_uom_base] = useState("");
  const [batch_code, set_batch_code] = useState("");
  const [lot_number, set_lot_number] = useState("");
  const [stacker_id, set_stacker_id] = useState("");
  const [shift, set_shift] = useState("");

  const [mfg_date, set_mfg_date] = useState(new Date());
  const [expiry_date, set_expiry_date] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d;
  });

  // INNER PICKER/MODAL VISIBILITY STATES
  const [show_mfg_picker, set_show_mfg_picker] = useState(false);
  const [show_expiry_picker, set_show_expiry_picker] = useState(false);
  const [is_uom_modal_visible, set_is_uom_modal_visible] = useState(false);
  const [is_shift_modal_visible, set_is_shift_modal_visible] = useState(false);

  // PREVENT ACCIDENTAL NAVIGATION BACK
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Kung walang laman ang listahan, hayaan siyang mag-back nang walang warning
      if (fg_list.length === 0) {
        return;
      }

      // Pigilan muna ang default na pag-alis sa screen
      e.preventDefault();

      // Magpakita ng confirmation alert sa Ingles
      Alert.alert(
        "Discard Session?",
        "Going back will discard the current registration log for this session. Are you sure you want to leave?",
        [
          { text: "Stay", style: "cancel", onPress: () => {} },
          {
            text: "Exit",
            style: "destructive",
            // Ituloy ang pag-back kapag pinindot ang Discard
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, fg_list]);

  // Auto-focus handler when modal opens
  // useEffect(() => {
  //   if (is_input_modal_visible) {
  //     const timer = setTimeout(() => {
  //       item_code_ref.current?.focus();
  //     }, 400);
  //     return () => clearTimeout(timer);
  //   }
  // }, [is_input_modal_visible]);

  // DATE FORMATTERS
  const format_display_date = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const format_db_date = (date) => {
    return date.toISOString().split("T")[0];
  };

  // DELETE LOGIC
  const handle_remove_local_item = (id, lpn_id) => {
    Alert.alert(
      "Delete Record",
      `Are you sure you want to permanently delete LPN: ${lpn_id} from the database and this view?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            set_loading(true);
            try {
              const doc_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM/TBL_FG_REGISTRATION/DATA",
                id,
              );

              await deleteDoc(doc_ref);

              set_fg_list((prev_list) =>
                prev_list.filter((item) => item.id !== id),
              );

              Vibration.vibrate(50);
              Alert.alert(
                "Deleted",
                `LPN ${lpn_id} has been successfully deleted.`,
              );
            } catch (error) {
              console.error("Firebase Delete Error: ", error);
              Alert.alert(
                "Error",
                "Failed to delete the record from the database. Please try again.",
              );
            } finally {
              set_loading(false);
            }
          },
        },
      ],
    );
  };

  // CORE REGISTRATION LOGIC
  const handle_save_fg = async () => {
    if (
      !item_code_input ||
      !uom_base ||
      !qty_input ||
      !batch_code ||
      !stacker_id ||
      !shift
    ) {
      Alert.alert("Missing Info", "Please fill up all required fields.");
      return;
    }

    set_loading(true);
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
        lot_number: String(lot_number || "").toUpperCase(),
        stacker_id: String(stacker_id).toUpperCase(),
        shift: String(shift).toUpperCase(),
        created_by: String(user_data?.username || "ADMIN"),
        creation_date: String(creation_date_str),
        creation_time: creation_time_str,
        mfg_date: String(format_db_date(mfg_date)),
        expiry_date: String(format_db_date(expiry_date)),
        gr_number: "",
        item_code: String(item_code_input).toUpperCase(),
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

      set_fg_list((prev_list) => [
        { ...new_fg_entry, id: String(generated_lpn_id) },
        ...prev_list,
      ]);

      Vibration.vibrate(70);

      Alert.alert(
        "Success",
        `LPN ${generated_lpn_id} successfully registered.`,
        [
          {
            text: "Done",
            onPress: () => set_is_input_modal_visible(false),
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

  // FLATLIST CARD MEMO
  const FG_Card = React.memo(({ item }) => {
    return (
      <View className="bg-white mx-4 mb-2.5 p-4 rounded-xl border border-slate-200 shadow-sm">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center space-x-2 mb-0.5">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-base text-slate-900"
              >
                {item.item_code || "No Item Code"}
              </Text>
            </View>

            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-xs text-sky-600 mb-3"
            >
              LPN: {item.lpn_id}
            </Text>

            <View className="space-y-1.5">
              <Text className="text-xs text-slate-600">
                <Text className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">
                  Batch:{" "}
                </Text>
                {item.batch_code || "-"}
              </Text>
              <Text className="text-xs text-slate-600">
                <Text className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">
                  Lot No:{" "}
                </Text>
                {item.lot_number || "-"}
              </Text>
              <Text className="text-xs text-slate-600">
                <Text className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">
                  Stacker ID:{" "}
                </Text>
                {item.stacker_id || "-"}
              </Text>
            </View>

            <View className="mt-3 pt-2 border-t border-dashed border-slate-100 flex-row items-center space-x-3">
              <View className="flex-row items-center opacity-70">
                <Calendar size={11} color="#94a3b8" />
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-[10px] text-slate-400 ml-1"
                >
                  {item.creation_date || "-"}
                </Text>
              </View>
              <View className="ml-2 flex-row items-center opacity-70">
                <Clock size={11} color="#94a3b8" />
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-[10px] text-slate-400 ml-1"
                >
                  {item.creation_time || "-"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => handle_remove_local_item(item.id, item.lpn_id)}
            className="p-2 bg-rose-50 rounded-xl border border-rose-100/80 justify-center items-center"
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="mt-4 pt-3 border-t border-slate-100 flex-row justify-between items-center">
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-xs text-slate-400 uppercase tracking-wider"
          >
            Registered Qty
          </Text>
          <View className="flex-row items-baseline space-x-1">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-lg text-slate-900 leading-none"
            >
              {item.qty_base}
            </Text>
            <Text className="text-xs text-slate-400 uppercase font-medium ml-1">
              {item.uom_base || "PCS"}
            </Text>
          </View>
        </View>
      </View>
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {loading && !is_input_modal_visible && (
        <View className="absolute inset-0 z-50 bg-black/20 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}

      {/* SCREEN HEADER */}
      <View className="px-6 pb-4 flex-row items-center bg-white border-b border-slate-100">
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
            FG Registration
          </Text>
          <Text className="text-slate-500 text-xs">
            Current session registration log
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => set_is_input_modal_visible(true)}
          className="p-2"
        >
          <PlusCircle size={26} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* SESSION COUNTER BANNER */}
      <View className="bg-white px-6 py-3 border-b border-slate-200 flex-row items-center justify-between">
        <View>
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-400 text-[10px] uppercase tracking-wider"
          >
            Session Date
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-800 text-base mt-0.5"
          >
            {format_display_date(current_date)}
          </Text>
        </View>
        <View className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-emerald-600 text-xs"
          >
            {fg_list.length} {fg_list.length === 1 ? "Entry" : "Entries"} Added
          </Text>
        </View>
      </View>

      {/* MAIN DATA FLATLIST */}
      <FlatList
        data={fg_list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FG_Card item={item} />}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        removeClippedSubviews={Platform.OS === "android"}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-20 px-10">
            <Layers size={44} color="#cbd5e1" />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-400 text-base mt-4"
            >
              No Registered FG Yet
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-xs text-center mt-1 leading-4"
            >
              Touch the (+) button to begin registering production outputs for
              this session.
            </Text>
          </View>
        }
      />

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => set_is_input_modal_visible(true)}
        className="absolute bottom-7 right-7 bg-emerald-500 w-20 h-20 rounded-full justify-center items-center shadow-lg shadow-emerald-500/40 elevation-5"
      >
        <Plus size={34} color="white" />
      </TouchableOpacity>

      {/* REGISTRATION INPUT MODAL SCREEN */}
      <Modal
        visible={is_input_modal_visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => set_is_input_modal_visible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
          {loading && (
            <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
              <ActivityIndicator size="large" color="#0284c7" />
            </View>
          )}

          {/* MODAL HEADER */}
          <View className="px-6 pt-5 pb-4 flex-row items-center justify-between border-b border-slate-100">
            <View className="flex-1 pr-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Register Production Output
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Enter production floor batch details
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => set_is_input_modal_visible(false)}
              className="p-2 bg-slate-100 rounded-full justify-center items-center"
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView
              className="flex-1 px-6 pt-6"
              showsVerticalScrollIndicator={false}
            >
              {/* ITEM CODE */}
              <View className="mb-4">
                <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Item Code
                </Text>
                <TextInput
                  ref={item_code_ref}
                  className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-slate-900 text-base"
                  value={item_code_input}
                  onChangeText={set_item_code_input}
                  autoCapitalize="characters"
                />
              </View>

              {/* QUANTITY AND UOM */}
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

                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    UOM
                  </Text>
                  <TouchableOpacity
                    onPress={() => set_is_uom_modal_visible(true)}
                    activeOpacity={0.7}
                    className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex-row justify-between items-center"
                  >
                    <Text
                      className={`font-bold text-base ${uom_base ? "text-slate-900" : "text-slate-400"}`}
                    >
                      {uom_base || "Select"}
                    </Text>
                    <ChevronDown size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* BATCH CODE & LOT NUMBER */}
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

              {/* MFG & EXPIRY DATES */}
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

              {/* STACKER ID & SHIFT */}
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
                      className={`font-bold text-base ${shift ? "text-slate-900" : "text-slate-400"}`}
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

              {/* SAVE & SUBMIT ACTIONS */}
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
                onPress={() => set_is_input_modal_visible(false)}
                className="bg-slate-100 py-5 rounded-2xl justify-center items-center mb-12"
              >
                <Text className="text-slate-500 font-bold text-lg">Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* SUB-MODAL: UOM SELECTION */}
          <Modal
            visible={is_uom_modal_visible}
            transparent
            animationType="fade"
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-[40px] p-6 shadow-2xl pb-8">
                <View className="items-center mb-5">
                  <View className="w-12 h-1 bg-slate-200 rounded-full mb-3" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-xl text-slate-900"
                  >
                    Select Unit of Measure
                  </Text>
                </View>
                <View className="flex-row flex-wrap justify-start mb-6">
                  {UOM_OPTIONS.map((uom, index) => {
                    const isSelected = uom_base === uom;
                    const isThirdColumn = (index + 1) % 3 === 0;
                    return (
                      <TouchableOpacity
                        key={uom}
                        onPress={() => {
                          set_uom_base(uom);
                          set_is_uom_modal_visible(false);
                          Vibration.vibrate(30);
                        }}
                        activeOpacity={0.7}
                        style={{ marginRight: isThirdColumn ? 0 : "3.5%" }}
                        className={`w-[31%] py-3.5 rounded-xl border items-center justify-center mb-2 ${isSelected ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-100"}`}
                      >
                        <Text
                          className={`font-black text-xs tracking-wide ${isSelected ? "text-emerald-700" : "text-slate-700"}`}
                        >
                          {uom}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  onPress={() => set_is_uom_modal_visible(false)}
                  className="w-full bg-slate-100 py-4 rounded-xl justify-center items-center"
                >
                  <Text className="text-slate-500 font-bold text-sm">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* SUB-MODAL: SHIFT SELECTION */}
          <Modal
            visible={is_shift_modal_visible}
            transparent
            animationType="fade"
          >
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
                        onPress={() => {
                          set_shift(opt);
                          set_is_shift_modal_visible(false);
                          Vibration.vibrate(30);
                        }}
                        activeOpacity={0.7}
                        className={`flex-1 py-4 rounded-xl border items-center justify-center ${isSelected ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-100"}`}
                      >
                        <Text
                          className={`font-black text-sm tracking-wide ${isSelected ? "text-emerald-700" : "text-slate-700"}`}
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
                  <Text className="text-slate-500 font-bold text-sm">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default FG_Registration;
