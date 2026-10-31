import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAr9iJTIZ7s_IIm_GoA11V0kYKF9t__C5k",
  authDomain: "b10game.firebaseapp.com",
  projectId: "b10game",
  storageBucket: "b10game.firebasestorage.app",
  messagingSenderId: "623555255147",
  appId: "1:623555255147:web:367f15e641e039eacb0a2e",
  measurementId: "G-LSJ63YJ6ZN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const style = document.createElement("style");
style.textContent = `
#authScreen{position:fixed;inset:0;background:#080e19;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.authBox{width:100%;max-width:390px;background:#142238;border:1px solid #30445f;border-radius:18px;padding:24px}
.authBox h1{text-align:center;color:#26e0a1;margin-top:0}
.authBox input{width:100%;padding:14px;margin:8px 0;background:#091522;color:white;border:1px solid #40536d;border-radius:9px}
.authBtn{width:100%;padding:13px;margin-top:10px;border:0;border-radius:9px;background:#19d69a;color:#052016;font-weight:bold}
.authAlt{width:100%;padding:12px;margin-top:8px;border:1px solid #40536d;border-radius:9px;background:#203149;color:white}
.authMsg{text-align:center;color:#ffcc75;font-size:13px;min-height:20px}
#profileBox{display:none;position:fixed;inset:0;background:#000b;z-index:900;align-items:center;justify-content:center;padding:20px}
.profileInner{width:100%;max-width:380px;background:#142238;border:1px solid #40536d;border-radius:16px;padding:22px}
.profileInner h2{color:#26e0a1}
.profileInner input{width:100%;padding:12px;background:#091522;color:white;border:1px solid #40536d;border-radius:8px;margin:8px 0}
.profileInner button{padding:12px;border:0;border-radius:8px;margin:5px;background:#19d69a;font-weight:bold}
.profileInner .logout{background:#a93248;color:white}
`;
document.head.appendChild(style);

const authScreen = document.createElement("div");
authScreen.id = "authScreen";
authScreen.innerHTML = `
<div class="authBox">
<h1>B10 GAME</h1>
<p style="text-align:center;color:#bdcadd">Welcome to Demo Gaming</p>
<div id="signupFields">
<input id="authUsername" placeholder="Your username" maxlength="20">
</div>
<input id="authEmail" type="email" placeholder="Email address">
<input id="authPassword" type="password" placeholder="Password (minimum 6 characters)">
<button class="authBtn" id="signupBtn">CREATE ACCOUNT</button>
<button class="authAlt" id="loginBtn">LOGIN TO ACCOUNT</button>
<p class="authMsg" id="authMessage"></p>
<p style="color:#8498b2;font-size:11px;text-align:center">Demo coins only. No real-money transactions.</p>
</div>`;
document.body.appendChild(authScreen);

const profileBox = document.createElement("div");
profileBox.id = "profileBox";
profileBox.innerHTML = `
<div class="profileInner">
<h2>👤 Player Profile</h2>
<p id="profileEmail"></p>
<label>Username</label>
<input id="profileUsername" maxlength="20">
<button id="saveProfile">SAVE PROFILE</button>
<button id="closeProfile" style="background:#40536d;color:white">CLOSE</button>
<button id="logoutBtn" class="logout">LOG OUT</button>
<p id="profileMessage" class="authMsg"></p>
</div>`;
document.body.appendChild(profileBox);

const $ = id => document.getElementById(id);
let currentProfile = null;

function message(text) {
  $("authMessage").textContent = text;
}

function setPageVisible(visible) {
  $("home").style.display = visible ? "block" : "none";
  $("panel").classList.remove("active");
  document.querySelector("nav").style.display = visible ? "flex" : "none";
  authScreen.style.display = visible ? "none" : "flex";
}

$("signupBtn").onclick = async () => {
  const username = $("authUsername").value.trim();
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  if (username.length < 3) return message("Username must be at least 3 characters.");
  if (!email || password.length < 6) return message("Enter email and password (6+ characters).");

  try {
    message("Creating account...");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", result.user.uid), {
      username,
      avatar: "🎮",
      createdAt: serverTimestamp()
    });
    message("Account created!");
  } catch (error) {
    message(error.message);
  }
};

$("loginBtn").onclick = async () => {
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  if (!email || !password) return message("Enter your email and password.");

  try {
    message("Logging in...");
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    message(error.message);
  }
};

onAuthStateChanged(auth, async user => {
  if (!user) {
    currentProfile = null;
    setPageVisible(false);
    return;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        username: user.email.split("@")[0].slice(0, 20),
        avatar: "🎮",
        createdAt: serverTimestamp()
      });
      currentProfile = { username: user.email.split("@")[0] };
    } else {
      currentProfile = snap.data();
    }

    setPageVisible(true);
  } catch (error) {
    message("Profile error: " + error.message);
    setPageVisible(false);
  }
});

window.profileInfo = function () {
  if (!auth.currentUser) return;
  $("profileEmail").textContent = "Email: " + auth.currentUser.email;
  $("profileUsername").value = currentProfile?.username || "";
  $("profileMessage").textContent = "";
  profileBox.style.display = "flex";
};

$("saveProfile").onclick = async () => {
  const username = $("profileUsername").value.trim();

  if (username.length < 3 || username.length > 20) {
    $("profileMessage").textContent = "Username must be 3–20 characters.";
    return;
  }

  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { username });
    currentProfile.username = username;
    $("profileMessage").textContent = "Profile updated successfully!";
  } catch (error) {
    $("profileMessage").textContent = error.message;
  }
};

$("closeProfile").onclick = () => {
  profileBox.style.display = "none";
};

$("logoutBtn").onclick = async () => {
  try {
    await signOut(auth);
    profileBox.style.display = "none";
  } catch (error) {
    $("profileMessage").textContent = error.message;
  }
};
