let deferredPrompt;
const installBtn = document.getElementById("installBtn");


installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === "accepted") {
    console.log("App installed");
  }

  deferredPrompt = null;
  installBtn.style.display = "none";
});
