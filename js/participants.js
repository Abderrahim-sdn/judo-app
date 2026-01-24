// Firebase config
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

const tableBody = document.getElementById("participantsBody");

function loadParticipants() {
  tableBody.innerHTML = "";

  db.collection("participants")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const p = doc.data();

        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${p.nom}</td>
          <td>${p.prenom}</td>
          <td>${p.groupe}</td>
          <td>
            <span class="badge ${p.ceinture}">
              ${p.ceinture}
            </span>
          </td>
          <td>
            ${p.createdAt
            ? formatDate(p.createdAt.toDate())
            : "-"}
          </td>
          <td>
            <button class="delete-btn" onclick="deleteParticipant('${doc.id}')">
              Supprimer
            </button>
          </td>
        `;

        tableBody.appendChild(tr);
      });
    });
}

function deleteParticipant(id) {
  if (!confirm("Supprimer ce participant ?")) return;

  db.collection("participants").doc(id).delete()
    .then(() => loadParticipants());
}

loadParticipants();


function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
