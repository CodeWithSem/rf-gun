import React, { useEffect, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  Alert,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Custom_Text from "@assets/elements/text/Custom_Text";
import axios from "axios";
import { format_date_dash } from "@assets/scripts/format/date_format";
import {
  CalendarCheck,
  CalendarPlus2,
  Check,
  ClipboardList,
  Megaphone,
  Store,
} from "lucide-react-native";
import { ProgressChart } from "react-native-chart-kit";

const Main = ({ app_version, selected_store_data }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    const onBackPress = () => {
      if (isFocused) {
        handle_logout();
        return true; // prevent default back action
      }
      return false; // allow default back action for other screens
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove();
  }, [isFocused]);

  const handle_navigation = (title) => {
    navigation.navigate(title);
  };

  const handle_logout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            navigation.reset({
              index: 1,
              routes: [{ name: "Welcome" }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const get_server_date = async () => {
    while (true) {
      try {
        const res = await axios.get(
          "https://worldtimeapi.org/api/timezone/Asia/Manila"
        );
        console.log("Server Time:", format_date_dash(res.data.datetime));
        return res.data.datetime;
      } catch (error) {
        console.log("Error fetching time, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2s
      }
    }
  };

  const cardsData = [
    {
      title: "On-Shelf Availability",
      total: 90,
      target: 200,
      percentage: (90 / 200) * 100,
      data: [90 / 200],
    },
    {
      title: "Merch Deployment",
      total: 15,
      target: 50,
      percentage: (15 / 50) * 100,
      data: [15 / 50],
    },
    {
      title: "Execution Planner",
      total: 2,
      target: 5,
      percentage: (2 / 5) * 100,
      data: [2 / 5],
    },
    {
      title: "Trade Audit",
      total: 12,
      target: 15,
      percentage: (12 / 15) * 100,
      data: [12 / 15],
    },
    // more cards...
  ];

  const chartConfig = {
    backgroundGradientFrom: "transparent",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "transparent",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
  };

  const data = {
    labels: [], // optional
    data: [0.55],
  };

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

  const status = get_mcp_status(selected_store_data);
  const style = status_styles[status];

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ScrollView className="w-full flex-1 px-5">
          <View className="w-full mt-[50] mb-2">
            <View>
              <Custom_Text className="text-sky-600 text-2xl" weight="bold">
                Hey there, Sem
              </Custom_Text>
              <Custom_Text className="text-sky-600 text-sm">
                How's your day?
              </Custom_Text>
            </View>
          </View>
          {selected_store_data.selection === "MCP" && (
            <View
              key={selected_store_data.id}
              activeOpacity={0.7}
              className={`flex flex-row border ${style.border} ${style.bg} rounded-xl p-4 mb-2`}
              // onPress={() => handle_select_mcp(mcp)}
            >
              {/* LEFT SIDE */}
              <View className="flex-1 justify-between">
                <View>
                  <Custom_Text className={`${style.text} text-xs`}>
                    {selected_store_data.store_code}
                  </Custom_Text>
                  <Custom_Text
                    className={`${style.text} text-sm`}
                    weight="semibold"
                  >
                    {selected_store_data.store_desc}
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
                        {selected_store_data.plan_visit || "MM-DD-YYYY"}
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
                        {selected_store_data.actual_visit || "MM-DD-YYYY"}
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
                  {
                    label: "On-Shelf Availability",
                    value: selected_store_data.osa_status,
                  },
                  {
                    label: "Merch Deployment",
                    value: selected_store_data.md_status,
                  },
                  {
                    label: "Execution Planner",
                    value: selected_store_data.ep_status,
                  },
                  {
                    label: "Trade Audit",
                    value: selected_store_data.ta_status,
                  },
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
            </View>
          )}

          {selected_store_data.selection === "Store" && (
            <View className="flex flex-row bg-white p-2 border border-gray-200 rounded-lg mb-2">
              <View className="flex-1 justify-between">
                <View className="justify-center items-center bg-sky-100 py-2 px-4 mb-2 rounded">
                  <Custom_Text className="text-sky-700 text-sm" weight="bold">
                    Selected Store
                  </Custom_Text>
                </View>
                <View className="p-2">
                  <Custom_Text className="text-sky-700 text-xs">
                    {selected_store_data.store_code}
                  </Custom_Text>
                  <Custom_Text
                    className="text-sky-700 text-lg"
                    weight="semibold"
                  >
                    {selected_store_data.store_desc}
                  </Custom_Text>
                </View>
              </View>
            </View>
          )}
          {/* Make this grid-cols-2 */}
          <View className="mb-2">
            {cardsData.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                className="flex flex-row bg-white p-3 border border-gray-200 rounded-lg mb-2"
                onPress={() => handle_navigation(item.title)}
              >
                <View className="flex-1 justify-between">
                  <View className="justify-center items-center bg-sky-100 py-2 px-4 mb-2 rounded self-start">
                    <Custom_Text className="text-sky-700 text-xs" weight="bold">
                      {item.title}
                    </Custom_Text>
                  </View>
                  <View>
                    <Custom_Text className="text-sky-700 text-base mb-2">
                      {item.total} out of {item.target}
                    </Custom_Text>
                  </View>
                </View>

                <View className="relative items-center justify-center pr-1">
                  <ProgressChart
                    data={item.data}
                    width={60}
                    height={60}
                    strokeWidth={7}
                    radius={24}
                    chartConfig={chartConfig}
                    hideLegend={true}
                  />
                  <View className="absolute items-center justify-center">
                    <Custom_Text className="text-sky-700 text-base">
                      {item.percentage}%
                    </Custom_Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View className="w-full p-5">
          <TouchableOpacity
            className="w-full h-[50] bg-sky-600 justify-center items-center rounded-lg"
            activeOpacity={0.8}
            onPress={handle_logout}
          >
            <Custom_Text
              className="text-white text-center text-base tracking-[1]"
              weight="bold"
            >
              LOGOUT
            </Custom_Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );
};

export default Main;
