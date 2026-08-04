import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { curriculum } from "./curriculum-dummy.js";

// Auth guard — same pattern as dashboard.js
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  renderSubject();
});

function renderSubject() {
  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("subject");

  const subject = curriculum.subjects.find((s) => s.id === subjectId);

  const titleEl = document.getElementById("subject-title");
  const subEl = document.getElementById("subject-sub");
  const listEl = document.getElementById("chapters-list");
  const notFoundEl = document.getElementById("not-found");

  if (!subject) {
    titleEl.textContent = "Subject not found";
    notFoundEl.hidden = false;
    return;
  }

  titleEl.textContent = subject.name;
  subEl.textContent = `${subject.chapters.length} chapters`;

  subject.chapters.forEach((chapterName, i) => {
    const chapterSlug = chapterName.toLowerCase().replace(/\s+/g, "-");
    const card = document.createElement("a");
    card.className = "chapter-card";
    card.href = `chapter.html?subject=${subject.id}&chapter=${chapterSlug}`;
    card.innerHTML = `
      <span class="chapter-number">${i + 1}</span>
      <span class="chapter-name">${chapterName}</span>
      <span class="chapter-arrow">→</span>
    `;
    listEl.appendChild(card);
  });
}
