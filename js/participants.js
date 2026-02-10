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

const user = JSON.parse(localStorage.getItem("loggedUser"));

if (!user) {
  window.location.href = "login.html";
}


let allParticipants = [];

const tableBody = document.getElementById("participantsBody");
const cardsContainer = document.getElementById("participantsCards");

function loadParticipants() {
  tableBody.innerHTML = "";
  cardsContainer.innerHTML = "";
  allParticipants = [];

  db.collection("participants")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        allParticipants.push({
          id: doc.id,
          ...doc.data()
        });
      });

      renderParticipants(allParticipants);
      hideLoadingSkeleton();
    });
}


function renderParticipants(list) {
  tableBody.innerHTML = "";
  cardsContainer.innerHTML = "";

  list.forEach(p => {
    /* ===== TABLE ===== */
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nom}</td>
      <td>${p.prenom}</td>
      <td>${p.phone || "-"}</td>
      <td>${p.groupe}</td>
      <td><span class="badge ${p.ceinture}">${p.ceinture}</span></td>
      <td>${p.createdAt ? formatDate(p.createdAt.toDate()) : "-"}</td>
      <td>
        <button class="paiement-btn" onclick="participantPayment('${p.id}')"> Paiement </button>
        <button class="edit-btn" onclick="editParticipant('${p.id}')"> Modifier </button>
        <button class="delete-btn" onclick="deleteParticipant('${p.id}')"> Supprimer </button>
      </td>
    `;
    tableBody.appendChild(tr);

    /* ===== CARD ===== */
    const card = document.createElement("div");
    card.className = "participant-card";
    card.innerHTML = `
      <div class="participant-header">
        <div class="participant-name">${p.nom} ${p.prenom}</div>
        <span class="badge ${p.ceinture}">${p.ceinture}</span>
      </div>

      <div style="margin-bottom: 10px;" >
        ${
          isPaidThisMonth(p.payments) ? `<span class="payment-status paid">PAYÉ</span>` : `<span class="payment-status unpaid">NON PAYÉ</span>`
        }
      </div>

      <!--<div class="participant-info"> Groupe : ${p.groupe} </div>  -->
      <div class="participant-info">Téléphone : ${p.phone || "-"} </div>
      <div class="participant-info">Inscrit : ${p.createdAt ? formatDate(p.createdAt.toDate()) : "-"} </div>

      <div class="participant-actions">
        <button class="paiement-btn" onclick="participantPayment('${p.id}')"> Paiement </button>
        <button class="edit-btn" onclick="editParticipant('${p.id}')"> Modifier </button>
        <button class="delete-btn" onclick="deleteParticipant('${p.id}')">
          <img src="icons/trash-red.png">
        </button>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}


// search logic
document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchValue = e.target.value.toLowerCase().trim().split(/\s+/);

  const filtered = allParticipants.filter(p => {
    // const fullName = `${p.nom} ${p.prenom}`.toLowerCase();
    const fullText = (p.nom + " " + p.prenom + " " + (p.phone || "").replace(/\D/g, '')).toLowerCase();

    return searchValue.every(word => fullText.includes(word));
  });

  renderParticipants(filtered);

  window.scrollTo({ top: 0, behavior: "smooth" });
});



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
        history.pushState({ editOpen: true }, "");


        // Show form
        document.getElementById("content").style.display = "none";
        document.getElementById("editPartcipantForm").style.display = "flex";

        document.getElementById("nom").value = p.nom || "";
        document.getElementById("prenom").value = p.prenom || "";
        document.getElementById("phone").value = p.phone || "";

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



// Paiement
function participantPayment(id) {
    history.pushState({ paymentOpen: true }, "");

    db.collection("participants").doc(id).get()
    .then(doc => {
        if (!doc.exists) {
            Swal.fire("Erreur", "Participant introuvable", "error");
            return;
        }

        editingId = id;

        document.getElementById("content").style.display = "none";
        document.getElementById("editPartcipantForm").style.display = "none";
        document.getElementById("searchDiv").style.display = "none";
        document.getElementById("paymentDiv").style.display = "flex";

        const p = doc.data();

        document.getElementById("paymentParticipantName").textContent = p.nom + " " + p.prenom;

        const paymentsList = document.getElementById("paymentsList");
        paymentsList.innerHTML = "";

        if (p.payments && p.payments.length > 0) {

          // Sort by newest paid month
          const sortedPayments = [...p.payments].sort((a, b) => {
            const dateA = getPaymentMonthDate(a);
            const dateB = getPaymentMonthDate(b);

            return dateB - dateA; // newest first
          });

          sortedPayments.forEach(pay => {
              const div = document.createElement("div");
              div.className = "payment-item";

              let label = "";

              if (pay.monthPaidFor) {
                  // New system → show month paid for
                  label = formatMonthPaid(pay.monthPaidFor);
              } else if (pay.date) {
                  // Old system → show payment date
                  label = pay.date.toDate().toLocaleDateString("fr-FR");
              } else {
                  label = "Date inconnue";
              }

              div.textContent = `${pay.amount} DA — ${label}`;
              paymentsList.appendChild(div);
          });

        } else {
            paymentsList.innerHTML = "<em>Aucun paiement</em>";
        }
    });
}

document.getElementById("savePaymentBtn").addEventListener("click", () => {
  if (!editingId) return;

  const amount = Number(document.getElementById("paymentAmount").value);
  const monthPaidFor = document.getElementById("paymentMonth").value;

  if (!amount || amount <= 0) {
    Swal.fire("Erreur", "Montant invalide", "error");
    return;
  }

  // Get current participant
  db.collection("participants").doc(editingId).get()
    .then(doc => {
      if (!doc.exists) return;

      const participant = doc.data();
      const payments = participant.payments || [];

      // Prevent duplicate month
      const alreadyPaid = payments.some(pay => {
        return (pay.monthPaidFor && pay.monthPaidFor === monthPaidFor);
      });

      if (alreadyPaid) {
        Swal.fire("Erreur", "Ce mois a déjà été payé", "error");
        return;
      }

      // Add payment
      const payment = {
        amount,
        paidAt: firebase.firestore.Timestamp.now(),
        monthPaidFor
      };

      db.collection("participants").doc(editingId).update({
        payments: firebase.firestore.FieldValue.arrayUnion(payment)
      })
      .then(() => {
        Swal.fire("Succès", "Paiement enregistré", "success");
        document.getElementById("paymentAmount").value = "";
        participantPayment(editingId); // reload payment history
      })
      .catch(err => {
        console.error(err);
        Swal.fire("Erreur", "Impossible d'enregistrer le paiement", "error");
      });
    });
});

document.getElementById("cancelPaymentBtn").addEventListener("click", () => {
    document.getElementById("paymentDiv").style.display = "none";
    document.getElementById("content").style.display = "block";
    document.getElementById("searchDiv").style.display = "flex";
    document.getElementById("searchInput").value = "";
    document.getElementById("paymentAmount").value = "";
    document.getElementById("paymentMonth").value = "";
    loadParticipants();
    editingId = null;
});

// document.getElementById("paymentMonth").valueAsDate = new Date();


function isPaidThisMonth(payments = []) {
  if (!payments || payments.length === 0) return false;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return payments.some(p => {
    const d = getPaymentMonthDate(p);
    if (!d) return false;

    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
}



function hideLoadingSkeleton() {
  document.getElementById("loadingSkeleton").style.display = "none";
  updateLayout();
}

function updateLayout() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    document.getElementById("participantsCards").style.display = "block";
    document.getElementById("participantsBody").style.display = "none";
  } else {
    document.getElementById("participantsBody").style.display = "table-row-group";
    document.getElementById("participantsCards").style.display = "none";
  }
}

window.addEventListener("resize", updateLayout);


// Ceintures
const ceintureSelect = document.getElementById("ceinture");

ceintureSelect.addEventListener("change", () => {
    // Remove old belt class
    ceintureSelect.className = ceintureSelect.className.replace(/\bceinture-\w+\b/g, "");
    // Add new belt class based on selected value
    if (ceintureSelect.value) {
        ceintureSelect.classList.add("ceinture-" + ceintureSelect.value);
    }
});


const filterCeinture = document.getElementById("filterCeinture");

filterCeinture.addEventListener("change", () => {
  const value = filterCeinture.value;

  // Remove old belt classes
  filterCeinture.classList.remove(
    "ceinture-blanche",
    "ceinture-jaune",
    "ceinture-orange",
    "ceinture-verte",
    "ceinture-bleue",
    "ceinture-marron",
    "ceinture-noire"
  );

  // Add new class if selected
  if (value) {
    filterCeinture.classList.add("ceinture-" + value);
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
    const phone = document.getElementById("phone").value.trim();
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
        phone,
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


// TopBar
const current = window.location.pathname.split("/").pop();
document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.getAttribute("href") === current) {
        btn.classList.add("active");
    }
});

// Filter
const filterBtn = document.getElementById("filterBtn");
const filterIcon = document.getElementById("filterIcon");
const filterPanel = document.getElementById("filterPanel");
const applyFiltersBtn = document.getElementById("applyFilters");
const resetFiltersBtn = document.getElementById("resetFilters");

// Show filter panel
filterBtn.addEventListener("click", () => {
  const isOpening = !filterPanel.classList.contains("active");

  if (isOpening) {
    history.pushState({ filterOpen: true }, "");
  }

  filterPanel.classList.toggle("active");
});

// Apply filters
applyFiltersBtn.addEventListener("click", () => {
  const groupe = document.getElementById("filterGroupe").value;
  const ceinture = document.getElementById("filterCeinture").value;
  const paymentStatus = document.getElementById("filterPayment").value;

  const filtered = allParticipants.filter(p => {
    const matchGroupe = groupe === "" || p.groupe === groupe;
    const matchCeinture = ceinture === "" || p.ceinture === ceinture;

    let matchPayment = true;
    if (paymentStatus === "paid") {
      matchPayment = isPaidThisMonth(p.payments);
    } else if (paymentStatus === "unpaid") {
      matchPayment = !isPaidThisMonth(p.payments);
    }

    return matchGroupe && matchCeinture && matchPayment;
  });

  renderParticipants(filtered);

  filterBtn.style.backgroundColor = "#0088CC";
  filterIcon.src = "icons/filter-white.png";
  filterPanel.classList.remove("active");
});


// Reset filters
resetFiltersBtn.addEventListener("click", () => {
  document.getElementById("filterGroupe").value = "";
  document.getElementById("filterCeinture").value = "";
  document.getElementById("filterPayment").value = "";

  renderParticipants(allParticipants);

  filterBtn.style.backgroundColor = "white";
  filterIcon.src = "icons/filter.png";
  filterPanel.classList.remove("active");
});


function logout() {
  localStorage.removeItem("loggedUser");
  window.location.replace("login.html");
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatMonthPaid(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });
}

function getPaymentMonthDate(pay) {
  // New format (preferred)
  if (pay.monthPaidFor) {
    return new Date(pay.monthPaidFor);
  }

  // Old format fallback
  if (pay.date && typeof pay.date.toDate === "function") {
    return pay.date.toDate();
  }

  // If nothing valid
  return null;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.log('SW registration failed:', err));
}


const searchDiv = document.getElementById("searchDiv");

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;

  // If scrolling DOWN → hide
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    searchDiv.classList.add("hide");
  }
  // If scrolling UP → show
  else if (currentScrollY < lastScrollY) {
    searchDiv.classList.remove("hide");
  }

  lastScrollY = currentScrollY;
});


const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  scrollToTopSmooth();
});

function scrollToTopSmooth() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Back erow logig
let lastBack = 0;
window.addEventListener("popstate", function () {

  // If payment is open → close it
  if (document.getElementById("paymentDiv").style.display === "flex") {
    document.getElementById("paymentDiv").style.display = "none";
    document.getElementById("content").style.display = "block";
    document.getElementById("searchDiv").style.display = "flex";
    return;
  }

  // If edit form open → close it
  if (document.getElementById("editPartcipantForm").style.display === "flex") {
    document.getElementById("editPartcipantForm").style.display = "none";
    document.getElementById("content").style.display = "block";
    return;
  }

  // If filter panel open → close it
  if (document.getElementById("filterPanel").classList.contains("active")) {
    document.getElementById("filterPanel").classList.remove("active");
    return;
  }

const now = new Date().getTime();
if (now - lastBack < 2000) {
  history.back();
} else {
  alert("Appuyez encore pour quitter");
  lastBack = now;
  history.pushState(null, "");
}

});


loadParticipants();
updateLayout();