import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const BUSINESS_ID = "minha-assistencia";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
let currentUser = null;
let member = null;
const mainRef = () => doc(db, "businesses", BUSINESS_ID, "appData", "main");
async function ensureMember(user) {
  const ref = doc(db, "businesses", BUSINESS_ID, "members", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().active !== true) throw new Error("Conta Google sem acesso. O administrador precisa cadastrar seu UID em businesses/"+BUSINESS_ID+"/members.");
  member = snap.data();
}
async function login() {
  const result = await signInWithPopup(auth, provider);
  currentUser = result.user;
  try { await ensureMember(currentUser); } catch(e) { await signOut(auth); currentUser=null; throw e; }
  if (window.wfrozRefreshFromCloud) await window.wfrozRefreshFromCloud();
  return currentUser;
}
async function loadData() {
  if (!currentUser || !member) throw new Error("Entre com uma conta Google autorizada.");
  const snap = await getDoc(mainRef());
  if (!snap.exists()) { try { return {...{business:"Minha assistência", orders:[], clients:[], technicians:[]}, ...JSON.parse(localStorage.getItem("conserta-demo-v1")||"{}")}; } catch { return {business:"Minha assistência", orders:[], clients:[], technicians:[]}; } }
  const d=snap.data(); return {business:d.business||"Minha assistência",orders:d.orders||[],clients:d.clients||[],technicians:d.technicians||[]};
}
async function saveData(data) {
  if (!currentUser || !member) return;
  await setDoc(mainRef(), {business:data.business||"Minha assistência",orders:data.orders||[],clients:data.clients||[],technicians:data.technicians||[],updatedAt:serverTimestamp(),updatedBy:currentUser.uid});
}
async function logout(){await signOut(auth);currentUser=null;member=null;const b=document.getElementById("google-setup");if(b)b.textContent="Entrar com Google / Sincronizar";}
onAuthStateChanged(auth, async user=>{
  currentUser=user;
  if(user){try{await ensureMember(user);if(window.wfrozRefreshFromCloud) await window.wfrozRefreshFromCloud();}catch(e){console.warn(e);}}
  window.wfrozCloud.user=currentUser;
});
window.wfrozCloud={login,logout,loadData,saveData,get user(){return currentUser},get member(){return member},businessId:BUSINESS_ID};
