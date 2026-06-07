export function initMissionBriefing() {
  const panel = document.querySelector("#missionBriefing");
  const closeButton = document.querySelector("#missionCloseButton");

  if (!panel) return;

  closeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideMissionBriefing();
  });
}

export function hideMissionBriefing() {
  document.querySelector("#missionBriefing")?.classList.add("hidden");
}

export function showMissionBriefing() {
  document.querySelector("#missionBriefing")?.classList.remove("hidden");
}