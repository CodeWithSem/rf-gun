import React from "react";
import Custom_Text from "@assets/elements/text/Custom_Text";
import {
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CalendarPlus2, Camera } from "lucide-react-native";

const Store_Capture = ({ selected_store_data, captured_store_image }) => {
  const navigation = useNavigation();
  const handle_camera_overlay = () => navigation.navigate("Capture Image");
  const handle_go_to_main = () => navigation.navigate("Main");
  const handle_go_back = () => navigation.goBack();

  // Get screen width
  const screenWidth = Dimensions.get("window").width;

  // Calculate box width (px-5 = 20 padding each side in Tailwind = 40 total)
  const boxWidth = screenWidth - 40; // px-5 * 2
  return (
    <React.Fragment>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="w-full pt-[60] pb-5 justify-center items-center bg-sky-600">
          <Custom_Text
            className="text-white text-xl tracking-[1]"
            weight="bold"
          >
            Store Capture
          </Custom_Text>
        </View>
        <ScrollView className="flex-1 px-5 bg-gray-100">
          <View className="flex flex-row bg-white p-2 border border-gray-200 rounded-lg my-5">
            <View className="flex-1 justify-between">
              <View className="justify-center items-center bg-sky-100 py-2 px-4 mb-2 rounded">
                <Custom_Text className="text-sky-700 text-sm" weight="bold">
                  {selected_store_data.selection === "MCP"
                    ? "Selected MCP"
                    : "Selected Store"}
                </Custom_Text>
              </View>
              <View className="p-2">
                <Custom_Text className="text-sky-700 text-xs">
                  {selected_store_data.store_code}
                </Custom_Text>
                <Custom_Text className="text-sky-700 text-lg" weight="semibold">
                  {selected_store_data.store_desc}
                </Custom_Text>
                {selected_store_data.selection === "MCP" && (
                  <View className="flex flex-row gap-1 mt-4">
                    <View className="h-[25] w-[25] justify-center items-center">
                      <CalendarPlus2 color={"#0284C7"} size={18} />
                    </View>
                    <View>
                      <Custom_Text
                        className="text-sky-700 text-xs"
                        weight="light"
                      >
                        PLAN VISIT
                      </Custom_Text>
                      <Custom_Text
                        className="text-sky-700 text-xs"
                        weight="semibold"
                      >
                        {selected_store_data.plan_visit}
                      </Custom_Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
          {/* Dynamic square box */}
          <TouchableOpacity
            className="items-center mb-[20]"
            activeOpacity={0.7}
            onPress={handle_camera_overlay}
          >
            <View
              className="p-2 border border-sky-600 rounded-lg justify-center items-center"
              style={{ width: boxWidth, height: boxWidth }}
            >
              {captured_store_image ? (
                <>
                  <Image
                    style={{
                      width: boxWidth - 8,
                      height: boxWidth - 8,
                      borderRadius: 5,
                    }}
                    source={{ uri: captured_store_image }}
                  />
                </>
              ) : (
                <Camera color={"#0284C7"} size={90} />
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>
        {/* CANCEL BUTTON */}
        <View className="w-full flex-row gap-2 p-5 bg-white border-t border-gray-200">
          {captured_store_image && (
            <TouchableOpacity
              className="flex-1 h-[50] bg-sky-600 justify-center items-center rounded-lg"
              activeOpacity={0.8}
              onPress={handle_go_to_main}
            >
              <Custom_Text className="text-white text-center text-base tracking-[0.4]">
                Proceed
              </Custom_Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="flex-1 h-[50] bg-white border border-gray-400 justify-center items-center rounded-lg"
            activeOpacity={0.8}
            onPress={handle_go_back}
          >
            <Custom_Text className="text-gray-500 text-center text-base tracking-[0.4]">
              Cancel
            </Custom_Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );
};

export default Store_Capture;
