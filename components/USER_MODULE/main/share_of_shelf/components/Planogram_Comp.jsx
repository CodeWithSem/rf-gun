import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Camera,
  ChevronRight,
  Image as ImageIcon,
  LayoutList,
} from "lucide-react-native";

const Planogram_Comp = ({ navigation, route }) => {
  const { storeData } = route?.params || {};

  // --- STATE ---
  const [selectedPog, setSelectedPog] = useState(null);
  const [compliance, setCompliance] = useState({
    correctSequence: null,
    facingsMatch: null,
    posmInstalled: null,
    pricingVisible: null,
  });

  // --- HANDLERS ---
  const toggleCheck = (key, value) => {
    setCompliance((prev) => ({ ...prev, [key]: value }));
  };

  // Check if all fields + POG are selected
  const isComplete =
    selectedPog !== null &&
    compliance.correctSequence !== null &&
    compliance.facingsMatch !== null &&
    compliance.posmInstalled !== null &&
    compliance.pricingVisible !== null;

  const handleFinish = () => {
    Alert.alert("Success", "Compliance Audit Completed", [
      {
        text: "OK",
        onPress: () => {
          setSelectedPog(null);
          setCompliance({
            correctSequence: null,
            facingsMatch: null,
            posmInstalled: null,
            pricingVisible: null,
          });
        },
      },
    ]);
  };

  const CheckItem = ({ label, stateKey }) => (
    <View className="bg-white p-5 rounded-xl mb-4 border border-slate-200 shadow-sm">
      <Text
        style={{ fontFamily: "Outfit-Medium" }}
        className="text-slate-700 mb-4 text-base"
      >
        {label}
      </Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => toggleCheck(stateKey, true)}
          className={`flex-1 py-4 rounded-xl border flex-row items-center justify-center ${
            compliance[stateKey] === true
              ? "bg-emerald-50 border-emerald-500"
              : "bg-slate-50 border-slate-100"
          }`}
        >
          <CheckCircle2
            size={18}
            color={compliance[stateKey] === true ? "#10b981" : "#94a3b8"}
          />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className={`ml-2 mr-4 ${compliance[stateKey] === true ? "text-emerald-700" : "text-slate-500"}`}
          >
            Match
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleCheck(stateKey, false)}
          className={`flex-1 py-4 rounded-xl border flex-row items-center justify-center ${
            compliance[stateKey] === false
              ? "bg-rose-50 border-rose-500"
              : "bg-slate-50 border-slate-100"
          }`}
        >
          <XCircle
            size={18}
            color={compliance[stateKey] === false ? "#f43f5e" : "#94a3b8"}
          />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className={`ml-2 mr-3 ${compliance[stateKey] === false ? "text-rose-700" : "text-slate-500"}`}
          >
            Gap
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-200">
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
            Planogram Compliance
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs uppercase"
          >
            {storeData?.description || "Audit"}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
      >
        {/* POG SELECTOR */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("PlanogramSelect", {
              onSelect: (pog) => setSelectedPog(pog),
            })
          }
          className={`${selectedPog ? "bg-sky-600 border-sky-700" : "bg-white border-2 border-dashed border-sky-200"} rounded-xl p-5 mb-8 flex-row items-center justify-between shadow-sm`}
        >
          <View className="flex-row items-center flex-1">
            <View
              className={`${selectedPog ? "bg-white/20" : "bg-sky-50"} p-4 rounded-lg`}
            >
              <ImageIcon size={26} color={selectedPog ? "white" : "#0284c7"} />
            </View>
            <View className="ml-4 flex-1">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`${selectedPog ? "text-white" : "text-sky-900"} text-base`}
              >
                {selectedPog ? selectedPog.name : "Select Target Planogram"}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className={`${selectedPog ? "text-sky-100" : "text-sky-600"} text-xs mt-1`}
              >
                {selectedPog
                  ? `Active: Version ${selectedPog.version}`
                  : "Required to unlock audit checklist"}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={selectedPog ? "white" : "#0284c7"} />
        </TouchableOpacity>

        {selectedPog && (
          <View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-400 text-[10px] uppercase mb-4 ml-1 tracking-[2px]"
            >
              Compliance Checklist
            </Text>
            <CheckItem
              label="Product Sequence (Left to Right)"
              stateKey="correctSequence"
            />
            <CheckItem
              label="Correct Facings (as per POG)"
              stateKey="facingsMatch"
            />
            <CheckItem
              label="POSM / Promotional Materials"
              stateKey="posmInstalled"
            />
            <CheckItem
              label="Pricing Tags Updated & Visible"
              stateKey="pricingVisible"
            />

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-400 text-[10px] uppercase mb-4 mt-4 ml-1 tracking-[2px]"
            >
              Photo Evidence
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 aspect-square w-full items-center justify-center"
            >
              <View className="bg-slate-50 p-6 rounded-full mb-4">
                <Camera size={42} color="#94a3b8" />
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-700 text-lg"
              >
                Take Actual Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-xl">
        <TouchableOpacity
          onPress={handleFinish}
          disabled={!isComplete}
          className={`w-full py-5 rounded-xl flex-row items-center justify-center ${isComplete ? "bg-sky-600" : "bg-slate-200"}`}
        >
          <CheckCircle2 size={20} color="white" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white ml-3 text-lg"
          >
            Complete Verification
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Planogram_Comp;
