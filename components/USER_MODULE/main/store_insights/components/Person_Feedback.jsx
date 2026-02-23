import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Users,
  Plus,
  X,
  MessageSquare,
  UserCircle2,
  Calendar,
  ClipboardCheck,
  Search,
} from "lucide-react-native";

const ROLES = [
  "Store Manager",
  "Category Buyer",
  "Floor Supervisor",
  "Warehouse Lead",
];

const Person_Feedback = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [feedbackList, setFeedbackList] = useState([
    {
      id: "1",
      role: "Store Manager",
      note: "Requested more stock for upcoming weekend promo on Classic Cola.",
      date: "2026-02-23",
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [note, setNote] = useState("");
  const [syncing, setSyncing] = useState(false);

  const saveFeedback = () => {
    if (!selectedRole || !note) return;
    const newEntry = {
      id: Date.now().toString(),
      role: selectedRole,
      note: note,
      date: new Date().toISOString().split("T")[0],
    };
    setFeedbackList([newEntry, ...feedbackList]);
    setSelectedRole("");
    setNote("");
    setModalVisible(false);
  };

  const renderFeedbackItem = ({ item }) => (
    <View className="bg-white p-5 rounded-xl mb-4 border border-slate-200">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="bg-sky-100 p-2 rounded-full">
            <UserCircle2 size={16} color="#0284c7" />
          </View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-900 ml-2"
          >
            {item.role}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Calendar size={12} color="#94a3b8" />
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-400 text-[10px] ml-1"
          >
            {item.date}
          </Text>
        </View>
      </View>

      <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-600 text-sm leading-5"
        >
          "{item.note}"
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-xl text-slate-900"
          >
            Personnel Feedback
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Store Insights"}
          </Text>
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={feedbackList}
        renderItem={renderFeedbackItem}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 160 }}
        ListHeaderComponent={
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-400 text-[11px] uppercase tracking-widest mb-4"
          >
            Recent Feedbacks
          </Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-32 right-6 bg-sky-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Input Modal */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[32px] p-8 max-h-[85%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Add Feedback
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-400 text-[11px] uppercase mb-3"
                >
                  Who did you speak with?
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setSelectedRole(role)}
                      className={`px-4 py-3 rounded-xl border ${
                        selectedRole === role
                          ? "bg-sky-50 border-sky-500"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className={`text-[11px] ${selectedRole === role ? "text-sky-700" : "text-slate-500"}`}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-400 text-[11px] uppercase mb-3"
                >
                  Feedback Details
                </Text>
                <TextInput
                  multiline
                  numberOfLines={5}
                  placeholder="Type notes here..."
                  value={note}
                  onChangeText={setNote}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-slate-900 font-[Outfit-Regular]"
                  textAlignVertical="top"
                  style={{ height: 120 }}
                />

                <TouchableOpacity
                  onPress={saveFeedback}
                  className="bg-sky-600 py-5 rounded-xl items-center mb-6"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white"
                  >
                    Save Feedback
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Footer Submit */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
        {syncing ? (
          <View className="w-full py-4 items-center justify-center">
            <ActivityIndicator color="#0284c7" />
          </View>
        ) : (
          <>
            <TouchableOpacity className="flex-1 bg-slate-100 py-4 rounded-xl border border-slate-200 items-center justify-center">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-600"
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={syncing}
              className={`bg-sky-600 flex-[2] py-4 rounded-xl flex-row items-center justify-center`}
            >
              <ClipboardCheck size={18} color={"white"} />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`text-white ml-2 mr-2`}
              >
                Submit Feedback
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Person_Feedback;
