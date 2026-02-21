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
import { ClipboardList, Megaphone, Store } from "lucide-react-native";
import { ProgressChart } from "react-native-chart-kit";

const Welcome = ({ app_version }) => {
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

  const go_to_mcp_selection = () => {
    navigation.navigate("MCP Selection");
  };
  const go_to_box_counter = () => {
    // navigation.navigate("Box Counter");
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
              index: 0,
              routes: [{ name: "Login" }],
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

  const mcp_chart_config = {
    backgroundGradientFrom: "transparent",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "transparent",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
  };

  const data = {
    labels: [], // optional
    data: [0.55],
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View className="flex-1 justify-center items-center bg-gray-100">
        <View className="w-full pt-[50] pb-[20] px-5">
          <View>
            <Custom_Text className="text-sky-600 text-xl">Welcome</Custom_Text>
            <Custom_Text className="text-sky-600 text-3xl" weight="bold">
              Sem Sianghio
            </Custom_Text>
            <Custom_Text className="text-sky-600 text-sm mt-1">
              DEV-001
            </Custom_Text>
          </View>
        </View>
        <ScrollView className="w-full flex-1 px-5">
          <View className="flex flex-row bg-white p-4 border border-gray-200 rounded-lg mb-2">
            <View className="flex-1 justify-between">
              <View className="justify-center items-center bg-sky-100 py-2 px-4 mb-2 rounded self-start">
                <Custom_Text className="text-sky-700 text-sm" weight="bold">
                  MCP Compliance
                </Custom_Text>
              </View>
              <View>
                <Custom_Text className="text-sky-700 text-lg tracking-[0.4] mb-2">
                  15 out of 50
                </Custom_Text>
                <Custom_Text className="text-sky-700 text-xs">
                  These MCPs are for the month of January
                </Custom_Text>
              </View>
            </View>
            {/* <View className="w-[80] justify-center items-center">
              <ClipboardCheck color="#0284C7" size={42} />
            </View> */}
            <View className="relative items-center justify-center pr-1">
              <ProgressChart
                data={data}
                width={80}
                height={80}
                strokeWidth={10}
                radius={32}
                chartConfig={mcp_chart_config}
                hideLegend={true}
              />
              <View className="absolute items-center justify-center">
                <Custom_Text className="text-sky-700 text-base">
                  {(15 / 50) * 100}%
                </Custom_Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            className="flex flex-row bg-white p-4 border border-gray-200 rounded-lg mb-5"
            activeOpacity={0.8}
          >
            <View className="min-h-[80] w-[75] mr-[10] bg-sky-100 justify-center items-center rounded-md">
              <Megaphone color="#0284C7" size={42} />
            </View>
            <View className="flex-1">
              <Custom_Text className="text-sky-700 text-xl" weight="bold">
                Announcement
              </Custom_Text>
              <Custom_Text className="text-sky-700 text-xs mb-2">
                by Management
              </Custom_Text>
              <Custom_Text
                className="text-sky-700 text-xs text-justify"
                numberOfLines={3}
              >
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Totam
                expedita minima pariatur earum rerum esse veritatis porro soluta
                unde quasi impedit doloremque, repellat fuga autem? Deserunt
                quasi quas error labore!
              </Custom_Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="justify-center items-center bg-sky-600 py-[40] rounded-lg mb-2"
            activeOpacity={0.8}
            onPress={go_to_mcp_selection}
          >
            <View className="flex-row gap-2 items-center">
              <ClipboardList size={20} color="#fff" className="mr-2" />
              <Custom_Text
                className="text-white text-lg tracking-[0.5]"
                weight="semibold"
              >
                MCP Selection
              </Custom_Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="justify-center items-center bg-sky-600 py-[40] rounded-lg mb-2"
            activeOpacity={0.8}
          >
            <View className="flex-row gap-2 items-center">
              <Store size={20} color="#fff" className="mr-2" />
              <Custom_Text
                className="text-white text-lg tracking-[0.5]"
                weight="semibold"
              >
                Store Selection
              </Custom_Text>
            </View>
          </TouchableOpacity>
          {/* <TouchableOpacity
            className="justify-center items-center bg-sky-600 py-[40] rounded-lg mb-2"
            activeOpacity={0.8}
            onPress={go_to_box_counter}
          >
            <View className="flex-row gap-2 items-center">
              <Store size={20} color="#fff" className="mr-2" />
              <Custom_Text
                className="text-white text-lg tracking-[0.5]"
                weight="semibold"
              >
                Box Counter
              </Custom_Text>
            </View>
          </TouchableOpacity> */}
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

export default Welcome;
