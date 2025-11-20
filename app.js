// ---------------- IMPORT FIREBASE MODULES ----------------
import { auth, provider, signInWithPopup, onAuthStateChanged } from "./firebaseConfig.js";
import { saveResponse } from "./saveResponse.js";

// ---------------- LOGIN HANDLING ----------------

// Select login + main screens
const loginBox = document.querySelector(".absolute"); // login box div
const welcomeScreen = document.getElementById("screen-welcome");
const testScreen = document.getElementById("screen-test");
const resultScreen = document.getElementById("screen-result");
const googleLoginBtn = document.getElementById("googleLogin");
// 🔹 Prevent multiple popups
let isLoggingIn = false;

// 🔹 Google Login
googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
    console.log("✅ Login successful");
  } catch (error) {
    console.error("❌ Login failed:", error);
    alert("Login failed. Please try again.");
  }
  isLoggingIn = false;
});

// 🔹 Auth state change — automatically hide/show login box
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in as:", user.displayName);
    loginBox.classList.add("hidden");
    welcomeScreen.classList.remove("hidden");
  } else {
    loginBox.classList.remove("hidden");
    welcomeScreen.classList.add("hidden");
    testScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
  }
});


// ---------------- STIMULI LIST ----------------
const stimuli = [
  { img: "./images/apple.jpg", caption: "Apple", correct: "Familiar", type: "probe" },
  { img: "./images/spaceship.jpg", caption: "Spaceship", correct: "Unfamiliar", type: "irrelevant" },
  { img: "./images/book.jpg", caption: "Book", correct: "Familiar", type: "target" },
  { img: "./images/alien.jpg", caption: "Alien", correct: "Unfamiliar", type: "irrelevant" },
  { img: "./images/car.jpg", caption: "Car", correct: "Familiar", type: "baseline" },
];

// ---------------- VARIABLES ----------------
let currentIndex = 0;
let responses = [];
let startTime = 0;

// ---------------- DOM ELEMENTS ----------------
const btnStart = document.getElementById("btnStart");
const btnFam = document.getElementById("btnFam");
const btnUnfam = document.getElementById("btnUnfam");
const btnRestart = document.getElementById("btnRestart");
const btnDownload = document.getElementById("btnDownload");

const stimulusImg = document.getElementById("stimulusImg");
const caption = document.getElementById("caption");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");
const timerEl = document.getElementById("timer");
const feedbackEl = document.getElementById("feedback");
const summary = document.getElementById("summary");

// ---------------- HELPER FUNCTIONS ----------------
function correctedRate(k, n) {
  return Math.min(Math.max((k + 0.5) / (n + 1), 1e-6), 1 - 1e-6);
}

function z(p) {
  return Math.sqrt(2) * erfInv(2 * p - 1);
}

function erfInv(x) {
  let a = 0.147;
  let ln = Math.log(1 - x * x);
  let part1 = 2 / (Math.PI * a) + ln / 2;
  let part2 = ln / a;
  return Math.sign(x) * Math.sqrt(Math.sqrt(part1 * part1 - part2) - part1);
}

// ---------------- TEST FLOW ----------------
btnStart.addEventListener("click", () => {
  welcomeScreen.classList.add("hidden");
  testScreen.classList.remove("hidden");
  currentIndex = 0;
  responses = [];
  loadStimulus();
});

function loadStimulus() {
  if (currentIndex >= stimuli.length) {
    endTest();
    return;
  }
  const stim = stimuli[currentIndex];
  stimulusImg.src = stim.img;
  caption.textContent = stim.caption;
  progress.textContent = `Question ${currentIndex + 1} of ${stimuli.length}`;
  progressBar.style.width = `${((currentIndex + 1) / stimuli.length) * 100}%`;
  feedbackEl.textContent = "";
  timerEl.textContent = "";
  startTime = Date.now();
}

function handleResponse(choice) {
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  const stim = stimuli[currentIndex];
  const isCorrect = (choice === stim.correct);

  const responseData = {
    stimulus: stim.caption,
    type: stim.type || "probe",
    correctAnswer: stim.correct,
    userAnswer: choice,
    correct: isCorrect,
    responseTime,
    timestamp: new Date().toISOString(),
  };

  responses.push(responseData);
  saveResponse(responseData);

  feedbackEl.textContent = isCorrect ? "✅ Correct!" : "❌ Wrong!";
  feedbackEl.className = isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
  timerEl.textContent = `${responseTime} ms`;

  setTimeout(() => {
    currentIndex++;
    loadStimulus();
  }, 1000);
}

btnFam.addEventListener("click", () => handleResponse("Familiar"));
btnUnfam.addEventListener("click", () => handleResponse("Unfamiliar"));


// ---------------- ANALYSIS ----------------
function analyzeResponses(responses) {
  const probes = responses.filter(r => r.type === 'probe');
  const irrels = responses.filter(r => r.type === 'irrelevant');

  const probeFam = probes.filter(p => p.userAnswer === 'Familiar').length;
  const probeTrials = probes.length;
  const irrelFam = irrels.filter(i => i.userAnswer === 'Familiar').length;
  const irrelTrials = irrels.length;

  const hitRate = correctedRate(probeFam, probeTrials);
  const faRate = correctedRate(irrelFam, irrelTrials);
  const dprime = z(hitRate) - z(faRate);

  const flagged = dprime > 1.5;
  return { probeFam, probeTrials, irrelFam, irrelTrials, hitRate, faRate, dprime, flagged };
}


// ---------------- END TEST ----------------
function endTest() {
  testScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const correctCount = responses.filter(r => r.correct).length;
  const accuracy = ((correctCount / responses.length) * 100).toFixed(2);
  summary.textContent = `You answered ${correctCount}/${responses.length} correctly. Accuracy: ${accuracy}%`;

  const analysis = analyzeResponses(responses);
  if (analysis.flagged) {
    const flagEl = document.createElement("p");
    flagEl.textContent = "🚨 FLAGGED — Manual Review Recommended";
    flagEl.style.color = "red";
    flagEl.style.fontWeight = "bold";
    summary.appendChild(flagEl);
  }

  // Clear old charts if they exist
  if (window.accuracyChart instanceof Chart) window.accuracyChart.destroy();
  if (window.timeChart instanceof Chart) window.timeChart.destroy();

  // Accuracy Chart
  window.accuracyChart = new Chart(document.getElementById("accuracyChart"), {
    type: "doughnut",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        data: [correctCount, responses.length - correctCount],
        backgroundColor: ["#22c55e", "#ef4444"],
      }]
    }
  });

  // Average Response Time Chart
  const agg = {};
  responses.forEach(r => {
    const key = r.stimulus;
    if (!agg[key]) agg[key] = { count: 0, total: 0 };
    agg[key].count++;
    agg[key].total += Number(r.responseTime) || 0;
  });

  const avgLabels = Object.keys(agg);
  const avgValues = avgLabels.map(l => +(agg[l].total / agg[l].count).toFixed(2));

  window.timeChart = new Chart(document.getElementById("timeChart"), {
    type: "bar",
    data: {
      labels: avgLabels,
      datasets: [{
        label: "Average Response Time (ms)",
        data: avgValues,
        backgroundColor: "#3b82f6",
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } },
    },
  });
}


// ---------------- RESTART & DOWNLOAD ----------------
btnRestart.addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");
});

btnDownload.addEventListener("click", () => {
  let csv = "Stimulus,Correct Answer,User Answer,Correct?,Response Time(ms)\n";
  responses.forEach(r => {
    csv += `${r.stimulus},${r.correctAnswer},${r.userAnswer},${r.correct},${r.responseTime}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "responses.csv";
  a.click();
});
