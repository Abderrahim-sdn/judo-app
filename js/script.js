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


// Add Participant Function
function addParticipant() {
  const name = document.getElementById("name").value;
  const belt = document.getElementById("belt").value;

  if (name === "" || belt === "") {
    alert("Remplir tous les champs");
    return;
  }

  db.collection("participants").add({
    name: name,
    belt: belt,
    createdAt: new Date()
  })
  .then(() => {
    alert("Participant ajouté");
    document.getElementById("name").value = "";
    document.getElementById("belt").value = "";
    loadParticipants();
  });
}


// Display Participants
// function loadParticipants() {
//   const list = document.getElementById("participantsList");
//   list.innerHTML = "";

//   db.collection("participants").get().then((snapshot) => {
//     snapshot.forEach((doc) => {
//       const li = document.createElement("li");
//       li.textContent = doc.data().name + " - " + doc.data().belt;
//       list.appendChild(li);
//     });
//   });
// }

// loadParticipants();





// Ceintures
const ceintureSelect = document.getElementById("ceinture");

ceintureSelect.addEventListener("change", () => {
  ceintureSelect.className = ""; // reset
  if (ceintureSelect.value !== "") {
    ceintureSelect.classList.add("ceinture-" + ceintureSelect.value);
  }
});
