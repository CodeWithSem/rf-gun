import React from "react";

const Template_1 = () => {
  return (
    <React.Fragment>
      <View className="flex-1 justify-center items-center">
        <View className="w-full h-[100] bg-white border-b border-gray-200"></View>
        <ScrollView className="w-full flex-1 px-5">
          <Custom_Text className="mt-[20]">MCP Selection</Custom_Text>
          <View className="h-[1000] bg-gray-300 mb-[20]"></View>
        </ScrollView>
        <View className="w-full p-5 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="w-full h-[50] bg-sky-600 justify-center items-center rounded-lg"
            activeOpacity={0.8}
            onPress={get_server_date}
          >
            <Custom_Text className="text-white text-center text-base font-bold tracking-[2px]">
              LOGOUT
            </Custom_Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );
};

export default Template_1;
