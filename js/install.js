let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("Install prompt captured");

  e.preventDefault();
  deferredPrompt = e;

  installBtn.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const choice = await deferredPrompt.userChoice;
  console.log("User choice:", choice.outcome);

  deferredPrompt = null;
  installBtn.style.display = "none";
});
