
/**
 * Generates and downloads an ICS file for a specific event/task.
 * This allows two-way sync (user imports to Google/Outlook/Apple Calendar).
 */
export const downloadTaskICS = (title: string, description: string, dueDate: string) => {
  // Create a start time (assuming 9 AM on the due date for simplicity if no time provided)
  const startDate = new Date(dueDate);
  startDate.setHours(9, 0, 0);
  
  // End time (1 hour later)
  const endDate = new Date(startDate);
  endDate.setHours(10, 0, 0);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shepherd//Tasks//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@shepherd.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
