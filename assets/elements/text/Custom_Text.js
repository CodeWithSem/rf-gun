import React from "react";
import { Text } from "react-native";

const weight_map = {
  regular: "Outfit-Regular",
  bold: "Outfit-Bold",
  black: "Outfit-Black",
  extrabold: "Outfit-ExtraBold",
  extralight: "Outfit-ExtraLight",
  light: "Outfit-Light",
  medium: "Outfit-Medium",
  semibold: "Outfit-SemiBold",
  thin: "Outfit-Thin",
};

export default function Custom_Text({
  weight = "regular",
  style,
  children,
  ...rest
}) {
  const fontFamily = weight_map[weight.toLowerCase()] || weight_map.regular;

  return (
    <Text {...rest} style={[{ fontFamily }, style]}>
      {children}
    </Text>
  );
}
