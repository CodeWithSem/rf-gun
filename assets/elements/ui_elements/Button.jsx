import React from "react";
import Outfit_Text from "../text/Outfit_Text";
import { TouchableOpacity } from "react-native";

const Button = ({
  children,
  on_press,
  class_name,
  text_class_name,
  disabled,
}) => {
  return (
    <React.Fragment>
      <TouchableOpacity
        onPress={on_press}
        className={`${class_name}`}
        disabled={disabled}
      >
        <Outfit_Text className={text_class_name}>{children}</Outfit_Text>
      </TouchableOpacity>
    </React.Fragment>
  );
};

export default Button;
