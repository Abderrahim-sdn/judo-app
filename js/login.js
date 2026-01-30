// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBr7NRjf_iskyvsB8IjzNiC4dUdmSTIe94",
  authDomain: "judo-salle-management.firebaseapp.com",
  projectId: "judo-salle-management",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// LOGIN
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "participantsList.html"; // redirect after login
    })
    .catch(err => {
      errorMsg.textContent = "Email ou mot de passe incorrect";
      console.error(err.message);
    });
});
