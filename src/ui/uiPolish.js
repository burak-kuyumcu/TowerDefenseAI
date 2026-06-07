const UI_POLISH_STYLE_ID = "uiPolishStyle";

export function initUIPolish() {
  const existingStyle = document.querySelector("#" + UI_POLISH_STYLE_ID);

  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");
  style.id = UI_POLISH_STYLE_ID;

  style.textContent = `
    :root {
      --ui-bg: rgba(5, 12, 26, 0.84);
      --ui-bg-strong: rgba(5, 12, 26, 0.94);
      --ui-bg-soft: rgba(15, 23, 42, 0.78);

      --ui-border: rgba(56, 189, 248, 0.55);
      --ui-border-soft: rgba(56, 189, 248, 0.25);

      --ui-text: #dbeafe;
      --ui-muted: #94a3b8;
      --ui-cyan: #38bdf8;
      --ui-yellow: #facc15;
      --ui-green: #22c55e;
      --ui-red: #f87171;
      --ui-blue: #2563eb;

      --left-x: 16px;
      --left-w: 214px;

      --right-x: 18px;
      --build-w: 150px;
      --wave-w: 264px;
      --right-gap: 16px;

      --panel-radius: 16px;
      --panel-shadow: 0 14px 30px rgba(0, 0, 0, 0.32), 0 0 20px rgba(56, 189, 248, 0.11);
    }

    body {
      overflow: hidden;
    }

    #hud,
    #selectedInfo,
    #actionPanel,
    #wavePreview,
    #buildPanel,
    #eventLog,
    #controlStatusPanel,
    #help,
    #stageIntelPanel,
    #achievementPanel,
    #aiFeedback,
    #settingsPanel,
    #bossHud {
      box-sizing: border-box !important;
      color: var(--ui-text) !important;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.90), rgba(5, 12, 26, 0.88)) !important;
      border: 1px solid var(--ui-border) !important;
      border-radius: var(--panel-radius) !important;
      box-shadow: var(--panel-shadow) !important;
      backdrop-filter: blur(9px) !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    }

    #hud {
      position: fixed !important;
      left: var(--left-x) !important;
      top: 14px !important;
      width: var(--left-w) !important;
      min-height: 255px !important;
      max-height: 330px !important;
      padding: 14px 16px !important;
      overflow: hidden !important;
      z-index: 34 !important;
      font-size: 13px !important;
      line-height: 1.35 !important;
    }

    #hud * {
      font-size: 13px !important;
      line-height: 1.35 !important;
    }

    #hud span,
    #hud b,
    #hud strong {
      font-weight: 800 !important;
    }

    #selectedInfo {
      position: fixed !important;
      left: var(--left-x) !important;
      bottom: 154px !important;
      width: var(--left-w) !important;
      min-height: 150px !important;
      max-height: 210px !important;
      padding: 14px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      z-index: 34 !important;
    }

    #selectedInfo h1,
    #selectedInfo h2,
    #selectedInfo h3,
    #selectedInfo .title {
      margin: 0 0 10px !important;
      color: var(--ui-cyan) !important;
      text-align: center !important;
      font-size: 16px !important;
      line-height: 1.15 !important;
      font-weight: 900 !important;
    }

    #selectedInfo * {
      font-size: 12px !important;
      line-height: 1.35 !important;
    }

    #actionPanel {
      position: fixed !important;
      left: var(--left-x) !important;
      bottom: 18px !important;
      width: var(--left-w) !important;
      min-height: 126px !important;
      max-height: 132px !important;
      padding: 12px !important;
      overflow: hidden !important;
      z-index: 35 !important;
    }

    #actionPanel h1,
    #actionPanel h2,
    #actionPanel h3 {
      margin: 0 0 9px !important;
      color: var(--ui-cyan) !important;
      text-align: center !important;
      font-size: 17px !important;
      line-height: 1.1 !important;
      font-weight: 900 !important;
    }

    #actionPanel button,
    #selectedInfo button {
      width: 100% !important;
      min-height: 34px !important;
      margin: 5px 0 !important;
      border-radius: 10px !important;
      border: 1px solid rgba(96, 165, 250, 0.55) !important;
      background: linear-gradient(180deg, #2563eb, #1d4ed8) !important;
      color: #eff6ff !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      cursor: pointer !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16) !important;
    }

    #actionPanel button:disabled,
    #selectedInfo button:disabled {
      opacity: 0.48 !important;
      cursor: not-allowed !important;
      filter: grayscale(0.35) !important;
    }

    #quickPanelButtons {
      position: fixed !important;
      top: 10px !important;
      right: 62px !important;
      display: flex !important;
      gap: 10px !important;
      z-index: 70 !important;
    }

    #quickPanelButtons button,
    #settingsButton {
      height: 30px !important;
      min-width: 70px !important;
      padding: 0 13px !important;
      border-radius: 10px !important;
      border: 1px solid var(--ui-border) !important;
      background: rgba(15, 23, 42, 0.92) !important;
      color: var(--ui-text) !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.12) !important;
    }

    #settingsButton {
      position: fixed !important;
      top: 10px !important;
      right: 16px !important;
      width: 34px !important;
      min-width: 34px !important;
      padding: 0 !important;
      z-index: 71 !important;
    }

    #buildPanel {
      position: fixed !important;
      top: 56px !important;
      right: var(--right-x) !important;
      width: var(--build-w) !important;
      min-height: 260px !important;
      max-height: 360px !important;
      padding: 14px 12px !important;
      overflow: hidden !important;
      z-index: 40 !important;
    }

    #buildPanel h1,
    #buildPanel h2,
    #buildPanel h3 {
      margin: 0 0 12px !important;
      color: var(--ui-cyan) !important;
      text-align: center !important;
      font-size: 18px !important;
      line-height: 1.05 !important;
      font-weight: 900 !important;
    }

    #buildPanel button {
      width: 100% !important;
      height: 33px !important;
      margin: 6px 0 !important;
      padding: 0 10px !important;
      border-radius: 10px !important;
      border: 1px solid rgba(96, 165, 250, 0.50) !important;
      background: rgba(15, 23, 42, 0.94) !important;
      color: var(--ui-text) !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      text-align: left !important;
    }

    #buildPanel button.active,
    #buildPanel button.selected {
      background: linear-gradient(180deg, #2563eb, #1d4ed8) !important;
      border-color: rgba(250, 204, 21, 0.85) !important;
      color: white !important;
    }

    #wavePreview {
      position: fixed !important;
      top: 56px !important;
      right: calc(var(--right-x) + var(--build-w) + var(--right-gap)) !important;
      width: var(--wave-w) !important;
      min-height: 300px !important;
      max-height: 430px !important;
      padding: 16px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      z-index: 39 !important;
    }

    #wavePreview h1,
    #wavePreview h2,
    #wavePreview h3 {
      margin: 0 0 14px !important;
      color: var(--ui-cyan) !important;
      text-align: center !important;
      font-size: 18px !important;
      line-height: 1.15 !important;
      font-weight: 900 !important;
    }

    #wavePreview * {
      font-size: 12px !important;
      line-height: 1.32 !important;
    }

    #startWaveButton {
      min-height: 42px !important;
      border-radius: 12px !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      margin-top: 10px !important;
    }

    #minimap {
      position: fixed !important;
      right: var(--right-x) !important;
      bottom: 120px !important;
      width: 160px !important;
      height: 160px !important;
      border-radius: 15px !important;
      border: 1px solid var(--ui-border) !important;
      background: rgba(15, 23, 42, 0.80) !important;
      box-shadow: var(--panel-shadow) !important;
      overflow: hidden !important;
      z-index: 38 !important;
    }

    #eventLog {
      position: fixed !important;
      right: var(--right-x) !important;
      bottom: 18px !important;
      width: 405px !important;
      height: 90px !important;
      max-height: 90px !important;
      padding: 10px 14px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      z-index: 39 !important;
    }

    #eventLog h1,
    #eventLog h2,
    #eventLog h3 {
      margin: 0 0 7px !important;
      color: var(--ui-cyan) !important;
      text-align: center !important;
      font-size: 15px !important;
      line-height: 1.1 !important;
      font-weight: 900 !important;
    }

    #eventLog * {
      font-size: 11px !important;
      line-height: 1.3 !important;
    }

    #controlStatusPanel {
      position: fixed !important;
      left: 50% !important;
      bottom: 18px !important;
      transform: translateX(-50%) !important;
      width: 330px !important;
      min-height: 58px !important;
      padding: 10px 14px !important;
      border-radius: 15px !important;
      background: rgba(5, 12, 26, 0.92) !important;
      border: 1px solid var(--ui-border) !important;
      box-shadow: var(--panel-shadow) !important;
      pointer-events: none !important;
      z-index: 34 !important;
    }

    #controlStatusPanel * {
      font-size: 11px !important;
      line-height: 1.22 !important;
      text-align: center !important;
    }

    #storyObjectiveStrip,
    .story-objective-strip {
      position: fixed !important;
      left: 50% !important;
      top: 12px !important;
      transform: translateX(-50%) !important;
      width: 590px !important;
      min-width: 590px !important;
      max-width: 590px !important;
      min-height: 34px !important;
      padding: 7px 13px !important;
      display: grid !important;
      grid-template-columns: 115px 1fr 125px !important;
      gap: 12px !important;
      align-items: center !important;
      border-radius: 13px !important;
      opacity: 0.94 !important;
      z-index: 28 !important;
      background: rgba(5, 12, 26, 0.84) !important;
      border: 1px solid var(--ui-border-soft) !important;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.10) !important;
      pointer-events: none !important;
    }

    .story-objective-main {
      font-size: 12px !important;
      line-height: 1.2 !important;
      color: var(--ui-text) !important;
      text-align: center !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .story-objective-left b,
    .story-objective-right b {
      font-size: 11px !important;
      color: var(--ui-yellow) !important;
      line-height: 1.1 !important;
    }

    .story-objective-left span,
    .story-objective-right span {
      font-size: 10px !important;
      color: var(--ui-cyan) !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #storyPanel,
    .story-panel {
      position: fixed !important;
      left: 50% !important;
      top: 76px !important;
      transform: translateX(-50%) !important;
      width: 560px !important;
      min-width: 560px !important;
      max-width: 560px !important;
      padding: 18px 20px !important;
      border-radius: 18px !important;
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(5, 12, 26, 0.92)),
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 45%) !important;
      border: 1px solid rgba(56, 189, 248, 0.72) !important;
      box-shadow:
        0 16px 34px rgba(0, 0, 0, 0.35),
        0 0 22px rgba(56, 189, 248, 0.16) !important;
      z-index: 45 !important;
      pointer-events: none !important;
    }

    .story-panel.hidden {
      opacity: 0 !important;
      transform: translateX(-50%) translateY(-10px) scale(0.98) !important;
    }

    .story-panel-title {
      font-size: 28px !important;
      line-height: 1 !important;
      margin-bottom: 7px !important;
      color: var(--ui-yellow) !important;
    }

    .story-panel-subtitle {
      font-size: 14px !important;
      margin-bottom: 12px !important;
      color: #7dd3fc !important;
    }

    .story-panel-body {
      font-size: 13px !important;
      line-height: 1.45 !important;
      color: #dbeafe !important;
      margin-bottom: 12px !important;
    }

    .story-panel-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
      margin-bottom: 10px !important;
    }

    .story-panel-objective {
      display: block !important;
    }

    .story-panel-grid div,
    .story-panel-objective {
      padding: 10px 12px !important;
      border-radius: 12px !important;
      background: rgba(15, 23, 42, 0.74) !important;
      border: 1px solid var(--ui-border-soft) !important;
    }

    .story-panel-grid span,
    .story-panel-objective span {
      font-size: 10px !important;
      color: var(--ui-muted) !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
    }

    .story-panel-grid b,
    .story-panel-objective b {
      display: block !important;
      margin-top: 3px !important;
      font-size: 13px !important;
      line-height: 1.25 !important;
      color: var(--ui-yellow) !important;
    }

    #storyCommsPanel,
    .story-comms-panel {
      position: fixed !important;
      left: calc(var(--left-x) + var(--left-w) + 20px) !important;
      top: 88px !important;
      width: 430px !important;
      min-width: 430px !important;
      max-width: 430px !important;
      padding: 12px 16px !important;
      border-radius: 14px !important;
      background:
        linear-gradient(135deg, rgba(5, 12, 26, 0.94), rgba(15, 23, 42, 0.86)) !important;
      border: 1px solid rgba(125, 211, 252, 0.55) !important;
      box-shadow: var(--panel-shadow) !important;
      opacity: 0.96 !important;
      z-index: 37 !important;
      pointer-events: none !important;
    }

    .story-comms-panel.hidden {
      opacity: 0 !important;
      transform: translateY(-8px) scale(0.98) !important;
    }

    .story-comms-speaker {
      margin-bottom: 5px !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      color: var(--ui-cyan) !important;
      text-transform: uppercase !important;
      letter-spacing: 0.12em !important;
    }

    .story-comms-text {
      font-size: 13px !important;
      line-height: 1.35 !important;
      color: #e0f2fe !important;
      text-align: left !important;
      white-space: normal !important;
      overflow-wrap: break-word !important;
    }

    .story-comms-panel.tone-success {
      border-color: rgba(34, 197, 94, 0.66) !important;
    }

    .story-comms-panel.tone-success .story-comms-speaker {
      color: var(--ui-green) !important;
    }

    .story-comms-panel.tone-warning,
    .story-comms-panel.tone-objective {
      border-color: rgba(250, 204, 21, 0.66) !important;
    }

    .story-comms-panel.tone-warning .story-comms-speaker,
    .story-comms-panel.tone-objective .story-comms-speaker {
      color: var(--ui-yellow) !important;
    }

    .story-comms-panel.tone-danger {
      border-color: rgba(248, 113, 113, 0.74) !important;
    }

    .story-comms-panel.tone-danger .story-comms-speaker {
      color: var(--ui-red) !important;
    }

    #help,
    #stageIntelPanel,
    #achievementPanel,
    #aiFeedback,
    #settingsPanel {
      max-width: 520px !important;
      max-height: calc(100vh - 120px) !important;
      overflow-y: auto !important;
      padding: 18px 20px !important;
      z-index: 80 !important;
      background: var(--ui-bg-strong) !important;
    }

    #selectedInfo::-webkit-scrollbar,
    #eventLog::-webkit-scrollbar,
    #wavePreview::-webkit-scrollbar,
    #help::-webkit-scrollbar,
    #stageIntelPanel::-webkit-scrollbar,
    #achievementPanel::-webkit-scrollbar,
    #aiFeedback::-webkit-scrollbar,
    #settingsPanel::-webkit-scrollbar {
      width: 8px !important;
    }

    #selectedInfo::-webkit-scrollbar-thumb,
    #eventLog::-webkit-scrollbar-thumb,
    #wavePreview::-webkit-scrollbar-thumb,
    #help::-webkit-scrollbar-thumb,
    #stageIntelPanel::-webkit-scrollbar-thumb,
    #achievementPanel::-webkit-scrollbar-thumb,
    #aiFeedback::-webkit-scrollbar-thumb,
    #settingsPanel::-webkit-scrollbar-thumb {
      background: rgba(125, 211, 252, 0.38) !important;
      border-radius: 999px !important;
    }

    .hidden {
      pointer-events: none !important;
    }

    @media (max-width: 1500px) {
      :root {
        --left-w: 205px;
        --build-w: 140px;
        --wave-w: 242px;
      }

      #storyObjectiveStrip,
      .story-objective-strip {
        width: 520px !important;
        min-width: 520px !important;
        max-width: 520px !important;
      }

      #storyPanel,
      .story-panel {
        width: 520px !important;
        min-width: 520px !important;
        max-width: 520px !important;
      }

      #storyCommsPanel,
      .story-comms-panel {
        width: 390px !important;
        min-width: 390px !important;
        max-width: 390px !important;
      }

      #eventLog {
        width: 360px !important;
      }
    }

    @media (max-width: 1250px) {
      #storyObjectiveStrip,
      .story-objective-strip {
        display: none !important;
      }

      #storyPanel,
      .story-panel {
        top: 66px !important;
        width: 460px !important;
        min-width: 460px !important;
        max-width: 460px !important;
      }

      #storyCommsPanel,
      .story-comms-panel {
        top: 82px !important;
        left: 240px !important;
        width: 345px !important;
        min-width: 345px !important;
        max-width: 345px !important;
      }

      #wavePreview {
        width: 225px !important;
      }

      #eventLog {
        width: 330px !important;
      }
    }

    @media (max-width: 1000px) {
      #hud,
      #selectedInfo,
      #actionPanel {
        width: 190px !important;
      }

      #wavePreview {
        right: 168px !important;
        width: 210px !important;
      }

      #buildPanel {
        width: 132px !important;
      }

      #minimap {
        width: 136px !important;
        height: 136px !important;
      }

      #eventLog {
        width: 300px !important;
      }

      #controlStatusPanel {
        width: 280px !important;
      }
    }
  `;

  document.head.appendChild(style);
}