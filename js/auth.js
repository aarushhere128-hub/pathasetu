import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const errorBox = document.getElementById("auth-error");

function showError(message) {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  if (!errorBox) return;
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function friendlyError(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try logging in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function setLoading(button, loading, label) {
  button.disabled = loading;
  button.textContent = loading ? "Please wait…" : label;
}

// ----- Sign Up -----
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const formData = new FormData(signupForm);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      showError("Passwords don't match.");
      return;
    }

    const submitBtn = document.getElementById("signup-submit");
    setLoading(submitBtn, true, "Sign up");

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }

      await setDoc(doc(db, "users", credential.user.uid), {
        name: name || "",
        email: email,
        createdAt: serverTimestamp()
      });

      window.location.href = "dashboard.html";
    } catch (error) {
      showError(friendlyError(error));
      setLoading(submitBtn, false, "Sign up");
    }
  });
}

// ----- Log In -----
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const formData = new FormData(loginForm);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    const submitBtn = document.getElementById("login-submit");
    setLoading(submitBtn, true, "Log in");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      showError(friendlyError(error));
      setLoading(submitBtn, false, "Log in");
    }
  });
}
