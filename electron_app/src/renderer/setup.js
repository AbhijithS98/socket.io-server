document.addEventListener("DOMContentLoaded", () => {
  const cancelBtn = document.getElementById("cancelBtn");
  const form = document.getElementById("apiForm");

  // Save API key
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById("apiKeyInput").value.trim();
    if (!apiKey) return;

    await window.api.saveApiKey(apiKey); 
    await window.api.loadPage("index.html"); 
  });

  // Button click logic
  if (cancelBtn) {
    cancelBtn.addEventListener("click", async () => {
      console.log("clieckkedd");

      await window.api.loadPage("index.html");
    });
  }
});
