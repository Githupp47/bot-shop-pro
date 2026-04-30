// Public embed script. Loads as <script src="/widget.js" data-bot="<userId>"></script>
(function () {
  try {
    var current = document.currentScript;
    var botId = current && current.getAttribute("data-bot");
    var origin = current ? new URL(current.src).origin : window.location.origin;
    if (!botId) return;

    // Floating button
    var btn = document.createElement("button");
    btn.setAttribute("aria-label", "Open chat");
    btn.style.cssText =
      "position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:9999px;border:0;cursor:pointer;background:linear-gradient(135deg,#6366f1,#a855f7);box-shadow:0 10px 30px rgba(99,102,241,.45);z-index:2147483646;display:grid;place-items:center;color:#fff;";
    btn.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    // Iframe panel
    var frame = document.createElement("iframe");
    frame.src = origin + "/widget/" + encodeURIComponent(botId);
    frame.style.cssText =
      "position:fixed;bottom:96px;right:24px;width:380px;height:560px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);border:0;border-radius:18px;box-shadow:0 25px 80px rgba(0,0,0,.35);z-index:2147483647;display:none;background:#0f172a;";

    btn.onclick = function () {
      frame.style.display = frame.style.display === "none" ? "block" : "none";
    };

    document.body.appendChild(frame);
    document.body.appendChild(btn);
  } catch (e) {
    console.error("AI Commerce widget error:", e);
  }
})();
