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

        const participant = doc.data();

        // Assign unique IDs to old payments if missing
        if (participant.payments && participant.payments.length > 0) {
          let updated = false;

          participant.payments = participant.payments.map(p => {
            if (!p.id) {
              p.id = Date.now().toString() + Math.random();
              updated = true;
            }
            return p;
          });

          if (updated) {
            db.collection("participants").doc(id).update({ payments: participant.payments });
          }
        }

        editingId = id;

        document.getElementById("content").style.display = "none";
        document.getElementById("editPartcipantForm").style.display = "none";
        document.getElementById("searchDiv").style.display = "none";
        document.getElementById("paymentDiv").style.display = "flex";

        const p = doc.data();

        document.getElementById("paymentParticipantName").textContent = p.nom + " " + p.prenom;

        resetPaymentForm();

        const paymentsList = document.getElementById("paymentsList");
        paymentsList.innerHTML = "";

        if (p.payments && p.payments.length > 0) {
            // Sort payments by newest month first
            const sortedPayments = [...p.payments].sort((a, b) => {
                const dateA = getExactPaymentDate(a) || getPaymentDate(a) || new Date(0);
                const dateB = getExactPaymentDate(b) || getPaymentDate(b) || new Date(0);

                // Oldest payment date first
                if (dateA - dateB !== 0) return dateA - dateB;

                // Same day → oldest created payment first (id is a creation timestamp)
                return (parseFloat(a.id) || 0) - (parseFloat(b.id) || 0);
            });

            sortedPayments.forEach(pay => {
                const div = document.createElement("div");
                div.className = "payment-item";

                const paidDate = getExactPaymentDate(pay);
                const paidLabel = paidDate ? formatDate(paidDate) : "Date inconnue";
                const monthLabel = pay.monthPaidFor ? formatMonthPaid(pay.monthPaidFor) : "-";

                div.innerHTML = `
                    <div>
                      <strong>${pay.amount} DA</strong><br>
                      Payé le : ${paidLabel}<br>
                      Mois payé : ${monthLabel}
                    </div>
                    <div class="pay-buttons">
                      <button class="edit-payment-btn"> Modifier </button>
                      <button class="delete-payment-btn"><img src="icons/trash-red.png"></button>
                    </div>
                `;

                // Delete button
                div.querySelector(".delete-payment-btn").addEventListener("click", () => {
                    deletePayment(id, pay.id);
                });

                // Edit button
                div.querySelector(".edit-payment-btn").addEventListener("click", () => {
                    editPayment(id, pay);
                });

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
  const paymentDateValue = document.getElementById("paymentDate").value;
  const monthPaidFor = document.getElementById("paymentMonth").value;

  if (!amount || amount <= 0) {
    Swal.fire("Erreur", "Montant invalide", "error");
    return;
  }

  if (!paymentDateValue) {
    Swal.fire("Erreur", "Veuillez choisir une date de paiement", "error");
    return;
  }

  if (!monthPaidFor) {
    Swal.fire("Erreur", "Veuillez choisir un mois payé", "error");
    return;
  }

  // Get current participant
  db.collection("participants").doc(editingId).get()
    .then(doc => {
      if (!doc.exists) return;

      const participant = doc.data();
      const payments = participant.payments || [];

      // Month total (several payments allowed) must not exceed the limit
      const alreadyPaidAmount = getMonthTotal(payments, monthPaidFor);
      const remaining = MAX_MONTH_AMOUNT - alreadyPaidAmount;

      if (amount > remaining) {
        Swal.fire(
          "Erreur",
          remaining <= 0
            ? `Ce mois est déjà payé en totalité (${MAX_MONTH_AMOUNT} DA)`
            : `Le total du mois ne peut pas dépasser ${MAX_MONTH_AMOUNT} DA. Déjà payé : ${alreadyPaidAmount} DA, reste : ${remaining} DA`,
          "error"
        );
        return;
      }

      // Add payment
      const payment = {
        id: Date.now().toString(),
        amount,
        paidAt: dateStringToTimestamp(paymentDateValue),
        monthPaidFor
      };

      db.collection("participants").doc(editingId).update({
        payments: firebase.firestore.FieldValue.arrayUnion(payment)
      })
      .then(() => {
        Swal.fire("Succès", "Paiement enregistré", "success");
        resetPaymentForm();
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
    resetPaymentForm();
    loadParticipants();
    editingId = null;
});

// ===== Monthly limit =====
const MAX_MONTH_AMOUNT = 1000;

// Sum of payments for a given month (YYYY-MM), optionally excluding one payment
function getMonthTotal(payments, month, excludeId = null) {
  return (payments || []).reduce((sum, pay) => {
    if (excludeId && pay.id === excludeId) return sum;
    if (pay.monthPaidFor && pay.monthPaidFor.slice(0, 7) === month.slice(0, 7)) {
      return sum + (Number(pay.amount) || 0);
    }
    return sum;
  }, 0);
}

// ===== Payment date helpers =====
let paymentMonthTouched = false;

function dateToInputString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" -> Firestore Timestamp (local noon, avoids timezone day shifts)
function dateStringToTimestamp(str) {
  const [y, m, d] = str.split("-").map(Number);
  return firebase.firestore.Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
}

// Exact payment day of a payment (paidAt, or legacy date field)
function getExactPaymentDate(pay) {
  if (pay.paidAt && typeof pay.paidAt.toDate === "function") return pay.paidAt.toDate();
  if (pay.date && typeof pay.date.toDate === "function") return pay.date.toDate();
  return null;
}

function resetPaymentForm() {
  const today = dateToInputString(new Date());
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentDate").value = today;
  document.getElementById("paymentMonth").value = today.slice(0, 7);
  paymentMonthTouched = false;
}

document.getElementById("paymentMonth").addEventListener("input", () => {
  paymentMonthTouched = true;
});

document.getElementById("paymentDate").addEventListener("change", (e) => {
  if (!paymentMonthTouched && e.target.value) {
    document.getElementById("paymentMonth").value = e.target.value.slice(0, 7);
  }
});


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

// Delete a payment
function deletePayment(participantId, paymentId) {
    Swal.fire({
        title: "Es-tu sûr ?",
        text: "Le paiement sera définitivement supprimé !",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui, supprimez-le !",
        cancelButtonText: "Non, annulez !",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // Get participant and remove the payment
            db.collection("participants").doc(participantId).get().then(doc => {
                if (!doc.exists) return;
                const participant = doc.data();
                const updatedPayments = (participant.payments || []).filter(p => p.id !== paymentId);

                db.collection("participants").doc(participantId).update({ payments: updatedPayments })
                    .then(() => {
                        Swal.fire("Supprimé !", "Paiement supprimé.", "success");
                        participantPayment(participantId); // reload payment history
                    });
            }).catch(err => {
                console.error(err);
                Swal.fire("Erreur", "Impossible de supprimer le paiement.", "error");
            });
        }
    });
}

// Edit a payment
function editPayment(participantId, pay) {
    const editPaidDate = getExactPaymentDate(pay);
    let editMonthValue = "";
    if (pay.monthPaidFor) {
        editMonthValue = pay.monthPaidFor.slice(0, 7);
    } else if (editPaidDate) {
        editMonthValue = dateToInputString(editPaidDate).slice(0, 7);
    }

    Swal.fire({
        title: "Modifier le paiement",
        html: `
            <div style="text-align:left; font-family: sans-serif;">
                <label for="swal-amount" style="display:block; margin-bottom:8px; font-size: 18px; color: #333;">Montant (DA)</label>
                <input id="swal-amount" type="number" 
                       value="${pay.amount}" 
                       style="width:100%; height: 50px; padding: 10px 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 10px; box-sizing: border-box; margin-bottom: 20px; outline: none;">

                <label for="swal-date" style="display:block; margin-bottom:8px; font-size: 18px; color: #333;">Date de paiement</label>
                <input id="swal-date" type="date" 
                       value="${editPaidDate ? dateToInputString(editPaidDate) : ''}" 
                       style="width:100%; height: 50px; padding: 10px 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 10px; box-sizing: border-box; margin-bottom: 20px; outline: none;">

                <label for="swal-month" style="display:block; margin-bottom:8px; font-size: 18px; color: #333;">Mois payé</label>
                <input id="swal-month" type="month" 
                       value="${editMonthValue}" 
                       style="width:100%; height: 50px; padding: 10px 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 10px; box-sizing: border-box; outline: none;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Enregistrer",
        cancelButtonText: "Annuler",
        confirmButtonColor: '#3085d6', // Standard mobile blue
        customClass: {
            popup: 'swal2-payment-modal',
            confirmButton: 'mobile-confirm-btn'
        },
        preConfirm: () => {
            const newAmount = parseFloat(document.getElementById('swal-amount').value);
            const newDate = document.getElementById('swal-date').value;
            const newMonth = document.getElementById('swal-month').value;

            if (!newAmount || newAmount <= 0) {
                Swal.showValidationMessage("Montant invalide");
                return false;
            }
            if (!newDate) {
                Swal.showValidationMessage("Veuillez choisir une date de paiement");
                return false;
            }
            if (!newMonth) {
                Swal.showValidationMessage("Veuillez choisir un mois");
                return false;
            }

            return { newAmount, newDate, newMonth };
        }
    }).then((result) => {
        if (!result.isConfirmed) return;

        const { newAmount, newDate, newMonth } = result.value;

        // Update Firestore logic remains the same
        db.collection("participants").doc(participantId).get().then(doc => {
            const participant = doc.data();
            const payments = participant.payments || [];

            const otherPaidAmount = getMonthTotal(payments, newMonth, pay.id);
            const remaining = MAX_MONTH_AMOUNT - otherPaidAmount;
            if (newAmount > remaining) {
                Swal.fire(
                    "Erreur",
                    remaining <= 0
                        ? `Ce mois est déjà payé en totalité (${MAX_MONTH_AMOUNT} DA)`
                        : `Le total du mois ne peut pas dépasser ${MAX_MONTH_AMOUNT} DA. Déjà payé : ${otherPaidAmount} DA, reste : ${remaining} DA`,
                    "error"
                );
                return;
            }

            const updatedPayments = payments.map(p => p.id === pay.id ? { ...p, amount: newAmount, paidAt: dateStringToTimestamp(newDate), monthPaidFor: newMonth } : p);

            db.collection("participants").doc(participantId).update({ payments: updatedPayments })
            .then(() => {
                Swal.fire("Modifié !", "Paiement mis à jour.", "success");
                if (typeof participantPayment === 'function') participantPayment(participantId);
            });
        });
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

function parseMonthString(str) {
  const [y, m] = String(str).slice(0, 7).split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

function formatMonthPaid(dateString) {
  const date = parseMonthString(dateString);

  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });
}

function getPaymentMonthDate(pay) {
  // New format (preferred)
  if (pay.monthPaidFor) {
    return parseMonthString(pay.monthPaidFor);
  }

  // Old format fallback
  if (pay.date && typeof pay.date.toDate === "function") {
    return pay.date.toDate();
  }

  // If nothing valid
  return null;
}

// Get the actual date of a payment (for old and new payment formats)
function getPaymentDate(pay) {
    // New system → monthPaidFor field (string or date)
    if (pay.monthPaidFor) {
        return new Date(pay.monthPaidFor);
    }

    // Old system → date field (Firestore Timestamp)
    if (pay.date && typeof pay.date.toDate === "function") {
        return pay.date.toDate();
    }

    // Old system → maybe paidAt field (if added)
    if (pay.paidAt && typeof pay.paidAt.toDate === "function") {
        return pay.paidAt.toDate();
    }

    return null; // no valid date
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