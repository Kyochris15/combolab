const SUPABASE_URL = "https://ddlsfykjsdxwvwuxhirz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbHNmeWtqc2R4d3Z3dXhoaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzIwMDEsImV4cCI6MjEwNzc0ODAwMX0.s8C4Wn_vqMlB8fTqMIuhN4zwYYRbD7spTqSa-GwmPk0";
const BUCKET = "combos";

// Edita este array con tu email para ser admin
const ADMIN_EMAILS = ["matiassepulveda51@gmail.com"];

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const authModal = document.getElementById("authModal");
const profileModal = document.getElementById("profileModal");
const detailModal = document.getElementById("detailModal");
const modModal = document.getElementById("modModal");

let session = null, myProfile = null, allCombos = [], myFavs = new Set(), myFollows = new Set(), profilesMap = {}, activeTab = "new", currentCombo = null, viewingUserId = null;

function isAdmin(){ return session && ADMIN_EMAILS.includes(session.user.email); }

function showStatus(elId, text, type){
  const el = document.getElementById(elId);
  if(!el) return;
  el.textContent = text;
  el.className = type==="ok" ? "ok" : (type==="err" ? "err" : "");
  el.style.display = "block";
  setTimeout(()=>{ el.style.display="none"; el.className=""; }, 4000);
}

// ---------- AUTH + PROFILE ----------
async function refreshAuth(){
  const { data } = await supa.auth.getSession();
  session = data.session || null;
  const email = session?.user?.email || "";
  document.getElementById("userEmail").textContent = myProfile?.username ? "@"+myProfile.username : email;
  document.getElementById("footUser").textContent = email ? `Logeado como ${email}` : "Explora sin cuenta, sube con cuenta";
  document.getElementById("btnLogin").classList.toggle("hidden", !!session);
  document.getElementById("btnLogout").classList.toggle("hidden", !session);
  document.getElementById("btnProfile").classList.toggle("hidden", !session);
  document.getElementById("btnModerar").classList.toggle("hidden", !isAdmin());
  document.getElementById("loginHint").style.display = session ? "none" : "block";
  if (session) {
    await ensureProfile();
    await loadMyFollows();
  }
  await loadCombos();
}
async function ensureProfile(){
  if(!session) return;
  const { data } = await supa.from("profiles").select("*").eq("id", session.user.id).single();
  if (!data) { showView("profile"); profileModal.showModal(); return; }
  myProfile = data;
  document.getElementById("userEmail").textContent = "@"+data.username;
  fillProfileForm(data); fillProfilePage(data);
}
function fillProfileForm(p){
  document.getElementById("pUsername").value = p.username||"";
  document.getElementById("pBio").value = p.bio||"";
  document.getElementById("pTwitter").value = p.twitter||"";
  document.getElementById("pYoutube").value = p.youtube||"";
  document.getElementById("pTwitch").value = p.twitch||"";
}
async function fillProfilePage(p){
  if(!p) return;
  document.getElementById("pvUsername").textContent = "@"+(p.username||"user");
  document.getElementById("pvBio").textContent = p.bio||"";
  const lvl = p.level||1;
  const xp = p.xp||0;
  const next = lvl*100;
  document.getElementById("pvStats").innerHTML = `<span class="level-tag">Nivel ${lvl}</span> • ${xp}/${next} XP <div class="xp-bar"><div class="xp-fill" style="width:${(xp/next)*100}%"></div></div>`;
  document.getElementById("pvSocials").innerHTML = `${p.twitter?`<a href="${p.twitter}" target="_blank">X</a>`:""} ${p.youtube?`<a href="${p.youtube}" target="_blank">YT</a>`:""} ${p.twitch?`<a href="${p.twitch}" target="_blank">Twitch</a>`:""}`;
  document.getElementById("pAvatar").src = p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`;
  const b = document.getElementById("pBanner");
  if(p.banner_url){ b.style.backgroundImage = `url('${p.banner_url}')`; b.style.backgroundColor=""; }
  else { b.style.backgroundImage=""; b.style.backgroundColor = p.banner_color||"#8b5cf6"; }
  document.getElementById("eUsername").value = p.username||"";
  document.getElementById("eBio").value = p.bio||"";
  document.getElementById("eTwitter").value = p.twitter||"";
  document.getElementById("eYoutube").value = p.youtube||"";
  document.getElementById("eTwitch").value = p.twitch||"";
  document.getElementById("eAvatarUrl").value = p.avatar_url||"";
  document.getElementById("eBannerUrl").value = p.banner_url||"";
  if(p.banner_color) document.getElementById("eBannerColor").value = p.banner_color;
  await renderUserBadges(p.id);
}
async function renderUserBadges(userId){
  const { data } = await supa.from("user_badges").select("badge_id").eq("user_id", userId);
  const ids = new Set((data||[]).map(b=>b.badge_id));
  const box = document.getElementById("pvBadges");
  box.innerHTML = "";
  const all = await supa.from("badges").select("*");
  (all.data||[]).forEach(bg=>{
    const earned = ids.has(bg.id);
    box.innerHTML += `<span class="badge-pill" style="opacity:${earned?1:.3}">${bg.icon} ${bg.name}</span>`;
  });
}
async function loadMyFollows(){
  if(!session) return;
  const { data } = await supa.from("follows").select("following_id").eq("follower_id", session.user.id);
  myFollows = new Set((data||[]).map(f=>f.following_id));
}

document.getElementById("btnLogin").onclick = () => authModal.showModal();
document.getElementById("btnHome").onclick = () => { viewingUserId=null; showView("home"); };
document.getElementById("btnProfile").onclick = () => { viewingUserId=null; showView("profile"); loadProfilePage(null); };
document.getElementById("btnModerar").onclick = () => { showView("home"); openModeration(); };
document.getElementById("btnLogout").onclick = async () => { await supa.auth.signOut(); session=null; myProfile=null; myFavs=new Set(); myFollows=new Set(); viewingUserId=null; refreshAuth(); };
supa.auth.onAuthStateChange(() => refreshAuth());

document.getElementById("btnSignup").onclick = async (e) => {
  e.preventDefault();
  const email = document.getElementById("aEmail").value, pass = document.getElementById("aPass").value;
  const { error } = await supa.auth.signUp({ email, password: pass });
  if (error) showStatus("authStatus", "Error: "+error.message, "err");
  else { showStatus("authStatus", "Cuenta creada. Ahora presiona Entrar.", "ok"); authModal.close(); refreshAuth(); }
};
document.getElementById("btnSignin").onclick = async (e) => {
  e.preventDefault();
  const email = document.getElementById("aEmail").value, pass = document.getElementById("aPass").value;
  const { error } = await supa.auth.signInWithPassword({ email, password: pass });
  if (error) showStatus("authStatus", "Error: "+error.message, "err");
  else { showStatus("authStatus", "Entrando...", "ok"); authModal.close(); refreshAuth(); }
};
document.getElementById("btnSaveProfile").onclick = async (e) => {
  e.preventDefault();
  const st = document.getElementById("profileStatus");
  let username = document.getElementById("pUsername").value.trim().replace(/\s+/g,"_");
  if (username.length < 3) { showStatus("profileStatus", "Username mínimo 3 letras.", "err"); return; }
  const payload = { id: session.user.id, username,
    bio: document.getElementById("pBio").value.trim(),
    twitter: document.getElementById("pTwitter").value.trim(),
    youtube: document.getElementById("pYoutube").value.trim(),
    twitch: document.getElementById("pTwitch").value.trim() };
  const { error } = await supa.from("profiles").upsert(payload);
  if (error) { showStatus("profileStatus", "Error: "+error.message+" (¿username tomado?)", "err"); return; }
  showStatus("profileStatus", "Perfil guardado ✓", "ok");
  myProfile = payload; profileModal.close(); refreshAuth();
};

// ---------- VISTAS ----------
function showView(name, userId=null){
  document.getElementById("view-home").classList.toggle("hidden", name!=="home");
  document.getElementById("view-profile").classList.toggle("hidden", name!=="profile");
  document.querySelector(".tabs").style.display = name==="home" ? "flex" : "none";
  document.getElementById("btnHome").classList.toggle("primary", name==="home");
  viewingUserId = userId;
  if(name==="profile") loadProfilePage(userId);
  window.scrollTo({top:0});
}

// ---------- XP / LEVELS ----------
async function addXP(userId, amount, reason){
  if(!userId) return;
  const { data: prof } = await supa.from("profiles").select("xp,level").eq("id", userId).single();
  if(!prof) return;
  let newXP = (prof.xp||0) + amount;
  let newLevel = prof.level||1;
  while(newXP >= newLevel*100){ newXP -= newLevel*100; newLevel++; }
  await supa.from("profiles").update({ xp: newXP, level: newLevel }).eq("id", userId);
  await checkBadges(userId);
  if(session && session.user.id===userId) refreshAuth();
}
async function checkBadges(userId){
  const { data: combos } = await supa.from("combos").select("id").eq("user_id", userId);
  const { data: comments } = await supa.from("comments").select("id").eq("user_id", userId);
  const { data: prof } = await supa.from("profiles").select("xp").eq("id", userId).single();
  const totalLikes = (await supa.from("combos").select("likes").eq("user_id", userId)).data||[];
  const sumLikes = totalLikes.reduce((s,c)=>s+(c.likes||0),0);

  const rules = [
    { id: 'first_combo', cond: combos&&combos.length>=1 },
    { id: 'five_combos', cond: combos&&combos.length>=5 },
    { id: 'hundred_likes', cond: sumLikes>=100 },
    { id: 'commenter', cond: comments&&comments.length>=5 }
  ];
  // traer badges ya ganados
  const { data: owned } = await supa.from("user_badges").select("badge_id").eq("user_id", userId);
  const ownedIds = new Set((owned||[]).map(b=>b.badge_id));
  for (const r of rules){
    if(r.cond && !ownedIds.has(r.id)){
      await supa.from("user_badges").insert({ user_id: userId, badge_id: r.id }).select();
    }
  }
}

// ---------- DATA ----------
async function loadCombos(){
  const { data } = await supa.from("combos").select("*").order("created_at",{ascending:false}).limit(200);
  allCombos = data || [];
  const ids = [...new Set(allCombos.map(c=>c.user_id).filter(Boolean))];
  if (ids.length) {
    const { data: profs } = await supa.from("profiles").select("*").in("id", ids);
    profilesMap = {}; (profs||[]).forEach(p=>profilesMap[p.id]=p);
  }
  myFavs = new Set();
  if (session) {
    const { data: favs } = await supa.from("favorites").select("combo_id").eq("user_id", session.user.id);
    (favs||[]).forEach(f=>myFavs.add(f.combo_id));
  }
  render();
}
function gameClass(j){ if(!j) return ""; if(j.includes("Street")) return "SF6"; if(j.includes("Tekken")) return "T8"; return ""; }
function usernameOf(c){
  if (profilesMap[c.user_id]) return "@"+profilesMap[c.user_id].username;
  return c.author_email || "anónimo";
}

function render(){
  const q = document.getElementById("search").value.toLowerCase();
  const j = document.getElementById("filterJuego").value;
  const d = document.getElementById("filterDif").value;
  const cat = document.getElementById("filterCat").value;
  const sort = document.getElementById("sortBy").value;
  const weekAgo = Date.now() - 7*24*3600*1000;

  let fil = allCombos.filter(c =>
    (!j || c.juego===j) && (!d || c.dificultad===d) && (!cat || c.categoria===cat) &&
    (!q || ((c.personaje||"")+" "+(c.titulo||"")).toLowerCase().includes(q))
  );
  if (activeTab==="top") fil = fil.filter(c=>new Date(c.created_at).getTime()>weekAgo).sort((a,b)=>(b.likes||0)-(a.likes||0));
  else if (activeTab==="fav") fil = fil.filter(c=>myFavs.has(c.id));
  else { if(sort==="likes") fil=[...fil].sort((a,b)=>(b.likes||0)-(a.likes||0)); if(sort==="dano") fil=[...fil].sort((a,b)=>(b.dano||0)-(a.dano||0)); }

  document.getElementById("statTotal").textContent = allCombos.length;
  document.getElementById("statLikes").textContent = allCombos.reduce((s,c)=>s+(c.likes||0),0);

  grid.innerHTML = fil.length?"":"<p>No hay combos aquí. Cambia de pestaña o sube el primero.</p>";
  for (const c of fil){
    const el = document.createElement("div");
    el.className = "card";
    const isOwner = session && c.user_id===session.user.id;
    const faved = myFavs.has(c.id);
    const prof = profilesMap[c.user_id];
    const lvl = prof?(prof.level||1):1;
    el.innerHTML = `
      <div class="vwrap"><video src="${c.video_url}" preload="metadata" muted></video>
      <span class="badge ${gameClass(c.juego)}">${c.juego||""}</span>
      ${c.categoria?`<span class="badge-cat">${c.categoria}</span>`:""}
      ${activeTab==="top"?"<span class='rank'>🔥 TOP</span>":""}</div>
      <div class="body">
        <div class="meta"><span class="tag">${c.personaje||""}</span>
        ${c.dificultad?`<span class="tag dif-${c.dificultad}">${c.dificultad}</span>`:""}
        ${c.dano?`<span class="tag">💥 ${c.dano}</span>`:""}</div>
        <h3>${c.titulo||""}</h3>
        ${c.notacion?`<div class="notacion">${c.notacion.slice(0,80)}${c.notacion.length>80?"...":""}</div>`:""}
        <div class="cardfoot">
          <span><button class="like">❤️ ${c.likes||0}</button>
          <button class="like favbtn">${faved?"⭐":"☆"}</button></span>
          <span class="author">${usernameOf(c)} <span class="level-tag">L${lvl}</span> ${isOwner?`<button class="del">borrar</button>`:""}</span>
        </div>
        <button class="openbtn btn ghost" style="width:100%;margin-top:8px">Ver + comentar</button>
      </div>`;
    el.querySelector("video").onclick = (e)=>{ e.target.muted=false; };
    el.querySelector(".like").onclick = async (ev) => {
      ev.stopPropagation();
      if(!session){ authModal.showModal(); return; }
      if(myProfile&&myProfile.banned){ showStatus("status", "Usuario baneado.", "err"); return; }
      await supa.from("combos").update({likes:(c.likes||0)+1}).eq("id",c.id);
      await addXP(c.user_id, 5, "like");
      loadCombos();
    };
    el.querySelector(".favbtn").onclick = async (ev) => {
      ev.stopPropagation();
      if(!session){ authModal.showModal(); return; }
      if (myFavs.has(c.id)) await supa.from("favorites").delete().eq("combo_id",c.id).eq("user_id",session.user.id);
      else await supa.from("favorites").insert({combo_id:c.id,user_id:session.user.id});
      loadCombos();
    };
    const del = el.querySelector(".del");
    if (del) del.onclick = async (ev)=>{ ev.stopPropagation(); if(confirm("¿Borrar?")){ await supa.from("combos").delete().eq("id",c.id); loadCombos(); } };
    el.querySelector(".openbtn").onclick = () => openDetail(c.id);
    grid.appendChild(el);
  }
}
["filterJuego","filterDif","filterCat","sortBy"].forEach(id=>document.getElementById(id).onchange=render);
document.getElementById("search").oninput = render;

// ---------- PERFIL PÚBLICO ----------
async function loadProfilePage(userId){
  const isOwn = !userId || (session && userId===session.user.id);
  const targetId = userId || (session?session.user.id:null);
  document.getElementById("pEditZone").style.display = isOwn ? "" : "none";
  document.getElementById("btnEditBanner").classList.toggle("hidden", !isOwn);
  document.getElementById("btnFollowUser").classList.toggle("hidden", isOwn || !session);
  document.getElementById("btnFollowUser").textContent = myFollows.has(targetId) ? "Dejar de seguir" : "Seguir";

  if(!targetId){ document.getElementById("pvUsername").textContent = "@user"; document.getElementById("myGrid").innerHTML=""; document.getElementById("favGrid").innerHTML=""; return; }

  const { data: prof } = await supa.from("profiles").select("*").eq("id", targetId).single();
  if(!prof){ document.getElementById("pvUsername").textContent = "Usuario no encontrado"; return; }
  fillProfilePage(prof);

  const { data: mine } = await supa.from("combos").select("*").eq("user_id", targetId).order("created_at",{ascending:false}).limit(50);
  const mk = (c) => `<div class="card"><video src="${c.video_url}" preload="metadata" muted controls style="width:100%;height:160px"></video><div class="body"><b>${c.titulo||""}</b><br><span class="tag">${c.juego||""} • ${c.personaje||""}</span><br><button class="link" onclick="window._openDetail('${c.id}')">abrir</button></div></div>`;
  document.getElementById("myGrid").innerHTML = mine&&mine.length?mine.map(mk).join(""):"<p class='mut'>Sin combos subidos.</p>";

  if(isOwn && session){
    const favs = allCombos.filter(c=>myFavs.has(c.id));
    const fmk = (c) => `<div class="card"><video src="${c.video_url}" preload="metadata" muted controls style="width:100%;height:160px"></video><div class="body"><b>${c.titulo||""}</b><br><span class="tag">${c.juego||""} • ${c.personaje||""}</span><br><button class="link" onclick="window._openDetail('${c.id}')">abrir</button></div></div>`;
    document.getElementById("favGrid").innerHTML = favs.length?favs.map(fmk).join(""):"<p class='mut'>Sin favoritos.</p>";
  } else {
    document.getElementById("favGrid").innerHTML = "";
  }
}
document.getElementById("btnFollowUser").onclick = async () => {
  if(!session) return;
  const target = viewingUserId;
  if(!target) return;
  if (myFollows.has(target)) {
    await supa.from("follows").delete().eq("follower_id", session.user.id).eq("following_id", target);
    myFollows.delete(target);
  } else {
    await supa.from("follows").insert({follower_id: session.user.id, following_id: target});
    myFollows.add(target);
  }
  document.getElementById("btnFollowUser").textContent = myFollows.has(target) ? "Dejar de seguir" : "Seguir";
};
window._openDetail = (id) => { showView("home"); openDetail(id); };

// ---------- BUSCAR USUARIOS ----------
document.getElementById("btnGoUser").onclick = async () => {
  const q = document.getElementById("searchUser").value.trim();
  if(!q) return;
  const { data } = await supa.from("profiles").select("*").ilike("username", `%${q}%`).limit(10);
  const list = data||[];
  if(!list.length){ alert("No se encontró ese jugador."); return; }
  const p = list[0];
  showView("profile", p.id);
};
document.getElementById("searchUser").onkeypress = (e)=>{ if(e.key==="Enter") document.getElementById("btnGoUser").click(); };

// ---------- DETAIL + COMMENTS ----------
async function openDetail(id){
  currentCombo = allCombos.find(c=>c.id===id);
  if(!currentCombo) return;
  const c = currentCombo;
  document.getElementById("dTitle").textContent = `${c.titulo} — ${c.personaje}`;
  const v = document.getElementById("dVideo"); v.src = c.video_url;
  document.getElementById("dMeta").innerHTML = `<span class="tag">${c.juego}</span><span class="tag">${c.dificultad||""}</span>${c.dano?`<span class="tag">💥 ${c.dano} dmg</span>`:""} ${c.categoria?`<span class="badge-cat">${c.categoria}</span>`:""} ${c.source_url?`<a class="tag" href="${c.source_url}" target="_blank">🔗 fuente</a>`:""}`;
  document.getElementById("dNotacion").textContent = c.notacion||"";
  document.getElementById("dDesc").textContent = c.descripcion||"";
  const prof = profilesMap[c.user_id];
  document.getElementById("dAuthor").innerHTML = prof ?
    `<b>@${prof.username}</b> <span class="level-tag">L${prof.level||1}</span> <span>${prof.bio||""}</span><br>${prof.twitter?`<a href="${prof.twitter}" target="_blank">X</a> `:""}${prof.youtube?`<a href="${prof.youtube}" target="_blank">YT</a> `:""}${prof.twitch?`<a href="${prof.twitch}" target="_blank">Twitch</a>`:""}` :
    `<b>${c.author_email||"anónimo"}</b>`;
  document.getElementById("dLike").textContent = `❤️ ${c.likes||0}`;
  document.getElementById("dFav").textContent = myFavs.has(c.id) ? "⭐ Guardado" : "⭐ Guardar";
  detailModal.showModal();
  loadComments(c.id);
}
document.getElementById("dClose").onclick = () => detailModal.close();
document.getElementById("dLike").onclick = async () => {
  if(!session){ authModal.showModal(); return; }
  if(myProfile&&myProfile.banned){ showStatus("status", "Usuario baneado.", "err"); return; }
  await supa.from("combos").update({likes:(currentCombo.likes||0)+1}).eq("id",currentCombo.id);
  await addXP(currentCombo.user_id, 5, "like");
  currentCombo.likes=(currentCombo.likes||0)+1;
  document.getElementById("dLike").textContent = `❤️ ${currentCombo.likes}`;
  loadCombos();
};
document.getElementById("dFav").onclick = async () => {
  if(!session){ authModal.showModal(); return; }
  if (myFavs.has(currentCombo.id)) { await supa.from("favorites").delete().eq("combo_id",currentCombo.id).eq("user_id",session.user.id); myFavs.delete(currentCombo.id); }
  else { await supa.from("favorites").insert({combo_id:currentCombo.id,user_id:session.user.id}); myFavs.add(currentCombo.id); }
  document.getElementById("dFav").textContent = myFavs.has(currentCombo.id)?"⭐ Guardado":"⭐ Guardar";
  loadCombos();
};
document.getElementById("dReport").onclick = async () => {
  if(!session){ authModal.showModal(); return; }
  const r = prompt("¿Por qué reportas? (spam, robo, ofensivo...)");
  if(!r) return;
  await supa.from("reports").insert({combo_id:currentCombo.id,user_id:session.user.id,reason:r});
  alert("Reportado. Gracias.");
};
async function loadComments(combo_id){
  console.log("Cargando comentarios para combo:", combo_id);
  try {
    const { data, error } = await supa.from("comments").select("*").eq("combo_id", combo_id).order("created_at",{ascending:true});
    if (error) { console.error("Error loadComments:", error); const box = document.getElementById("comments"); if(box) box.innerHTML = "<p class='mut'>Error cargando comentarios.</p>"; return; }
    console.log("Comentarios recibidos:", data);
    const countEl = document.getElementById("cCount");
    if(countEl) countEl.textContent = (data||[]).length;
    const box = document.getElementById("comments");
    if(!box){ console.error("Elemento #comments no encontrado en el DOM"); return; }
    box.innerHTML = (data||[]).map(m=>`<div class="comment"><b>@${m.username||"user"}</b> ${m.text} ${session&&m.user_id===session.user.id?`<button data-del="${m.id}" class="del">x</button>`:""}</div>`).join("") || "<p class='mut'>Sé el primero en comentar.</p>";
    box.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{ await supa.from("comments").delete().eq("id",b.dataset.del); loadComments(combo_id); });
    box.scrollTop = box.scrollHeight;
  } catch(e) {
    console.error("Excepción loadComments:", e);
    const box = document.getElementById("comments");
    if(box) box.innerHTML = "<p class='mut'>Error inesperado.</p>";
  }
}
document.getElementById("cSend").onclick = async () => {
  if(!session){ authModal.showModal(); return; }
  if(myProfile&&myProfile.banned){ showStatus("status", "Usuario baneado.", "err"); return; }
  const inp = document.getElementById("cInput");
  const txt = inp.value.trim(); if(!txt) return;
  try {
    await supa.from("comments").insert({combo_id:currentCombo.id,user_id:session.user.id,username:myProfile?.username||session.user.email.split("@")[0],text:txt});
    try { await addXP(session.user.id, 10, "comentario"); } catch(e){ /* no bloquear comentario por xp */ }
    inp.value="";
    loadComments(currentCombo.id);
  } catch(err) { showStatus("status", "Error al comentar: "+err.message, "err"); }
};

// ---------- UPLOAD ----------
document.getElementById("btnNuevo").onclick = () => {
  if (!session) { authModal.showModal(); return; }
  if (!myProfile) { profileModal.showModal(); return; }
  if(myProfile.banned){ showStatus("status", "Usuario baneado.", "err"); return; }
  modal.showModal();
};
document.getElementById("btnSubir").onclick = async (e) => {
  e.preventDefault();
  const st = document.getElementById("status");
  if(!session){ authModal.showModal(); return; }
  const file = document.getElementById("fVideo").files[0];
  if(!file) return alert("Elige un video");
  if(file.size>50*1024*1024) return alert("Máximo 50MB");
  const combo = {
    juego: document.getElementById("fJuego").value,
    personaje: document.getElementById("fPersonaje").value.trim(),
    titulo: document.getElementById("fTitulo").value.trim(),
    dano: parseInt(document.getElementById("fDano").value)||null,
    dificultad: document.getElementById("fDificultad").value,
    categoria: document.getElementById("fCategoria").value,
    notacion: document.getElementById("fNotacion").value.trim(),
    descripcion: document.getElementById("fDesc").value.trim(),
    source_url: document.getElementById("fSource").value.trim()||null,
    likes:0, user_id:session.user.id, author_email:session.user.email
  };
  if(!combo.personaje||!combo.titulo) return alert("Completa campos *");
  showStatus("status", "Subiendo...", "ok");
  try{
    const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,4)||'mp4';
    const name=session.user.id+"/"+Date.now()+"_"+Math.random().toString(36).slice(2,8)+"."+ext;
    const {error:upErr}=await supa.storage.from(BUCKET).upload(name,file);
    if(upErr) throw upErr;
    const {data}=supa.storage.from(BUCKET).getPublicUrl(name);
    combo.video_url=data.publicUrl;
    const {error:dbErr}=await supa.from("combos").insert(combo);
    if(dbErr) throw dbErr;
    await addXP(session.user.id, 50, "subir combo");
    modal.close(); document.getElementById("formCombo").reset(); document.getElementById("status").style.display="none";
    loadCombos();
  }catch(err){ showStatus("status", "Error: "+err.message, "err"); }
};

// ---------- PERSONALIZAR PERFIL ----------
async function uploadImage(file, folder){
  const ext=(file.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,4)||'png';
  const name=`${session.user.id}/${folder}_${Date.now()}.${ext}`;
  const {error}=await supa.storage.from(BUCKET).upload(name,file,{upsert:true});
  if(error) throw error;
  return supa.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}
document.getElementById("btnSaveProfilePage").onclick = async () => {
  const st=document.getElementById("profilePageStatus");
  try{
    let avatar_url=document.getElementById("eAvatarUrl").value.trim()||myProfile?.avatar_url||null;
    let banner_url=document.getElementById("eBannerUrl").value.trim()||myProfile?.banner_url||null;
    const af=document.getElementById("eAvatarFile").files[0];
    const bf=document.getElementById("eBannerFile").files[0];
    if(af) avatar_url=await uploadImage(af,"avatar");
    if(bf) banner_url=await uploadImage(bf,"banner");
    let username=document.getElementById("eUsername").value.trim().replace(/\s+/g,"_");
    if(username.length<3){ showStatus("profilePageStatus", "Username mínimo 3.", "err"); return; }
    const payload={id:session.user.id,username,bio:document.getElementById("eBio").value.trim(),twitter:document.getElementById("eTwitter").value.trim(),youtube:document.getElementById("eYoutube").value.trim(),twitch:document.getElementById("eTwitch").value.trim(),avatar_url,banner_url,banner_color:document.getElementById("eBannerColor").value};
    const {error}=await supa.from("profiles").upsert(payload);
    if(error) throw error;
    myProfile=payload; fillProfilePage(payload); refreshAuth(); showStatus("profilePageStatus", "Perfil y fondo guardados ✓", "ok");
  }catch(err){ showStatus("profilePageStatus", "Error: "+err.message, "err"); }
};

// ---------- MODERACIÓN ----------
async function openModeration(){
  if(!isAdmin()){ alert("Solo admins"); return; }
  modModal.showModal();
  await loadModData();
}
async function loadModData(){
  const { data: reports } = await supa.from("reports").select("*, combos(titulo, juego, personaje)").order("created_at",{ascending:false}).limit(50);
  const box = document.getElementById("modReports");
  box.innerHTML = (reports||[]).map(r=>{
    const c = r.combos||{};
    return `<div class="mod-card"><div><h4>${c.titulo||"Combo"}</h4><p>${c.juego||""} • ${c.personaje||""}</p><p><b>Motivo:</b> ${r.reason}</p><p><b>Por:</b> ${r.user_id}</p></div><div class="mod-actions"><button class="btn-danger" onclick="deleteCombo('${c.id??""}')">Borrar combo</button></div></div>`;
  }).join("")||"<p class='mut'>Sin reportes.</p>";

  const { data: profs } = await supa.from("profiles").select("*").order("username",{ascending:true});
  const ubox = document.getElementById("modUsers");
  ubox.innerHTML = (profs||[]).map(p=>{
    const banned = p.banned;
    return `<div class="mod-card"><div><h4>@${p.username||"user"}</h4><p>${p.email||""}</p><p>Nivel ${p.level||1} • ${p.xp||0} XP ${banned?'<span style="color:#ff4d4d">🚫 BANEADO</span>':''}</p></div><div class="mod-actions"><button class="${banned?'btn-success':'btn-danger'}" onclick="toggleBan('${p.id}', ${banned})">${banned?"Desbanear":"Banear"}</button></div></div>`;
  }).join("")||"<p class='mut'>Sin usuarios.</p>";
}
window.deleteCombo = async (id)=>{
  if(!confirm("¿Borrar este combo?")) return;
  await supa.from("combos").delete().eq("id", id);
  loadModData(); loadCombos();
};
window.toggleBan = async (id, currentlyBanned)=>{
  await supa.from("profiles").update({ banned: !currentlyBanned }).eq("id", id);
  loadModData();
};

refreshAuth();
