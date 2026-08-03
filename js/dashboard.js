import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { DUMMY_CURRICULUM } from "./curriculum-dummy.js";

const overlay = document.getElementById("onboarding-overlay");
const content = document.getElementById("dashboard-content");
const onboardingForm = document.getElementById("onboarding-form");
const onboardingError = document.getElementById("onboarding-error");

// ---- Auth guard ----
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("welcome-heading").textContent =
    `Welcome back, ${user.displayName || "there"}`;
  document.getElementById("welcome-date").textContent =
    new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  if (!data.board || !data.class) {
    overlay.hidden = false;
    onboardingForm.addEventListener("submit", (e) => handleOnboarding(e, userRef));
  } else {
    renderDashboard();
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

async function handleOnboarding(e, userRef) {
  e.preventDefault();
  onboardingError.hidden = true;

  const formData = new FormData(onboardingForm);
  const board = formData.get("board");
  const studentClass = formData.get("class");

  if (!board || !studentClass) {
    onboardingError.textContent = "Please select both board and class.";
    onboardingError.hidden = false;
    return;
  }

  const submitBtn = document.getElementById("onboarding-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving…";

  try {
    await setDoc(userRef, { board, class: studentClass }, { merge: true });
    overlay.hidden = true;
    renderDashboard();
  } catch (error) {
    onboardingError.textContent = "Something went wrong. Please try again.";
    onboardingError.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Continue";
  }
}

function renderDashboard() {
  content.hidden = false;
  buildCarousel();
  buildSubjectsGrid();
}

// ---- Carousel ----
function buildCarousel() {
  const allChapters = DUMMY_CURRICULUM.subjects.flatMap((s) => s.chapters);
  const randomChapter = allChapters[Math.floor(Math.random() * allChapters.length)];

  const cards = [
    {
      title: "Test coming up?",
      text: "Let PathaSetu know so we can build your study plan around it.",
      cta: "Plan it"
    },
    {
      title: "Review your mistakes",
      text: "See where you slipped last time and fix it for good.",
      cta: "Review now"
    },
    {
      title: `Attempt a test on ${randomChapter}`,
      text: "A quick adaptive quiz, tailored to your level.",
      cta: "Start test"
    }
  ];

  const track = document.getElementById("carousel-track");
  const dotsWrap = document.getElementById("carousel-dots");
  track.innerHTML = "";
  dotsWrap.innerHTML = "";

  cards.forEach((card, i) => {
    const el = document.createElement("div");
    el.className = "carousel-card";
    el.innerHTML = `
      <h3>${card.title}</h3>
      <p>${card.text}</p>
      <button class="btn btn-primary carousel-cta">${card.cta}</button>
    `;
    track.appendChild(el);

    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });

  let index = 0;
  const dots = dotsWrap.querySelectorAll(".dot");

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function goToSlide(i) {
    index = (i + cards.length) % cards.length;
    update();
  }

  document.getElementById("carousel-prev").onclick = () => goToSlide(index - 1);
  document.getElementById("carousel-next").onclick = () => goToSlide(index + 1);

  let autoplay = setInterval(() => goToSlide(index + 1), 5000);
  const carousel = document.getElementById("carousel");
  carousel.addEventListener("mouseenter", () => clearInterval(autoplay));
  carousel.addEventListener("mouseleave", () => {
    autoplay = setInterval(() => goToSlide(index + 1), 5000);
  });

  // Basic swipe support
  let touchStartX = 0;
  track.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });
  track.addEventListener("touchend", (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (delta > 40) goToSlide(index - 1);
    if (delta < -40) goToSlide(index + 1);
  });

  update();
}

// ---- Subjects grid ----
function buildSubjectsGrid() {
  const grid = document.getElementById("subjects-grid");
  grid.innerHTML = "";

  DUMMY_CURRICULUM.subjects.forEach((subject) => {
    const card = document.createElement("a");
    card.className = "subject-card";
    card.href = `subject.html?subject=${subject.id}`;
    card.innerHTML = `
      <span class="subject-name">${subject.name}</span>
      <span class="subject-count">${subject.chapters.length} chapters</span>
    `;
    grid.appendChild(card);
  });
}
