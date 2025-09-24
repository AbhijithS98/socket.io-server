document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const cancelBtn = document.getElementById("cancelBtn");
  const form = document.getElementById("apiForm");

  // --- Populate API key if saved ---
  async function loadApiKey() {
    try {
      const savedKey = await window.api.getApiKey();
      if (savedKey) {
        apiKeyInput.value = savedKey; 
      }
    } catch (err) {
      console.error("Failed to load API key:", err);
    }
  }

  // Save API key
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;

    try {
      await window.api.saveApiKey(apiKey);
      await window.api.loadPage("index.html");
    } catch (err) {
      console.error("Failed to save API key:", err);
      alert("Failed to save API key. See console for details.");
    }
  });

  // Button click logic
  if (cancelBtn) {
    cancelBtn.addEventListener("click", async () => {
      await window.api.loadPage("index.html");
    });
  }

  loadApiKey();
});
