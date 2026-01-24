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
const cardsContainer = document.getElementById("participantsCards");

function loadParticipants() {
  tableBody.innerHTML = "";
  cardsContainer.innerHTML = "";

  db.collection("participants")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const p = doc.data();

        /* ===== TABLE ROW (DESKTOP) ===== */
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.nom}</td>
          <td>${p.prenom}</td>
          <td>${p.groupe}</td>
          <td>
            <span class="badge ${p.ceinture}">${p.ceinture}</span>
          </td>
          <td>${p.createdAt ? formatDate(p.createdAt.toDate()) : "-"}</td>
          <td>
            <button class="edit-btn" onclick="editParticipant('${doc.id}')"> Modifier </button>
            <button class="delete-btn" onclick="deleteParticipant('${doc.id}')"> Supprimer </button>
          </td>
        `;
        tableBody.appendChild(tr);

        /* ===== CARD (MOBILE) ===== */
        const card = document.createElement("div");
        card.className = "participant-card";
        card.innerHTML = `
          <div class="participant-header">
            <div class="participant-name">${p.nom} ${p.prenom}</div>
            <span class="badge ${p.ceinture}">${p.ceinture}</span>
          </div>

          <div class="participant-info">Groupe : ${p.groupe}</div>
          <div class="participant-info">Inscrit : ${
            p.createdAt ? formatDate(p.createdAt.toDate()) : "-"
          }</div>

          <div class="participant-actions">
            <button class="edit-btn" onclick="editParticipant('${doc.id}')"> Modifier </button>
            <button class="delete-btn" onclick="deleteParticipant('${doc.id}')"> Supprimer </button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    });
}


function deleteParticipant(id) {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger"
        },
        buttonsStyling: true
    });

    swalWithBootstrapButtons.fire({
        title: "Es-tu sûr?",
        text: "Vous ne pourrez pas revenir en arrière !",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui, supprimez-le !",
        cancelButtonText: "Non, annulez !",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // Delete only if confirmed
            db.collection("participants").doc(id).delete()
            .then(() => {
                Swal.fire("Supprimé !", "Le participant a été supprimé.", "success");
                loadParticipants();
            })
            .catch(err => {
                Swal.fire("Erreur", "Impossible de supprimer le participant.", "error");
                console.error(err);
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            swalWithBootstrapButtons.fire({
                title: "Annulé",
                text: "Vous avez annulé",
                icon: "error"
            });
        }
    });
}

let editingId = null; // to track which participant is being edited

function editParticipant(id) {
    db.collection("participants").doc(id).get()
    .then(doc => {
        if (!doc.exists) {
            Swal.fire("Erreur", "Participant introuvable", "error");
            return;
        }

        const p = doc.data();
        editingId = id; // set editing ID

        // Show form
        document.getElementById("content").style.display = "none";
        document.getElementById("editPartcipantForm").style.display = "flex";

        document.getElementById("nom").value = p.nom || "";
        document.getElementById("prenom").value = p.prenom || "";

        let dateNaiss = "";
        if (p.dateNaissance) {
            if (typeof p.dateNaissance.toDate === "function") {
                dateNaiss = p.dateNaissance.toDate().toISOString().split("T")[0];
            } else if (typeof p.dateNaissance === "string") {
                dateNaiss = p.dateNaissance;
            }
        }
        document.getElementById("dateNaissance").value = dateNaiss;

        // Groupe
        document.getElementById("groupe").value = p.groupe || "";

        // Ceinture
        const ceintureSelect = document.getElementById("ceinture");
        ceintureSelect.value = p.ceinture || "";
        ceintureSelect.className = ceintureSelect.className.replace(/\bceinture-\w+\b/g, "");
        if (p.ceinture) ceintureSelect.classList.add("ceinture-" + p.ceinture);

        // Date inscription safely
        let dateInscr = "";
        if (p.createdAt) {
            if (typeof p.createdAt.toDate === "function") {
                dateInscr = p.createdAt.toDate().toISOString().split("T")[0];
            } else if (typeof p.createdAt === "string") {
                dateInscr = p.createdAt;
            }
        }
        document.getElementById("dateInscription").value = dateInscr;
    });
}

const ceintureSelect = document.getElementById("ceinture");

ceintureSelect.addEventListener("change", () => {
    // Remove old belt class
    ceintureSelect.className = ceintureSelect.className.replace(/\bceinture-\w+\b/g, "");
    // Add new belt class based on selected value
    if (ceintureSelect.value) {
        ceintureSelect.classList.add("ceinture-" + ceintureSelect.value);
    }
});



const form = document.getElementById("editPartcipantForm");

form.addEventListener("submit", (e) => {
    e.preventDefault(); // prevent page reload

    if (!editingId) return; // safety check

    // Get form values
    const nom = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const dateNaissanceValue = document.getElementById("dateNaissance").value;
    const groupe = document.getElementById("groupe").value;
    const ceinture = document.getElementById("ceinture").value;
    const dateInscriptionValue = document.getElementById("dateInscription").value;

    // Convert dates to Firestore Timestamps
    const dateNaissance = dateNaissanceValue ? firebase.firestore.Timestamp.fromDate(new Date(dateNaissanceValue)) : null;
    const createdAt = dateInscriptionValue ? firebase.firestore.Timestamp.fromDate(new Date(dateInscriptionValue)) : null;

    // Update Firestore document
    db.collection("participants").doc(editingId).update({
        nom,
        prenom,
        dateNaissance,
        groupe,
        ceinture,
        createdAt
    })
    .then(() => {
        Swal.fire("Modifié !", "Le participant a été mis à jour.", "success");
        form.reset();
        form.style.display = "none";
        document.getElementById("content").style.display = "block";
        editingId = null;
        loadParticipants();
    })
    .catch(err => {
        Swal.fire("Erreur", "Impossible de mettre à jour le participant.", "error");
        console.error(err);
    });
});


document.getElementById("cancelEditParticipantBtn").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("editPartcipantForm").style.display = "none";
    document.getElementById("content").style.display = "block";
    editingId = null;
});




function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}



loadParticipants();