import { Search } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Custom_Text from "@assets/elements/text/Custom_Text";

const Select_Brand = ({
  display_modal,
  set_display_modal,
  set_selected_brand,
  set_selected_category,
  brand_list,
}) => {
  // ✅ SEARCH STATE
  const [search_text, set_search_text] = useState("");

  // ✅ FILTERED LIST
  const filtered_brand_list = brand_list.filter((item) =>
    item.brand_desc.toLowerCase().includes(search_text.toLowerCase())
  );

  const handle_select_brand = (data) => {
    set_selected_brand(data);
    set_selected_category({
      id: 0,
      category_code: "",
      category_desc: "Choose Category",
    });
    set_display_modal("");
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={display_modal === "select_brand"}
      onRequestClose={() => set_display_modal("")}
    >
      <View className="flex-1 justify-center bg-black/40 p-4">
        <View className="bg-white rounded-md p-4 max-h-[80%]">
          <Custom_Text className="text-sky-600 text-2xl mb-2" weight="bold">
            Brand Selection
          </Custom_Text>

          {/* 🔎 Search */}
          <View className="w-full relative mb-2">
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

          {/* 📋 Brand List */}
          <ScrollView className="w-full bg-gray-100/50 h-[300] px-4">
            {filtered_brand_list.length > 0 ? (
              filtered_brand_list.map((item, index) => {
                const is_first = index === 0;
                const is_last = index === filtered_brand_list.length - 1;

                const spacing = `${is_first ? "mt-[10]" : "mb-2"} ${
                  is_last ? "mb-[10]" : "mb-2"
                }`;

                return (
                  <TouchableOpacity
                    key={item.id}
                    className={`w-full py-2 ${spacing}`}
                    onPress={() => {
                      handle_select_brand(item);
                    }}
                  >
                    <Custom_Text className="text-base">
                      {item.brand_desc}
                    </Custom_Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="items-center py-4">
                <Custom_Text className="text-gray-500">
                  No results found
                </Custom_Text>
              </View>
            )}
          </ScrollView>

          {/* ❌ Close Button */}
          <View className="flex flex-row gap-2 mt-2">
            <TouchableOpacity
              className="flex-1 bg-white border border-gray-400 rounded-md px-4 py-3"
              onPress={() => set_display_modal("")}
            >
              <Custom_Text className="text-gray-700 text-center text-base">
                Close
              </Custom_Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default Select_Brand;
