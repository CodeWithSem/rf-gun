// + Get Date Now
export function get_date_now() {
  const date_now = new Date();

  return date_now;
}
// - Get Date Now
// + Format Date 1 (mm-dd-yyyy)
export function format_date(date_input) {
  let date;

  if (!date_input) return "";

  if (typeof date_input === "string") {
    date = new Date(date_input);
  } else if (date_input instanceof Date) {
    date = date_input;
  } else {
    throw new Error("Invalid date input");
  }

  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${mm}-${dd}-${yyyy}`;
}
// - Format Date 1 (mm-dd-yyyy)
// + creation_date_sort
export function format_date_sort(date_input) {
  let date;

  if (typeof date_input === "string") {
    date = new Date(date_input);
  } else if (date_input instanceof Date) {
    date = date_input;
  } else {
    return "";
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}
// - creation_date_sort
export function get_iso_date_now() {
  return new Date().toISOString();
}
