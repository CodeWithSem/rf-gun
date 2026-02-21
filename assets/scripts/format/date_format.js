// + Get Date Now
export function get_date_now() {
  const date_now = new Date();

  return date_now;
}
// - Get Date Now

// + Format Date Dash with optional time (mm-dd-yyyy [hh:mm AM/PM])
export function format_date_dash(date_input, with_time = false) {
  let date;

  if (!date_input) return "";

  if (typeof date_input === "string") {
    date = new Date(date_input);
  } else if (date_input instanceof Date) {
    date = date_input;
  } else {
    throw new Error("Invalid date input");
  }

  // Date parts
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();

  let formatted = `${mm}-${dd}-${yyyy}`;

  if (with_time) {
    // Time parts
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // Convert 0 to 12 for 12 AM/PM

    formatted += ` ${hours}:${minutes} ${ampm}`;
  }

  return formatted;
}
// - Format Date Dash with optional time
