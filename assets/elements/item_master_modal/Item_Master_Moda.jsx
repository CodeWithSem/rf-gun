import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Search, X, Package } from "lucide-react-native";

const Item_Master_Modal = ({
  visible,
  onClose,
  item_data = [],
  is_loading = false,
  onSelect,
}) => {
  const [search_query, set_search_query] = useState("");

  const filtered_items = useMemo(() => {
    const query = search_query.trim().toLowerCase();
    if (!query) return item_data;

    return item_data.filter((item) => {
      const code = String(item?.item_code || "").toLowerCase();
      const desc = String(item?.item_desc || "").toLowerCase();
      return code.includes(query) || desc.includes(query);
    });
  }, [search_query, item_data]);

  const handle_select = (item) => {
    onSelect(item);
    set_search_query("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-white"
        >
          {/* HEADER SECTION */}
          <View className="px-6 py-4 border-b border-slate-100 flex-row justify-between items-center">
            <View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Item Selection
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Select an item from the system
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-slate-100 rounded-full"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR CONTAINER */}
          <View className="px-6 py-4">
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 flex-row items-center">
              <Search size={18} color="#94a3b8" />
              <TextInput
                className="flex-1 p-3.5 font-bold text-slate-800 text-sm ml-2"
                placeholder="Search code or description..."
                placeholderTextColor="#94a3b8"
                value={search_query}
                onChangeText={set_search_query}
                clearButtonMode="while-editing"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* DATA LIST / LOADING / EMPTY STATE */}
          {is_loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0284c7" />
              <Text className="text-slate-400 font-bold text-xs mt-2">
                Loading item catalog...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered_items}
              keyExtractor={(item) => item.id || item.item_code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 40,
                flexGrow: filtered_items.length === 0 ? 1 : undefined,
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={5}
              ListEmptyComponent={() => (
                <View className="flex-1 justify-center items-center py-12">
                  <Package size={48} color="#cbd5e1" />
                  <Text className="text-slate-400 font-bold mt-4 text-center px-6 text-sm">
                    {search_query
                      ? "No items match your search."
                      : "No items found."}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handle_select(item)}
                  activeOpacity={0.7}
                  className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 flex-row items-center shadow-sm active:border-sky-500 active:bg-sky-50/20"
                >
                  <View className="p-3 bg-slate-50 border border-slate-100 rounded-xl mr-4">
                    <Package size={20} color="#0284c7" />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-sky-700 font-black text-sm uppercase tracking-wide">
                      {item.item_code}
                    </Text>
                    <Text
                      className="text-slate-600 font-bold text-xs mt-1"
                      numberOfLines={2}
                    >
                      {item.item_desc || "No description available"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default Item_Master_Modal;
