// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBr7NRjf_iskyvsB8IjzNiC4dUdmSTIe94",
  authDomain: "judo-salle-management.firebaseapp.com",
  projectId: "judo-salle-management",
  storageBucket: "judo-salle-management.firebasestorage.app",
  messagingSenderId: "363794678498",
  appId: "1:363794678498:web:61cba23cdbad834d01d4bb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();


firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  }
});


// Submit participant
const form = document.getElementById("participantForm");
form.addEventListener("submit", (e) => {
  e.preventDefault(); // prevent page reload
  addParticipant();
});

// Annuler btn
const cancelBtn = document.getElementById("canceladdParticipantBtn");
cancelBtn.addEventListener("click", () => {
  form.reset();
  ceintureSelect.className = ""; // reset belt color
});



// add Participant Function
function addParticipant() {
    const nom = document.getElementById("nom").value;
    const prenom = document.getElementById("prenom").value;
    const dateNaissance = document.getElementById("dateNaissance").value; 
    const groupe = document.getElementById("groupe").value; 
    const ceinture = document.getElementById("ceinture").value;
    const dateInscriptionInput = document.getElementById("dateInscription");
    let createdAt;

    if (dateInscriptionInput.value) {
        createdAt = new Date(dateInscriptionInput.value + "T00:00:00"); // convert YYYY-MM-DD to Date
    } else {
        createdAt = new Date(); // default to today
    }

    db.collection("participants").add({
        nom: nom,
        prenom: prenom,
        dateNaissance: dateNaissance,
        groupe: groupe,
        ceinture: ceinture,
        createdAt: createdAt
    })
    .then(() => {
        Swal.fire({
            title: "Participant ajouté avec succes",
            icon: "success",
            draggable: true
        });
    });
    cancelBtn.click();
}


// Ceintures
const ceintureSelect = document.getElementById("ceinture");

ceintureSelect.addEventListener("change", () => {

    ceintureSelect.className = ceintureSelect.className.replace(/\bceinture-\w+\b/g, "");
    if (ceintureSelect.value) {
        ceintureSelect.classList.add("ceinture-" + ceintureSelect.value);
    }
});




// TopBar
const current = window.location.pathname.split("/").pop();
document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.getAttribute("href") === current) {
        btn.classList.add("active");
    }
});



// new participants Pre-fill with today’s date
document.getElementById("dateInscription").valueAsDate = new Date();