import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Clock,
} from "lucide-react-native";
import { firestore_db } from "@assets/scripts/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  format_date_sort,
  get_date_now,
  get_iso_date_now,
} from "../../../../../assets/scripts/functions/format";

const Create_Downtime = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const [loading, set_loading] = useState(false);

  // FORM FIELDS
  const [machine_no, set_machine_no] = useState("");
  const [product, set_product] = useState("");
  const [shift, set_shift] = useState("DAY");
  const [operator_ic, set_operator_ic] = useState("");
  const [qc_line_ic, set_qc_line_ic] = useState("");

  const [reprocess, set_reprocess] = useState("0");
  const [counter, set_counter] = useState("0");
  const [total_reject, set_total_reject] = useState("0");
  const [rm_waste, set_rm_waste] = useState("0");
  const [note, set_note] = useState("");

  const [downtime_list, set_downtime_list] = useState([]);

  // GENERIC MODAL INPUT STATES
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [modal_title, set_modal_title] = useState("");
  const [modal_value, set_modal_value] = useState("");
  const [modal_field, set_modal_field] = useState("");
  const [is_multiline, set_is_multiline] = useState(false);
  const [keyboard_type, set_keyboard_type] = useState("default");

  // LISTEN FOR ADDED/EDITED ITEMS FROM ADD_REPORT PAGE
  useEffect(() => {
    if (route.params?.new_item) {
      set_downtime_list((prev) => [...prev, route.params.new_item]);
      navigation.setParams({ new_item: null });
    }
    if (route.params?.updated_item && route.params?.index !== undefined) {
      const updated = [...downtime_list];
      updated[route.params.index] = route.params.updated_item;
      set_downtime_list(updated);
      navigation.setParams({ updated_item: null, index: undefined });
    }
  }, [route.params]);

  const open_input_modal = (
    title,
    field,
    currentValue,
    multiline = false,
    kType = "default",
  ) => {
    set_modal_title(title);
    set_modal_field(field);
    set_modal_value(String(currentValue || ""));
    set_is_multiline(multiline);
    set_keyboard_type(kType);
    set_is_modal_visible(true);
  };

  const handle_confirm_modal = () => {
    switch (modal_field) {
      case "machine_no":
        set_machine_no(modal_value);
        break;
      case "product":
        set_product(modal_value);
        break;
      case "operator_ic":
        set_operator_ic(modal_value);
        break;
      case "qc_line_ic":
        set_qc_line_ic(modal_value);
        break;
      case "reprocess":
        set_reprocess(modal_value);
        break;
      case "counter":
        set_counter(modal_value);
        break;
      case "total_reject":
        set_total_reject(modal_value);
        break;
      case "rm_waste":
        set_rm_waste(modal_value);
        break;
      case "note":
        set_note(modal_value);
        break;
      default:
        break;
    }
    set_is_modal_visible(false);
  };

  const delete_downtime_item = (index) => {
    Vibration.vibrate(50);
    Alert.alert("Delete Item", "Are you sure you want to remove this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          set_downtime_list((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const total_minutes = downtime_list.reduce(
    (acc, curr) => acc + Number(curr.minutes || 0),
    0,
  );

  const handle_save = async () => {
    if (!machine_no || !product || !operator_ic || !qc_line_ic) {
      Alert.alert(
        "Missing Fields",
        "Please complete all required report header details.",
      );
      return;
    }

    set_loading(true);
    const now = new Date().toISOString();
    const doc_id = `DTR-${Date.now()}`;

    const user_fullname = `${user_data?.first_name} ${user_data?.last_name}`;

    const new_report = {
      id: doc_id,
      doc_code: doc_id,
      doc_owner: "PRODUCTION DEPARTMENT",
      issue_no: "01",
      revision_no: "01",
      revision_date: get_iso_date_now(),
      effect_date: get_iso_date_now(),
      control_no: "26-152",
      machine_no,
      product,
      shift,
      creation_date: get_iso_date_now(),
      creation_date_sort: format_date_sort(get_date_now()),
      created_by: user_fullname,
      operator_ic,
      qc_line_ic,
      downtime_list,
      total_minutes,
      reprocess: parseFloat(reprocess) || 0,
      counter: parseFloat(counter) || 0,
      total_reject: parseFloat(total_reject) || 0,
      rm_waste: parseFloat(rm_waste) || 0,
      note,
      username_ref: user_data?.username || "",
    };

    try {
      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_DOWNTIME_REPORT",
        "DATA",
        doc_id,
      );
      await setDoc(doc_ref, new_report);
      Vibration.vibrate(70);
      Alert.alert("Success", "Downtime Report saved successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save downtime report.");
    } finally {
      set_loading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#e11d48" />
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
            Create Downtime Report
          </Text>
          <Text className="text-rose-600 font-bold text-xs">New Report</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER INPUTS */}
        <Text className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
          Report Details
        </Text>

        <TouchableOpacity
          onPress={() =>
            open_input_modal(
              "Machine No.",
              "machine_no",
              machine_no,
              false,
              "numeric",
            )
          }
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Machine No
            </Text>
            <Text className="font-bold text-base text-slate-900">
              {machine_no || ""}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => open_input_modal("Product Name", "product", product)}
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Product
            </Text>
            <Text className="font-bold text-base text-slate-900">
              {product || ""}
            </Text>
          </View>
        </TouchableOpacity>

        {/* SHIFT SELECTOR */}
        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            onPress={() => set_shift("DAY")}
            className={`flex-1 p-4 rounded-xl border ${shift === "DAY" ? "bg-rose-50 border-rose-600" : "bg-slate-50 border-slate-300"}`}
          >
            <Text
              className={`font-bold text-center ${shift === "DAY" ? "text-rose-600" : "text-slate-500"}`}
            >
              DAY SHIFT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => set_shift("NIGHT")}
            className={`flex-1 p-4 rounded-xl border ${shift === "NIGHT" ? "bg-rose-50 border-rose-600" : "bg-slate-50 border-slate-300"}`}
          >
            <Text
              className={`font-bold text-center ${shift === "NIGHT" ? "text-rose-600" : "text-slate-500"}`}
            >
              NIGHT SHIFT
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() =>
              open_input_modal("Operator In-Charge", "operator_ic", operator_ic)
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-4 rounded-xl justify-between flex-row items-center"
          >
            <View className="flex-1">
              <Text className="text-[9px] font-bold text-slate-400 uppercase">
                Operator In-Charge
              </Text>
              <Text
                className="font-bold text-sm text-slate-900"
                numberOfLines={1}
              >
                {operator_ic || ""}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              open_input_modal("QC in Line In-Charge", "qc_line_ic", qc_line_ic)
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-4 rounded-xl justify-between flex-row items-center"
          >
            <View className="flex-1">
              <Text className="text-[9px] font-bold text-slate-400 uppercase">
                QC in Line In-Charge
              </Text>
              <Text
                className="font-bold text-sm text-slate-900"
                numberOfLines={1}
              >
                {qc_line_ic || ""}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* DOWNTIME LIST SECTION HEADER */}
        <View className="flex-row justify-between items-center mb-3 mt-2">
          <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Downtime Entries ({downtime_list.length})
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-rose-600 mr-1">
              Total: {total_minutes} mins
            </Text>
          </View>
        </View>

        {/* LIST OF DOWNTIME ITEMS */}
        {downtime_list.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("edit_report", {
                item_data: item,
                index: index,
                onEditItem: (updatedItem, itemIndex) => {
                  // I-update ang item sa list state ayon sa index nito
                  set_downtime_list((prevList) => {
                    const newList = [...prevList];
                    newList[itemIndex] = updatedItem;
                    return newList;
                  });
                },
              })
            }
            className="bg-white border border-slate-200 p-4 rounded-2xl mb-3 shadow-sm relative overflow-hidden"
          >
            {/* LEFT ACCENT BAR */}
            <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />

            {/* CARD HEADER: TIME RANGE & DURATION */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row gap-2">
                <Text className="text-lg font-bold text-rose-700">
                  # {index + 1}
                </Text>
                <View className="flex-row items-center bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                  <Clock size={13} color="#e11d48" />
                  <Text className="text-rose-700 font-bold text-xs ml-1.5">
                    {item.downtime_start} - {item.downtime_end}
                  </Text>
                </View>
                {/* DURATION BADGE */}
                <View className="flex-row items-center bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                  <Text className="text-rose-700 font-bold text-xs">
                    {item.minutes} mins
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => delete_downtime_item(index)}
                className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg z-10 active:opacity-70"
              >
                <Trash2 size={15} color="#e11d48" />
              </TouchableOpacity>
            </View>

            {/* DELETE BUTTON (ABSOLUTE TOP RIGHT) */}

            {/* MAIN CONTENT AREA */}
            <View className="gap-y-2">
              {/* CAUSE */}
              <View className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                <Text className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">
                  Cause of Downtime
                </Text>
                <Text
                  className="text-xs font-semibold text-rose-800"
                  numberOfLines={2}
                >
                  {item.downtime_cause || "N/A"}
                </Text>
              </View>

              {/* QUALITY ISSUE (FULL-WIDTH ROW) */}
              {item.quality_issue ? (
                <View className="bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-xl">
                  <Text className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                    Quality Issue
                  </Text>
                  <Text
                    className="text-xs font-medium text-amber-900"
                    numberOfLines={2}
                  >
                    {item.quality_issue}
                  </Text>
                </View>
              ) : null}

              {/* CORRECTIVE ACTION (FULL-WIDTH ROW) */}
              {item.correct_action ? (
                <View className="bg-emerald-50/60 border border-emerald-200/60 p-2.5 rounded-xl">
                  <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                    Corrective Action
                  </Text>
                  <Text
                    className="text-xs font-medium text-emerald-900"
                    numberOfLines={2}
                  >
                    {item.correct_action}
                  </Text>
                </View>
              ) : null}

              {/* REMARKS (IF PRESENT) */}
              {item.remarks ? (
                <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Remarks / Section
                  </Text>
                  <Text
                    className="text-xs font-semibold text-slate-800"
                    numberOfLines={1}
                  >
                    {item.remarks || ""}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}

        {/* INLINE "ADD REPORT / ENTRY" BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("add_report", {
              onAddItem: (newItem) => {
                // I-append ang bagong downtime item sa state list dito
                set_downtime_list((prev) => [...prev, newItem]);
              },
            })
          }
          className="bg-rose-50 border border-dashed border-rose-400 p-4 rounded-2xl flex-row justify-center items-center mb-6"
        >
          <Plus size={18} color="#e11d48" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-rose-600 ml-2 text-sm"
          >
            Add Downtime Entry
          </Text>
        </TouchableOpacity>

        {/* METRICS & NOTES */}
        <Text className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
          Production Metrics
        </Text>

        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            onPress={() =>
              open_input_modal(
                "Reprocess",
                "reprocess",
                reprocess,
                false,
                "numeric",
              )
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-3 rounded-xl"
          >
            <Text className="text-[9px] font-bold text-slate-400">
              REPROCESS
            </Text>
            <Text className="text-base font-bold text-slate-900">
              {reprocess}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              open_input_modal("Counter", "counter", counter, false, "numeric")
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-3 rounded-xl"
          >
            <Text className="text-[9px] font-bold text-slate-400">COUNTER</Text>
            <Text className="text-base font-bold text-slate-900">
              {counter}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            onPress={() =>
              open_input_modal(
                "Total Reject",
                "total_reject",
                total_reject,
                false,
                "numeric",
              )
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-3 rounded-xl"
          >
            <Text className="text-[9px] font-bold text-slate-400">
              TOTAL REJECT
            </Text>
            <Text className="text-base font-bold text-slate-900">
              {total_reject}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              open_input_modal(
                "RM Waste",
                "rm_waste",
                rm_waste,
                false,
                "numeric",
              )
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-3 rounded-xl"
          >
            <Text className="text-[9px] font-bold text-slate-400">
              RM WASTE
            </Text>
            <Text className="text-base font-bold text-slate-900">
              {rm_waste}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => open_input_modal("Report Note", "note", note, true)}
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-6"
        >
          <Text className="text-[9px] font-bold text-slate-400 uppercase">
            Additional Note
          </Text>
          <Text className="font-bold text-sm text-slate-900" numberOfLines={3}>
            {note || ""}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SAVE BUTTON */}
      <View className="p-4 bg-white border-t border-slate-100">
        <TouchableOpacity
          onPress={handle_save}
          activeOpacity={0.8}
          className="bg-rose-600 py-4 rounded-2xl justify-center items-center"
        >
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white text-base"
          >
            Create Downtime Report
          </Text>
        </TouchableOpacity>
      </View>

      {/* GENERIC INPUT MODAL */}
      <Modal visible={is_modal_visible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 max-w-sm">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-lg text-slate-900 mb-3"
            >
              {modal_title}
            </Text>
            <TextInput
              multiline={is_multiline}
              numberOfLines={is_multiline ? 4 : 1}
              keyboardType={keyboard_type}
              value={modal_value}
              onChangeText={set_modal_value}
              className="bg-slate-50 border border-slate-300 p-4 rounded-xl font-bold text-base text-slate-900 mb-6"
              style={{ textAlignVertical: is_multiline ? "top" : "center" }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => set_is_modal_visible(false)}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl justify-center items-center"
              >
                <Text className="text-slate-500 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handle_confirm_modal}
                className="flex-1 bg-rose-600 py-3.5 rounded-xl justify-center items-center"
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

export default Create_Downtime;
