// ---------------- IMPORT FIREBASE FUNCTION ----------------
import { saveResponse } from "./saveResponse.js";

// ---------------- STIMULI LIST ----------------
const stimuli = [
  { img: "https://placehold.co/200x200?text=Apple", caption: "Apple", correct: "Familiar" },
  { img: "https://placehold.co/200x200?text=Spaceship", caption: "Spaceship", correct: "Unfamiliar" },
  { img: "https://placehold.co/200x200?text=Book", caption: "Book", correct: "Familiar" },
  { img: "https://placehold.co/200x200?text=Alien", caption: "Alien", correct: "Unfamiliar" },
  { img: "https://placehold.co/200x200?text=Car", caption: "Car", correct: "Familiar" },
];

// ---------------- VARIABLES ----------------
let currentIndex = 0;
let responses = [];
let startTime = 0;

// ---------------- DOM ELEMENTS ----------------
const screenWelcome = document.getElementById("screen-welcome");
const screenTest = document.getElementById("screen-test");
const screenResult = document.getElementById("screen-result");

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

// ---------------- FUNCTIONS ----------------

// Start Test
btnStart.addEventListener("click", () => {
  screenWelcome.classList.add("hidden");
  screenTest.classList.remove("hidden");
  currentIndex = 0;
  responses = [];
  loadStimulus();
});

// Load Stimulus
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

// Handle Response
function handleResponse(choice) {
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  const stim = stimuli[currentIndex];
  const isCorrect = (choice === stim.correct);

  const responseData = {
    stimulus: stim.caption,
    correctAnswer: stim.correct,
    userAnswer: choice,
    correct: isCorrect,
    responseTime,
    timestamp: new Date().toISOString()
  };

  // Store locally
  responses.push(responseData);

  // Save to Firebase
  saveResponse(responseData);

  // Feedback
  if (isCorrect) {
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.className = "correct";
  } else {
    feedbackEl.textContent = "❌ Wrong!";
    feedbackEl.className = "wrong";
  }

  // Show response time
  timerEl.textContent = `${responseTime} ms`;

  // Next after 1 sec
  setTimeout(() => {
    currentIndex++;
    loadStimulus();
  }, 1000);
}

btnFam.addEventListener("click", () => handleResponse("Familiar"));
btnUnfam.addEventListener("click", () => handleResponse("Unfamiliar"));

// End Test
function endTest() {
  screenTest.classList.add("hidden");
  screenResult.classList.remove("hidden");

  const correctCount = responses.filter(r => r.correct).length;
  const accuracy = ((correctCount / responses.length) * 100).toFixed(2);
  summary.textContent = `You answered ${correctCount}/${responses.length} correctly. Accuracy: ${accuracy}%`;

  // Destroy previous charts if exist
  if (window.accuracyChart instanceof Chart) {
    window.accuracyChart.destroy();
  }
  if (window.timeChart instanceof Chart) {
    window.timeChart.destroy();
  }

  // Accuracy Chart
  window.accuracyChart = new Chart(document.getElementById("accuracyChart"), {
    type: "doughnut",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        data: [correctCount, responses.length - correctCount],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });

  // ---------------- Average Response Time Chart ----------------
  const agg = {};
  responses.forEach(r => {
    const key = r.stimulus;
    if (!agg[key]) agg[key] = { count: 0, total: 0 };
    agg[key].count += 1;
    agg[key].total += Number(r.responseTime) || 0;
  });

  const avgLabels = Object.keys(agg);
  const avgValues = avgLabels.map(label => {
    const item = agg[label];
    return +(item.total / item.count).toFixed(2);
  });

  window.timeChart = new Chart(document.getElementById("timeChart"), {
    type: "bar",
    data: {
      labels: avgLabels,
      datasets: [{
        label: "Average Response Time (ms)",
        data: avgValues,
        backgroundColor: "#3b82f6"
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `Avg: ${value} ms`;
            }
          }
        }
      }
    }
  });
}

// Restart
btnRestart.addEventListener("click", () => {
  screenResult.classList.add("hidden");
  screenWelcome.classList.remove("hidden");
});

// Download CSV
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
