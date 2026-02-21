import React, { useState } from "react";
import {
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  FlatList,
} from "react-native";
import Custom_Text from "@assets/elements/text/Custom_Text";
import {
  Calendar,
  CalendarCheck,
  CalendarPlus2,
  Check,
  Search,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

const MCP_Selection = ({
  app_version,
  mcp_list,
  set_selected_store_data,
  set_captured_store_image,
}) => {
  const navigation = useNavigation();

  // DATES
  const [start_date, set_start_date] = useState(new Date());
  const [end_date, set_end_date] = useState(new Date());
  const [show_start_date_picker, set_show_start_date_picker] = useState(false);
  const [show_end_date_picker, set_show_end_date_picker] = useState(false);

  const handle_start_date_change = (event, selectedDate) => {
    if (Platform.OS === "android") set_show_start_date_picker(false);
    if (selectedDate) set_start_date(selectedDate);
  };

  const handle_end_date_change = (event, selectedDate) => {
    if (Platform.OS === "android") set_show_end_date_picker(false);
    if (selectedDate) set_end_date(selectedDate);
  };

  const open_start_date_picker = () => set_show_start_date_picker(true);
  const open_end_date_picker = () => set_show_end_date_picker(true);

  // FORMAT DATE MM-DD-YYYY
  const format_mm_dd_yyyy = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  // SEARCH
  const [search_text, set_search_text] = useState("");

  // STATUS LOGIC
  const get_mcp_status = (mcp) => {
    const tasks = [mcp.osa_status, mcp.md_status, mcp.ep_status, mcp.ta_status];

    const all_true = tasks.every(Boolean);
    const all_false = tasks.every((t) => !t);

    if (all_true) return "Done";
    if (all_false) return "Not Done";
    return "On Going";
  };

  const status_styles = {
    Done: {
      border: "border-green-600",
      bg: "bg-green-100/50",
      text: "text-green-600",
      icon: "#16A34A",
      badge: "bg-green-600",
    },
    "Not Done": {
      border: "border-red-600",
      bg: "bg-red-100/50",
      text: "text-red-600",
      icon: "#DC2626",
      badge: "bg-red-600",
    },
    "On Going": {
      border: "border-yellow-500",
      bg: "bg-yellow-100/50",
      text: "text-yellow-500",
      icon: "#EAB308",
      badge: "bg-yellow-500",
    },
  };

  // FILTERING ------------------------------------
  const filtered_list = mcp_list.filter((mcp) => {
    // SEARCH FILTER
    const search = search_text.toLowerCase();
    const matchesSearch =
      mcp.store_code.toLowerCase().includes(search) ||
      mcp.store_desc.toLowerCase().includes(search);

    if (!matchesSearch) return false;

    // DATE RANGE FILTER
    if (!mcp.plan_visit || mcp.plan_visit === "MM-DD-YYYY") return false;

    const [mm, dd, yyyy] = mcp.plan_visit.split("-");
    const planDate = new Date(`${yyyy}-${mm}-${dd}`);

    const start = new Date(start_date);
    const end = new Date(end_date);

    planDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return planDate >= start && planDate <= end;
  });

  const handle_select_mcp = (data) => {
    set_captured_store_image(null);
    set_selected_store_data({ ...data, selection: "MCP" });
    navigation.navigate("Store Capture");
  };

  // BACK BUTTON
  const handle_go_back = () => navigation.goBack();
  // const handle_go_back = () => {
  //   navigation.reset({
  //     index: 0,
  //     routes: [{ name: "Login" }],
  //   });
  // };

  // RETURN UI
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="w-full pt-[60] pb-5 justify-center items-center bg-sky-600">
        <Custom_Text className="text-white text-xl tracking-[1]" weight="bold">
          MCP Selection
        </Custom_Text>
      </View>

      {/* Date Range & Search */}
      <View className="w-full bg-white border-b border-gray-300 p-4">
        <View className="flex flex-row gap-2 mb-2">
          {/* START DATE */}
          <View className="flex-1">
            <Custom_Text className="text-gray-400 text-sm mb-1">
              Start Date
            </Custom_Text>
            <TouchableOpacity
              activeOpacity={0.7}
              className="w-full relative"
              onPress={open_start_date_picker}
            >
              <View className="w-full border border-gray-300 rounded-lg py-3 px-4">
                <Custom_Text className="text-gray-700 text-sm">
                  {format_mm_dd_yyyy(start_date)}
                </Custom_Text>
              </View>
              <View className="absolute right-4 top-1/2 -translate-y-1/2">
                <Calendar color="#9ca3af" size={16} />
              </View>
            </TouchableOpacity>
          </View>

          {/* END DATE */}
          <View className="flex-1">
            <Custom_Text className="text-gray-400 text-sm mb-1">
              End Date
            </Custom_Text>
            <TouchableOpacity
              activeOpacity={0.7}
              className="w-full relative"
              onPress={open_end_date_picker}
            >
              <View className="w-full border border-gray-300 rounded-lg py-3 px-4">
                <Custom_Text className="text-gray-700 text-sm">
                  {format_mm_dd_yyyy(end_date)}
                </Custom_Text>
              </View>
              <View className="absolute right-4 top-1/2 -translate-y-1/2">
                <Calendar color="#9ca3af" size={16} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BOX */}
        <View className="w-full relative">
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={search_text}
            onChangeText={set_search_text}
            className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm pr-12"
            style={{ fontFamily: "Outfit-Regular" }}
          />
          <View className="absolute right-4 top-1/2 -translate-y-1/2">
            <Search color="#9ca3af" size={16} />
          </View>
        </View>
      </View>

      {/* LIST */}
      <View className="flex-1 bg-gray-100">
        <FlatList
          data={filtered_list}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 20,
          }}
          renderItem={({ item: mcp, index }) => {
            const status = get_mcp_status(mcp);
            const style = status_styles[status];
            const is_first = index === 0;
            const is_last = index === filtered_list.length - 1;
            const spacing = `${is_first ? "mt-[20]" : "mb-4"} ${
              is_last ? "mb-[20]" : "mb-4"
            }`;

            return (
              <TouchableOpacity
                key={mcp.id}
                activeOpacity={0.7}
                className={`flex flex-row border ${style.border} ${style.bg} rounded-xl ${spacing} p-4`}
                onPress={() => handle_select_mcp(mcp)}
              >
                {/* LEFT SIDE */}
                <View className="flex-1 justify-between">
                  <View>
                    <Custom_Text className={`${style.text} text-xs`}>
                      {mcp.store_code}
                    </Custom_Text>
                    <Custom_Text
                      className={`${style.text} text-sm`}
                      weight="semibold"
                    >
                      {mcp.store_desc}
                    </Custom_Text>
                  </View>

                  <View className="flex gap-2 mt-4">
                    {/* PLAN VISIT */}
                    <View className="flex flex-row gap-1">
                      <View className="h-[25] w-[25] justify-center items-center">
                        <CalendarPlus2 color={style.icon} size={18} />
                      </View>
                      <View>
                        <Custom_Text
                          className={`${style.text} text-xs`}
                          weight="light"
                        >
                          PLAN VISIT
                        </Custom_Text>
                        <Custom_Text
                          className={`${style.text} text-xs`}
                          weight="semibold"
                        >
                          {mcp.plan_visit || "MM-DD-YYYY"}
                        </Custom_Text>
                      </View>
                    </View>

                    {/* ACTUAL VISIT */}
                    <View className="flex flex-row gap-1">
                      <View className="h-[25] w-[25] justify-center items-center">
                        <CalendarCheck color={style.icon} size={18} />
                      </View>
                      <View>
                        <Custom_Text
                          className={`${style.text} text-xs`}
                          weight="light"
                        >
                          ACTUAL VISIT
                        </Custom_Text>
                        <Custom_Text
                          className={`${style.text} text-xs`}
                          weight="semibold"
                        >
                          {mcp.actual_visit || "MM-DD-YYYY"}
                        </Custom_Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* RIGHT SIDE */}
                <View className="w-[120] ml-4">
                  {/* STATUS BADGE */}
                  <View
                    className={`justify-center items-center ${style.badge} py-2 px-4 mb-3 rounded`}
                  >
                    <Custom_Text className="text-white text-sm" weight="bold">
                      {status}
                    </Custom_Text>
                  </View>

                  {/* CHECKLIST */}
                  {[
                    { label: "On-Shelf Availability", value: mcp.osa_status },
                    { label: "Merch Deployment", value: mcp.md_status },
                    { label: "Execution Planner", value: mcp.ep_status },
                    { label: "Trade Audit", value: mcp.ta_status },
                  ].map((task, i) => (
                    <View
                      key={i}
                      className="flex flex-row gap-2 items-center mb-2"
                    >
                      <View
                        className={`h-[15] w-[15] justify-center items-center border ${style.border}`}
                      >
                        {task.value && <Check color={style.icon} size={10} />}
                      </View>
                      <Custom_Text className={`${style.text} text-xs`}>
                        {task.label}
                      </Custom_Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      {/* CANCEL BUTTON */}
      <View className="w-full p-5 bg-white border-t border-gray-200">
        <TouchableOpacity
          className="w-full h-[50] bg-white border border-gray-400 justify-center items-center rounded-lg"
          activeOpacity={0.8}
          onPress={handle_go_back}
        >
          <Custom_Text className="text-gray-500 text-center text-base tracking-[0.4]">
            Cancel
          </Custom_Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKERS */}
      {show_start_date_picker && (
        <DateTimePicker
          value={start_date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handle_start_date_change}
        />
      )}
      {show_end_date_picker && (
        <DateTimePicker
          value={end_date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handle_end_date_change}
        />
      )}
    </View>
  );
};

export default MCP_Selection;
