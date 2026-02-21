export const get_description = (
  search_code,
  data_list,
  code_key_name,
  desc_value_name
) => {
  const found_item = data_list.find(
    (item) => item[code_key_name] === search_code
  );

  return found_item ? found_item[desc_value_name] : "";
};
