import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


const ADMIN_EMAIL = "aarushhere128@gmail.com";

const statusEl = document.getElementById("admin-status");
const tableWrap = document.getElementById("table-wrap");
const rowsEl = document.getElementById("user-rows");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    statusEl.textContent = "You must be logged in to view this page.";
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    statusEl.textContent = "You don't have access to this page.";
    return;
  }

  statusEl.textContent = "Loading users…";

  try {
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      statusEl.textContent = "No users found yet.";
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const row = document.createElement("tr");

      const joined = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleDateString()
        : "—";

      row.innerHTML = `
        <td>${escapeHtml(data.name || "—")}</td>
        <td>${escapeHtml(data.email || "—")}</td>
        <td>${joined}</td>
      `;
      rowsEl.appendChild(row);
    });

    statusEl.hidden = true;
    tableWrap.hidden = false;
  } catch (error) {
    statusEl.textContent = "Couldn't load users. Check Firestore rules and try again.";
    console.error(error);
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
