import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronDown } from "lucide-react-native";

const Edit_Report = ({ navigation, route }) => {
  const { item_data, index } = route.params || {};

  const [downtime_start, set_downtime_start] = useState(
    item_data?.downtime_start || "",
  );
  const [downtime_end, set_downtime_end] = useState(
    item_data?.downtime_end || "",
  );
  const [downtime_cause, set_downtime_cause] = useState(
    item_data?.downtime_cause || "",
  );
  const [quality_issue, set_quality_issue] = useState(
    item_data?.quality_issue || "",
  );
  const [correct_action, set_correct_action] = useState(
    item_data?.correct_action || "",
  );
  const [remarks, set_remarks] = useState(item_data?.remarks || "");

  // MODAL STATES
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [modal_title, set_modal_title] = useState("");
  const [modal_value, set_modal_value] = useState("");
  const [modal_field, set_modal_field] = useState("");
  const [is_multiline, set_is_multiline] = useState(false);

  // AUTO CALCULATION LOGIC FOR MINUTES
  const calculate_minutes = (start, end) => {
    if (!start || !end) return 0;
    try {
      const parse_time = (tStr) => {
        // Regex para makuha ang Hours, Minutes, at AM/PM kahit walang space
        const match = tStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return null;

        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const modifier = match[3] ? match[3].toUpperCase() : null;

        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        return hours * 60 + minutes;
      };

      const start_m = parse_time(start);
      const end_m = parse_time(end);

      if (start_m === null || end_m === null) return 0;

      let diff = end_m - start_m;

      // Kapag tumawid ng midnight (e.g., 11:00 PM to 1:00 AM)
      if (diff < 0) {
        diff += 24 * 60; // Magdagdag ng 1440 minutes (24 hours)
      }

      return diff;
    } catch (e) {
      return 0;
    }
  };

  const minutes = calculate_minutes(downtime_start, downtime_end);

  const open_modal = (title, field, val, multiline = false) => {
    set_modal_title(title);
    set_modal_field(field);
    set_modal_value(val);
    set_is_multiline(multiline);
    set_is_modal_visible(true);
  };

  const handle_confirm_modal = () => {
    switch (modal_field) {
      case "downtime_start":
        set_downtime_start(modal_value);
        break;
      case "downtime_end":
        set_downtime_end(modal_value);
        break;
      case "downtime_cause":
        set_downtime_cause(modal_value);
        break;
      case "quality_issue":
        set_quality_issue(modal_value);
        break;
      case "correct_action":
        set_correct_action(modal_value);
        break;
      case "remarks":
        set_remarks(modal_value);
        break;
      default:
        break;
    }
    set_is_modal_visible(false);
  };

  const handle_save_changes = () => {
    if (!downtime_start || !downtime_end || !downtime_cause) {
      Alert.alert(
        "Missing Input",
        "Please provide start time, end time, and cause.",
      );
      return;
    }

    const updated_item = {
      downtime_start: downtime_start.toUpperCase(),
      downtime_end: downtime_end.toUpperCase(),
      minutes,
      downtime_cause,
      quality_issue,
      correct_action,
      remarks,
    };

    // Tawagin ang callback mula sa route.params kapalit ng navigation.navigate
    if (route.params?.onEditItem) {
      route.params.onEditItem(updated_item, index);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Edit Downtime Entry
          </Text>
          <Text className="text-slate-400 font-bold text-xs">
            Entry Index #{index + 1}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            onPress={() =>
              open_modal("Start Time", "downtime_start", downtime_start)
            }
            className="flex-1 bg-slate-50 border border-slate-300 p-4 rounded-xl"
          >
            <Text className="text-[9px] font-bold text-slate-400">
              START TIME
            </Text>
            <Text className="font-bold text-sm text-slate-900">
              {downtime_start}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => open_modal("End Time", "downtime_end", downtime_end)}
            className="flex-1 bg-slate-50 border border-slate-300 p-4 rounded-xl"
          >
            <Text className="text-[9px] font-bold text-slate-400">
              END TIME
            </Text>
            <Text className="font-bold text-sm text-slate-900">
              {downtime_end}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-slate-100 border border-slate-200 p-4 rounded-xl mb-4">
          <Text className="text-[9px] font-bold text-slate-400 uppercase">
            Calculated Duration
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-lg text-rose-600"
          >
            {minutes} Mins
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            open_modal("Downtime Cause", "downtime_cause", downtime_cause, true)
          }
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View className="flex-1 pr-2">
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Downtime Cause
            </Text>
            <Text
              className="font-bold text-sm text-slate-900"
              numberOfLines={2}
            >
              {downtime_cause}
            </Text>
          </View>
          <ChevronDown size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            open_modal("Quality Issue", "quality_issue", quality_issue, true)
          }
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View className="flex-1 pr-2">
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Quality Issue
            </Text>
            <Text
              className="font-bold text-sm text-slate-900"
              numberOfLines={2}
            >
              {quality_issue}
            </Text>
          </View>
          <ChevronDown size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            open_modal(
              "Corrective Action",
              "correct_action",
              correct_action,
              true,
            )
          }
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View className="flex-1 pr-2">
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Corrective Action
            </Text>
            <Text
              className="font-bold text-sm text-slate-900"
              numberOfLines={2}
            >
              {correct_action}
            </Text>
          </View>
          <ChevronDown size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => open_modal("Remarks", "remarks", remarks)}
          className="bg-slate-50 border border-slate-300 p-4 rounded-xl mb-6 flex-row justify-between items-center"
        >
          <View className="flex-1 pr-2">
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Remarks
            </Text>
            <Text
              className="font-bold text-sm text-slate-900"
              numberOfLines={1}
            >
              {remarks}
            </Text>
          </View>
          <ChevronDown size={18} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>

      {/* SAVE BUTTON */}
      <View className="p-4 bg-white border-t border-slate-100">
        <TouchableOpacity
          onPress={handle_save_changes}
          activeOpacity={0.8}
          className="bg-rose-600 py-4 rounded-2xl justify-center items-center"
        >
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white text-base"
          >
            Apply Changes
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
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

export default Edit_Report;
