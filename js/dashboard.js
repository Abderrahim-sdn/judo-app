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


firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  }
});


let revenueChartInstance = null;
let newParticipantsChartInstance = null;
let beltChartInstance = null;


// LOAD DATA FROM FIRESTORE
function loadDashboardData() {
  db.collection("participants").get().then(snapshot => {
    const participants = [];

    snapshot.forEach(doc => {
      participants.push(doc.data());
    });

    updateDashboard(participants);
    renderRevenueChart(participants);
    renderNewParticipantsChart(participants);
    renderBeltChart(participants);
  })
  .catch(error => {
      console.error("Erreur lors du chargement des participants :", error);
      alert("Impossible de charger les données. Vérifiez la connexion ou la base de données.");
  });
}


function updateDashboard(participants) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let revenue = 0;
  let paid = 0;
  let unpaid = 0;

  participants.forEach(p => {
    let paidThisMonth = false;

    if (p.payments) {
      p.payments.forEach(pay => {
        if (!pay.date || typeof pay.date.toDate !== "function") return;

        const d = pay.date.toDate();
        if (d.getMonth() === month && d.getFullYear() === year) {
          revenue += pay.amount;
          paidThisMonth = true;
        }
      });
    }

    if (paidThisMonth) paid++;
    else unpaid++;
  });

  document.getElementById("monthlyRevenue").textContent = revenue + " DA";
  document.getElementById("paidCount").textContent = paid;
  document.getElementById("unpaidCount").textContent = unpaid;
  document.getElementById("totalCount").textContent = participants.length;
}


function renderRevenueChart(participants) {
    const months = [];
    const revenueData = [];

    const now = new Date();

    // Last 5 months (including current)
    for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const label = d.toLocaleString("fr-FR", {
        month: "short",
        });

        months.push(label);
        revenueData.push(0);
    }

    participants.forEach(p => {
        if (!p.payments) return;

        p.payments.forEach(pay => {
        if (!pay.date || typeof pay.date.toDate !== "function") return;

        const payDate = pay.date.toDate();

        for (let i = 0; i < 5; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);

            if (
            payDate.getMonth() === d.getMonth() &&
            payDate.getFullYear() === d.getFullYear()
            ) {
            revenueData[i] += pay.amount;
            }
        }
        });
    });

    const ctx = document.getElementById("revenueChart").getContext("2d");

    if (revenueChartInstance) {
    revenueChartInstance.destroy();
    }

    revenueChartInstance = new Chart(ctx, {
        type: "line",
        data: {
        labels: months,
        datasets: [{
            label: "Revenus (DA)",
            data: revenueData,
            backgroundColor: "rgba(34, 197, 94, 0.7)",
            borderColor: "rgba(22, 163, 74, 1)",
            // backgroundColor: "#0088CC",
            // borderColor: "#0088",
            borderWidth: 1,
            borderRadius: 8
        }]
        },
        options: {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
            beginAtZero: true
            }
        }
        }
    });
}


function renderNewParticipantsChart(participants) {
  const now = new Date();
  const monthsLabels = [];
  const newParticipantsData = [];

  // Last 5 months
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();

    monthsLabels.push(
      d.toLocaleString("fr-FR", { month: "short" })
    );

    let count = 0;

    participants.forEach(p => {
      if (!p.createdAt || typeof p.createdAt.toDate !== "function") return;

      const inscDate = p.createdAt.toDate();

      if (
        inscDate.getMonth() === month &&
        inscDate.getFullYear() === year
      ) {
        count++;
      }
    });

    newParticipantsData.push(count);
  }


  const ctx = document.getElementById("newParticipantsChart").getContext("2d");

  if (newParticipantsChartInstance) {
    newParticipantsChartInstance.destroy();
  }

  newParticipantsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthsLabels,
      datasets: [{
        label: "Nouveaux Participants",
        data: newParticipantsData,
        backgroundColor: "#6366f1cc",
        borderColor: "#6366f1",
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}


function renderBeltChart(participants) {
  const beltCounts = {};

  participants.forEach(p => {
    const belt = p.ceinture || "Inconnue";
    beltCounts[belt] = (beltCounts[belt] || 0) + 1;
  });

  const labels = Object.keys(beltCounts);
  const data = Object.values(beltCounts);

  const ctx = document.getElementById("beltChart").getContext("2d");

  // Map belt names to your CSS badge colors
  const beltColors = {
    "blanche": "#ccc",
    "jaune": "#fbc02d",
    "orange": "#fb8c00",
    "verte": "#388e3c",
    "bleue": "#1976d2",
    "marron": "#5d4037",
    "noire": "#000",
    "Inconnue": "#e0e0e0" // fallback for unknown belts
  };

  const backgroundColors = labels.map(label => beltColors[label] || "#e0e0e0");

  if (beltChartInstance) {
  beltChartInstance.destroy();
}

beltChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c === "#212121" ? "#000" : "#ccc"),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}


// TopBar
const current = window.location.pathname.split("/").pop();
document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.getAttribute("href") === current) {
        btn.classList.add("active");
    }
});

// Run when page loads
window.addEventListener("DOMContentLoaded", loadDashboardData);