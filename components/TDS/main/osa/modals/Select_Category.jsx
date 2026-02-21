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
import { get_description } from "@assets/scripts/functions/get_description";

const Select_Category = ({
  display_modal,
  set_display_modal,
  selected_brand,
  set_selected_category,
  brand_h_list,
  category_list,
}) => {
  const [search_text, set_search_text] = useState("");

  const has_brand = selected_brand.brand_code !== "";

  // ✅ Only show mapped categories if brand is selected
  const mapped_categories = has_brand
    ? brand_h_list.filter(
        (item) => item.brand_code === selected_brand.brand_code
      )
    : [];

  // ✅ Inject "All Categories" dynamically
  const final_list = has_brand
    ? [
        {
          id: "all",
          category_code: "__ALL__",
        },
        ...mapped_categories,
      ]
    : [];

  // ✅ Search filter
  const filtered_list = final_list.filter((item) => {
    if (item.category_code === "__ALL__") return true;

    const category_desc = get_description(
      item.category_code,
      category_list,
      "category_code",
      "category_desc"
    );

    return category_desc.toLowerCase().includes(search_text.toLowerCase());
  });

  const handle_select_category = (item) => {
    if (item.category_code === "__ALL__") {
      // Special case: All categories for selected brand
      set_selected_category({
        id: -1,
        category_code: "",
        category_desc: "All Categories",
      });
    } else {
      const selected = category_list.find(
        (cat) => cat.category_code === item.category_code
      );
      set_selected_category(selected);
    }

    set_display_modal("");
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={display_modal === "select_category"}
      onRequestClose={() => set_display_modal("")}
    >
      <View className="flex-1 justify-center bg-black/40 p-4">
        <View className="bg-white rounded-md p-4 max-h-[80%]">
          <Custom_Text className="text-sky-600 text-2xl mb-2" weight="bold">
            Category Selection
          </Custom_Text>

          {/* Search */}
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

          {/* List */}
          <ScrollView className="w-full bg-gray-100/50 h-[300] px-4">
            {!has_brand ? (
              <View className="items-center py-4">
                <Custom_Text className="text-gray-500">
                  Please select a brand first
                </Custom_Text>
              </View>
            ) : filtered_list.length > 0 ? (
              filtered_list.map((item, index) => {
                const is_first = index === 0;
                const is_last = index === filtered_list.length - 1;

                const spacing = `${is_first ? "mt-[10]" : "mb-2"} ${
                  is_last ? "mb-[10]" : "mb-2"
                }`;

                const label =
                  item.category_code === "__ALL__"
                    ? "All Categories"
                    : get_description(
                        item.category_code,
                        category_list,
                        "category_code",
                        "category_desc"
                      );

                return (
                  <TouchableOpacity
                    key={item.id}
                    className={`w-full py-2 ${spacing}`}
                    onPress={() => handle_select_category(item)}
                  >
                    <Custom_Text className="text-base">{label}</Custom_Text>
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

          {/* Close */}
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

export default Select_Category;
