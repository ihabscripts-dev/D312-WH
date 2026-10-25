const pages=["home","whitelist","rules"];
let ar=false;

/* ---------- page routing ---------- */
function go(){let h=(location.hash||"#home").slice(1);if(!pages.includes(h))h="home";
document.querySelectorAll(".page").forEach(p=>p.classList.toggle("on",p.id===h));
document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+h));scrollTo(0,0);
if(h==="whitelist")loadGate()}
addEventListener("hashchange",go);

/* ---------- language toggle ---------- */
document.getElementById("lang").onclick=function(){ar=!ar;document.documentElement.dir=ar?"rtl":"ltr";this.textContent=ar?"English":"العربية";
document.querySelectorAll("[data-en]").forEach(e=>e.innerHTML=ar?e.dataset.ar:e.dataset.en);
if(lastMe)renderWho()};

/* ---------- messages (EN / AR) ---------- */
const T={
not_logged_in:["Please log in with Discord first.","سجّل الدخول بديسكورد أولًا."],
not_in_guild:["You are not in our Discord server yet. Join it first.","لست عضوًا في سيرفر ديسكورد بعد. انضم أولًا."],
already_pending:["You already have an application under review.","لديك طلب قيد المراجعة بالفعل."],
already_whitelisted:["You are already whitelisted.","أنت مقبول بالفعل."],
invalid:["Please fill in every field correctly.","يرجى تعبئة كل الحقول بشكل صحيح."],
rate_limited:["Too many attempts. Wait a few minutes and try again.","محاولات كثيرة. انتظر بضع دقائق ثم حاول مرة أخرى."],
send_failed:["We could not send your application. Please try again later.","تعذّر إرسال طلبك. حاول لاحقًا."],
verify_failed:["We could not verify your Discord membership. Try again in a moment.","تعذّر التحقق من عضويتك في ديسكورد. حاول بعد قليل."],
denied:["Discord login was cancelled.","تم إلغاء تسجيل الدخول."],
failed:["Discord login failed. Please try again.","فشل تسجيل الدخول بديسكورد. حاول مرة أخرى."],
network:["Cannot reach the server. Try again later.","تعذّر الوصول إلى الخادم. حاول لاحقًا."]
};
const t=k=>(T[k]||T.send_failed)[ar?1:0];

/* ---------- whitelist gate ---------- */
const $=id=>document.getElementById(id);
const panels=["wl-loading","wl-login","wl-join","wl-pending","wl-done","wl-error","wl-form-wrap"];
function show(id){panels.forEach(p=>$(p).hidden=p!==id);$("ok").style.display="none"}
let lastMe=null,authError=null,errKey=null;
{const q=new URLSearchParams(location.search).get("auth");
if(q){authError=q;history.replaceState(null,"",location.pathname+location.hash)}}

function renderWho(){
const u=lastMe&&lastMe.user;if(!u)return;
$("wl-who").innerHTML="";
const img=document.createElement("img");img.src=u.avatar;img.alt="";
const span=document.createElement("span");span.textContent=u.name;
const small=document.createElement("small");small.textContent="Discord · "+u.id;span.appendChild(small);
const b=document.createElement("button");b.type="button";b.className="btn";b.textContent=ar?"تسجيل الخروج":"Log out";
b.onclick=async()=>{await fetch("/api/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});lastMe=null;loadGate()};
$("wl-who").append(img,span,b)}

async function getMe(){
try{const r=await fetch("/api/me",{cache:"no-store"});return await r.json()}
catch{return{error:"network"}}}

async function loadGate(){
show("wl-loading");
const me=await getMe();lastMe=me.loggedIn?me:null;
if(me.inviteUrl)$("wl-invite").href=me.inviteUrl;
if(me.error==="network"){return showError("network")}
if(!me.loggedIn){
const e=$("wl-autherr");e.hidden=!authError;if(authError){e.textContent=t(authError==="denied"?"denied":"failed");authError=null}
return show("wl-login")}
if(me.error)return showError(me.error);
if(me.whitelisted)return show("wl-done");
if(!me.inGuild)return show("wl-join");
if(me.pending)return show("wl-pending");
renderWho();$("f-discord").value=me.user.id;show("wl-form-wrap")}

function showError(key){errKey=key;$("wl-errmsg").textContent=t(key);show("wl-error")}
$("wl-retry").onclick=loadGate;
$("wl-recheck").onclick=loadGate;

/* "Whitelist Apply" (nav) and "Start Whitelist Apply" (home): log in first */
document.querySelectorAll('a[href="#whitelist"]').forEach(a=>a.addEventListener("click",async e=>{
e.preventDefault();
const me=await getMe();
if(me.error==="network"){location.hash="#whitelist";return}
if(!me.loggedIn){location.href="/auth/discord";return}
if(location.hash==="#whitelist")loadGate();else location.hash="#whitelist"}));

/* ---------- submit ---------- */
$("wl-form").addEventListener("submit",async e=>{
e.preventDefault();
const f=e.target,err=$("wl-formerr"),btn=$("wl-submit");
err.hidden=true;
if(!f.checkValidity()){f.reportValidity();return}
const body={};["realName","realAge","charName","charAge","experience","story"].forEach(k=>body[k]=f.elements[k].value.trim());
btn.disabled=true;
try{
const r=await fetch("/api/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const d=await r.json().catch(()=>({}));
if(r.ok&&d.ok){f.reset();panels.forEach(p=>$(p).hidden=true);const o=$("ok");o.style.display="block";o.scrollIntoView({behavior:"smooth"});return}
if(d.error==="not_in_guild"||d.error==="not_logged_in"||d.error==="already_pending"||d.error==="already_whitelisted"){return loadGate()}
err.textContent=t(d.error||"send_failed");err.hidden=false
}catch{err.textContent=t("network");err.hidden=false}
finally{btn.disabled=false}});

go();
