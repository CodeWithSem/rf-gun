import React, { useMemo, useState } from "react";
import { View, FlatList, TextInput, TouchableOpacity } from "react-native";
import Custom_Text from "@assets/elements/text/Custom_Text";
import { ChevronDown, Search } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import Select_Brand from "./modals/Select_Brand";
import Select_Category from "./modals/Select_Category";
import { get_description } from "../../../../assets/scripts/functions/get_description";

const OSA = ({ brand_list, category_list, brand_h_list }) => {
  const navigation = useNavigation();

  /* -------------------- STATE -------------------- */

  const [selected_brand, set_selected_brand] = useState({
    id: 0,
    brand_code: "",
    brand_desc: "Choose Brand",
  });

  const [selected_category, set_selected_category] = useState({
    id: 0,
    category_code: "",
    category_desc: "Choose Category",
  });
  const [search_text, set_search_text] = useState("");
  const [display_modal, set_display_modal] = useState("");

  /* -------------------- DATA -------------------- */

  const item_master_list = [
    {
      item_code: "ITM-00001",
      item_desc: "Item Description A",
      brand: "B-001",
      category: "C-001",
    },
    {
      item_code: "ITM-00002",
      item_desc: "Item Description B",
      brand: "B-002",
      category: "C-004",
    },
    {
      item_code: "ITM-00003",
      item_desc: "Item Description C",
      brand: "B-003",
      category: "C-005",
    },
  ];

  const [sku_list, set_sku_list] = useState([
    { id: 1, item_code: "ITM-00001", status: "" },
    { id: 2, item_code: "ITM-00002", status: "" },
    { id: 3, item_code: "ITM-00003", status: "" },
  ]);

  /* -------------------- JOIN SKU + MASTER -------------------- */

  const merged_list = useMemo(() => {
    return sku_list.map((sku) => {
      const master = item_master_list.find(
        (m) => m.item_code === sku.item_code
      );

      return {
        ...sku,
        item_desc: master?.item_desc || "",
        brand: master?.brand || "",
        category: master?.category || "",
      };
    });
  }, [sku_list]);

  const summary = useMemo(() => {
    return sku_list.reduce(
      (acc, item) => {
        if (item.status === "av") acc.available += 1;
        else if (item.status === "cr") acc.critical += 1;
        else if (item.status === "ovs") acc.overstock += 1;
        else if (item.status === "os") acc.out_of_stock += 1;
        else acc.left += 1;

        return acc;
      },
      {
        available: 0,
        critical: 0,
        overstock: 0,
        out_of_stock: 0,
        left: 0,
      }
    );
  }, [sku_list]);

  /* -------------------- FILTERING -------------------- */

  const filtered_list = useMemo(() => {
    const search = search_text.toLowerCase();

    return merged_list.filter((item) => {
      const matchesSearch =
        item.item_code.toLowerCase().includes(search) ||
        item.item_desc.toLowerCase().includes(search);

      const matchesBrand =
        selected_brand.id === 0 || item.brand === selected_brand.brand_code;

      const matchesCategory =
        selected_category.id === 0 ||
        item.category === selected_category.category_code;

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [merged_list, search_text, selected_brand, selected_category]);

  const handle_select_status = (sku_id, status_code) => {
    set_sku_list((prev) =>
      prev.map((sku) =>
        sku.id === sku_id ? { ...sku, status: status_code } : sku
      )
    );
  };

  const handle_go_back = () => {
    // console.log(sku_list);
    navigation.goBack();
  };

  // RETURN ORIGIN
  return (
    <View className="flex-1 bg-white">
      {/* HEADER */}
      <View className="w-full pt-[60] pb-5 items-center bg-sky-600">
        <Custom_Text className="text-white text-xl" weight="bold">
          On-Shelf Availability
        </Custom_Text>
      </View>

      {/* FILTERS */}
      <View className="p-4 border-b border-gray-300 bg-white">
        {/* BRAND */}
        <TouchableOpacity
          className="mb-2 relative"
          onPress={() => set_display_modal("select_brand")}
        >
          <View className="border border-gray-300 rounded-lg py-3 px-4">
            <Custom_Text>{selected_brand.brand_desc}</Custom_Text>
          </View>
          <View className="absolute right-4 top-1/2 -translate-y-1/2">
            <ChevronDown size={16} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* CATEGORY */}
        <TouchableOpacity
          className="mb-2 relative"
          onPress={() => set_display_modal("select_category")}
        >
          <View className="border border-gray-300 rounded-lg py-3 px-4">
            <Custom_Text>{selected_category.category_desc}</Custom_Text>
          </View>
          <View className="absolute right-4 top-1/2 -translate-y-1/2">
            <ChevronDown size={16} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* SEARCH */}
        <View className="relative">
          <TextInput
            placeholder="Search item..."
            placeholderTextColor="#9ca3af"
            value={search_text}
            onChangeText={set_search_text}
            className="border border-gray-300 rounded-lg py-3 px-4 pr-12 text-sm"
            style={{ fontFamily: "Outfit-Regular" }}
          />
          <View className="absolute right-4 top-1/2 -translate-y-1/2">
            <Search size={16} color="#9ca3af" />
          </View>
        </View>
      </View>

      {/* LIST */}
      <View className="flex-1 bg-gray-100">
        <FlatList
          data={filtered_list}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item, index }) => {
            const spacing = index === 0 ? "mt-[20] mb-5" : "mb-5";
            // Determine card background based on status
            const card_bg_color =
              item.status === "av"
                ? "bg-green-100/50"
                : item.status === "cr" || item.status === "ovs"
                  ? "bg-yellow-100/50"
                  : item.status === "os"
                    ? "bg-red-100/50"
                    : "bg-white";

            const card_border_color =
              item.status === "av"
                ? "border-green-600"
                : item.status === "cr" || item.status === "ovs"
                  ? "border-yellow-500"
                  : item.status === "os"
                    ? "border-red-600"
                    : "border-gray-300";

            const desc_bg_color =
              item.status === "av"
                ? "bg-green-600"
                : item.status === "cr" || item.status === "ovs"
                  ? "bg-yellow-500"
                  : item.status === "os"
                    ? "bg-red-600"
                    : "bg-gray-400"; // default if no status
            return (
              <View
                className={`${card_bg_color} border ${card_border_color} rounded-xl p-3 ${spacing}`}
              >
                <View
                  className={`flex justify-center items-center p-2 ${desc_bg_color} rounded-md`}
                >
                  <Custom_Text
                    className="text-center text-white text-sm"
                    weight="semibold"
                  >
                    {item.item_desc}
                  </Custom_Text>
                </View>

                <View className="mt-3 flex px-1 gap-1">
                  <Custom_Text className="text-xs text-gray-600">
                    Brand:{" "}
                    {get_description(
                      item.brand,
                      brand_list,
                      "brand_code",
                      "brand_desc"
                    )}
                  </Custom_Text>

                  <Custom_Text className="text-xs text-gray-600">
                    Category:{" "}
                    {get_description(
                      item.category,
                      category_list,
                      "category_code",
                      "category_desc"
                    )}
                  </Custom_Text>
                </View>
                <View className="mt-3">
                  {/* 2x2 Grid */}
                  <View className="flex-row mb-2 px-2 pt-2">
                    {/* LEFT COLUMN */}
                    <View className="flex-1 flex-col gap-2">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handle_select_status(item.id, "av")}
                        className={`px-4 py-3 rounded-full border justify-center items-center ${
                          item.status === "av"
                            ? "bg-green-600 border-green-600"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Custom_Text
                          className={`text-xs ${
                            item.status === "av"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          Available
                        </Custom_Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handle_select_status(item.id, "cr")}
                        className={`px-4 py-3 rounded-full border justify-center items-center ${
                          item.status === "cr"
                            ? "bg-yellow-500 border-yellow-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Custom_Text
                          className={`text-xs ${
                            item.status === "cr"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          Critical
                        </Custom_Text>
                      </TouchableOpacity>
                    </View>

                    {/* RIGHT COLUMN */}
                    <View className="flex-1 flex-col gap-2 ml-2">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handle_select_status(item.id, "ovs")}
                        className={`px-4 py-3 rounded-full border justify-center items-center ${
                          item.status === "ovs"
                            ? "bg-yellow-500 border-yellow-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Custom_Text
                          className={`text-xs ${
                            item.status === "ovs"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          Overstock
                        </Custom_Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handle_select_status(item.id, "os")}
                        className={`px-4 py-3 rounded-full border justify-center items-center ${
                          item.status === "os"
                            ? "bg-red-500 border-red-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Custom_Text
                          className={`text-xs ${
                            item.status === "os"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          Out of Stock
                        </Custom_Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {/* Show this if Critical or Overstock only */}
                {(item.status === "cr" || item.status === "ovs") && (
                  <View className="mt-3 rounded-lg bg-yellow-50 border border-yellow-500 p-3">
                    {/* STOCK BREAKDOWN */}
                    <View className="flex-row justify-between mb-3">
                      <View className="items-center flex-1">
                        <Custom_Text className="text-[11px] text-yellow-700">
                          Cases
                        </Custom_Text>
                        <Custom_Text
                          className="text-sm text-yellow-900"
                          weight="semibold"
                        >
                          0
                        </Custom_Text>
                      </View>

                      <View className="items-center flex-1">
                        <Custom_Text className="text-[11px] text-yellow-700">
                          Inner Box
                        </Custom_Text>
                        <Custom_Text
                          className="text-sm text-yellow-900"
                          weight="semibold"
                        >
                          0
                        </Custom_Text>
                      </View>

                      <View className="items-center flex-1">
                        <Custom_Text className="text-[11px] text-yellow-700">
                          Pieces
                        </Custom_Text>
                        <Custom_Text
                          className="text-sm text-yellow-900"
                          weight="semibold"
                        >
                          0
                        </Custom_Text>
                      </View>
                    </View>

                    {/* REMARKS */}
                    <View className="mt-2">
                      <Custom_Text
                        className="text-[11px] text-yellow-700 mb-1"
                        weight="semibold"
                      >
                        Remarks
                      </Custom_Text>

                      <View className="min-h-[40px] rounded-md bg-white border border-yellow-500 px-3 py-2">
                        <Custom_Text className="text-xs text-gray-700">
                          {item.remarks || "No remarks provided"}
                        </Custom_Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
      {/* CANCEL */}
      <View className="p-5 flex border-t border-gray-200 bg-white">
        <View className="w-full mb-2">
          <View className="flex-row flex-wrap">
            {/* ITEMS LEFT */}
            <View className="w-full pr-2 mb-2">
              <View className="p-3 rounded-md bg-gray-100 border border-gray-400">
                <Custom_Text className="text-xs text-gray-700">
                  Total Items Left: {summary.left}
                </Custom_Text>
              </View>
            </View>
            {/* AVAILABLE */}
            {/* <View className="w-1/2 pr-2 mb-2">
              <View className="px-3 py-2 rounded-md bg-green-100 border border-green-600">
                <Custom_Text className="text-xs text-green-700">
                  Available: {summary.available}
                </Custom_Text>
              </View>
            </View> */}

            {/* OVERSTOCK */}
            {/* <View className="w-1/2 pr-2 mb-2">
              <View className="px-3 py-2 rounded-md bg-yellow-100 border border-yellow-500">
                <Custom_Text className="text-xs text-yellow-700">
                  Overstock: {summary.overstock}
                </Custom_Text>
              </View>
            </View> */}

            {/* CRITICAL */}
            {/* <View className="w-1/2 pr-2 mb-2">
              <View className="px-3 py-2 rounded-md bg-yellow-100 border border-yellow-500">
                <Custom_Text className="text-xs text-yellow-700">
                  Critical: {summary.critical}
                </Custom_Text>
              </View>
            </View> */}

            {/* OUT OF STOCK */}
            {/* <View className="w-1/2 pr-2 mb-2">
              <View className="px-3 py-2 rounded-md bg-red-100 border border-red-600">
                <Custom_Text className="text-xs text-red-700">
                  Out of Stock: {summary.out_of_stock}
                </Custom_Text>
              </View>
            </View> */}
          </View>
        </View>
        <View className="w-full flex-row gap-4">
          <TouchableOpacity
            onPress={handle_go_back}
            className="flex-1 h-[50] border border-sky-600 rounded-lg bg-sky-600 justify-center items-center"
          >
            <Custom_Text className="text-white">Save</Custom_Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handle_go_back}
            className="flex-1 h-[50] border border-gray-400 rounded-lg justify-center items-center"
          >
            <Custom_Text className="text-gray-500">Cancel</Custom_Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODALS */}
      <Select_Brand
        display_modal={display_modal}
        set_display_modal={set_display_modal}
        set_selected_brand={set_selected_brand}
        set_selected_category={set_selected_category}
        brand_list={brand_list}
      />

      <Select_Category
        display_modal={display_modal}
        set_display_modal={set_display_modal}
        selected_brand={selected_brand}
        set_selected_category={set_selected_category}
        brand_h_list={brand_h_list}
        category_list={category_list}
      />
    </View>
  );
};

export default OSA;
