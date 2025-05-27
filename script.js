
const firebaseConfig = {
  apiKey: "AIzaSyBAfn9_W_ty4JNXxEgViu_1kqUQ4GM4g5M",
  authDomain: "indian-monopoly-3bb93.firebaseapp.com",
  projectId: "indian-monopoly-3bb93",
  storageBucket: "indian-monopoly-3bb93.appspot.com",
  messagingSenderId: "211270829889",
  appId: "1:211270829889:web:3717c913c4a3cb0ebe83c0",
  measurementId: "G-GCEQ2VBXDZ"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function addPlayer() {
  const name = document.getElementById('playerName').value.trim();
  const pin = document.getElementById('playerPin').value.trim();
  if (!name || !pin || pin.length !== 4) return alert('Enter name and 4-digit PIN');
  await db.collection("players").doc(name).set({ balance: 1500, pin });
  generateQR(name);
  document.getElementById('playerName').value = '';
  document.getElementById('playerPin').value = '';
}

async function generateQR(name) {
  const qrDiv = document.createElement('div');
  qrDiv.className = 'p-2 border rounded text-center';
  qrDiv.innerHTML = `<strong>${name}</strong><br><canvas id="qr-${name}"></canvas>`;
  document.getElementById('playersList').appendChild(qrDiv);
  QRCode.toCanvas(document.getElementById(`qr-${name}`), name);
  updateDropdowns();
}

async function updateDropdowns() {
  const playersSnap = await db.collection("players").get();
  const names = playersSnap.docs.map(doc => doc.id);
  const selects = ['fromPlayer', 'toPlayer', 'loanPlayer', 'balancePlayer'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = names.map(name => `<option value="${name}">${name}</option>`).join('');
  });
}

async function transferMoney() {
  const from = document.getElementById('fromPlayer').value;
  const to = document.getElementById('toPlayer').value;
  const amt = parseInt(document.getElementById('amount').value);
  const pin = document.getElementById('fromPin').value;
  if (!from || !to || !amt || from === to || pin.length !== 4) return alert("Invalid input");

  const fromRef = db.collection("players").doc(from);
  const toRef = db.collection("players").doc(to);
  const fromDoc = await fromRef.get();
  const toDoc = await toRef.get();

  if (!fromDoc.exists || !toDoc.exists) return alert("Player not found");
  if (fromDoc.data().pin !== pin) return alert("Incorrect PIN");
  if (fromDoc.data().balance < amt) return alert("Insufficient balance");

  await fromRef.update({ balance: fromDoc.data().balance - amt });
  await toRef.update({ balance: toDoc.data().balance + amt });

  await db.collection("players").doc(from).collection("transactions").add({ to, amt, type: "sent", time: Date.now() });
  await db.collection("players").doc(to).collection("transactions").add({ from, amt, type: "received", time: Date.now() });

  alert(`₹${amt} transferred from ${from} to ${to}`);
}

async function giveLoan() {
  const name = document.getElementById('loanPlayer').value;
  const ref = db.collection("players").doc(name);
  const doc = await ref.get();
  if (!doc.exists) return alert("Player not found");
  await ref.update({ balance: doc.data().balance + 200 });
  await db.collection("players").doc(name).collection("transactions").add({ amt: 200, type: "loan", time: Date.now() });
  alert(`${name} got a ₹200 loan`);
}

async function checkBalance() {
  const name = document.getElementById('balancePlayer').value;
  const ref = db.collection("players").doc(name);
  const doc = await ref.get();
  if (!doc.exists) return alert("Player not found");
  document.getElementById('balanceResult').innerText = `₹${doc.data().balance}`;
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
}

window.onload = updateDropdowns;
