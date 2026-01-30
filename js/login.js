const firebaseConfig = {
  apiKey: "AIzaSyBr7NRjf_iskyvsB8IjzNiC4dUdmSTIe94",
  authDomain: "judo-salle-management.firebaseapp.com",
  projectId: "judo-salle-management",
  storageBucket: "judo-salle-management.firebasestorage.app",
  messagingSenderId: "363794678498",
  appId: "1:363794678498:web:61cba23cdbad834d01d4bb"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.getElementById("loginBtn").addEventListener("click", () => {
    login();
});

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("loginError");

  if (!username || !password) {
    errorMsg.textContent = "Remplissez tous les champs.";
    return;
  }

  db.collection("users")
    .where("username", "==", username)
    .where("password", "==", password)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        errorMsg.textContent = "Nom d'utilisateur ou mot de passe incorrect.";
        return;
      }

      const userData = snapshot.docs[0].data();

      // Save session
      localStorage.setItem("loggedUser", JSON.stringify(userData));

      // Redirect
      window.location.href = "participantsList.html";
    })
    .catch(err => {
      console.error(err);
      errorMsg.textContent = "Erreur de connexion.";
    });
}
