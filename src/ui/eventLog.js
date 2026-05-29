const logs = [];
const MAX_LOGS = 6;

export function addEventLog(message) {
  logs.unshift({
    message,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  });

  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
}

export function updateEventLog() {
  const content = document.querySelector("#eventLogContent");
  if (!content) return;

  content.innerHTML = logs
    .map(
      (log) => `
        <div class="event-log-item">
          <b>${log.time}</b> - ${log.message}
        </div>
      `
    )
    .join("");
}