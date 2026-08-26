const fighters = ["Mario","Donkey Kong","Link","Samus","Dark Samus","Yoshi","Kirby","Fox","Pikachu","Luigi","Ness","Captain Falcon","Jigglypuff","Peach","Daisy","Bowser","Ice Climbers","Sheik","Zelda","Dr. Mario","Pichu","Falco","Marth","Lucina","Young Link","Ganondorf","Mewtwo","Roy","Chrom","Mr. Game and Watch","Meta Knight","Pit","Dark Pit","Zero Suit Samus","Wario","Snake","Ike","Pokemon Trainer","Diddy Kong","Lucas","Sonic","King Dedede","Olimar","Lucario","R.O.B.","Toon Link","Wolf","Villager","Mega Man","Wii Fit Trainer","Rosalina & Luma","Little Mac","Greninja","Palutena","Pac-Man","Robin","Shulk","Bowser Jr.","Duck Hunt","Ryu","Ken","Cloud","Corrin","Bayonetta","Inkling","Ridley","Simon","Richter","King K. Rool","Isabelle","Incineroar","Piranha Plant","Joker","Hero","Banjo & Kazooie","Terry","Byleth","Min Min","Steve","Sephiroth","Pyra/Mythra","Kazuya","Sora","Mii Brawler","Mii Swordfighter","Mii Gunner"];
const KEY = "smash-ultimate-notebook-v1";
let data = JSON.parse(localStorage.getItem(KEY) || '{"main":"","matches":[]}');
let selectedResult = "win";
const $ = (id) => document.getElementById(id);

function fillSelect(select, includeMain = true) {
  const alphabeticalFighters = fighters.filter(f => includeMain || f !== data.main).sort((a, b) => a.localeCompare(b));
  select.innerHTML = '<option value="">Choose a fighter</option>' + alphabeticalFighters.map(f => `<option value="${f}">${f}</option>`).join("");
}
function save() { localStorage.setItem(KEY, JSON.stringify(data)); }
function tierFor(matches) {
  if (!matches.length) return 0;
  const wins = matches.filter(m => m.result === "win").length;
  const rate = wins / matches.length;
  if (matches.length < 3) return rate >= .67 ? 1 : rate <= .33 ? -1 : 0;
  if (rate >= .75) return 2;
  if (rate >= .58) return 1;
  if (rate <= .25) return -2;
  if (rate <= .42) return -1;
  return 0;
}
function matchupData() { return fighters.filter(f => f !== data.main).map(name => { const matches = data.matches.filter(m => m.opponent === name); const wins = matches.filter(m => m.result === "win").length; return {name,matches,wins,tier:tierFor(matches)}; }); }
function renderChart() {
  const groups = {"-2":[], "-1":[], "0":[], "1":[], "2":[]};
  matchupData().forEach(item => groups[item.tier].push(item));
  $("matchupChart").innerHTML = [-2,-1,0,1,2].map(tier => `<div class="tier-column" data-tier="${tier}">${groups[tier].sort((a,b) => b.matches.length-a.matches.length || a.name.localeCompare(b.name)).map(f => `<button class="fighter-chip" title="${f.name}: ${f.wins}-${f.matches.length-f.wins}">${f.name}${f.matches.length ? `<span class="chip-record">${f.wins}–${f.matches.length-f.wins}</span>` : ""}</button>`).join("")}</div>`).join("");
}
function renderStats() {
  const games = data.matches.length, wins = data.matches.filter(m => m.result === "win").length;
  $("totalGames").textContent = games;
  $("winRate").textContent = games ? Math.round(wins / games * 100) + "%" : "—";
  $("recordText").textContent = games ? `${wins} wins · ${games-wins} losses` : "No games yet";
  const played = matchupData().filter(x => x.matches.length).sort((a,b) => (b.wins/b.matches.length)-(a.wins/a.matches.length));
  $("bestMatchup").textContent = played.length ? played[0].name : "—";
  $("bestMatchupDetail").textContent = played.length ? `${played[0].wins}–${played[0].matches.length-played[0].wins} record` : "Play some games";
}
function renderHistory() {
  const list = $("historyList");
  if (!data.matches.length) { list.innerHTML = '<div class="empty-state">Your logged matches will show up here.</div>'; return; }
  list.innerHTML = data.matches.slice().reverse().slice(0,15).map(m => `<div class="history-item"><span class="history-result ${m.result}">${m.result === "win" ? "WIN" : "LOSS"}</span><div><div class="history-main">${data.main} <span>vs.</span> ${m.opponent}</div>${m.notes ? `<div class="history-note">${escapeHtml(m.notes)}</div>` : ""}</div><div><span class="history-date">${new Date(m.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span><button class="delete-match" data-id="${m.id}" title="Delete match">×</button></div></div>`).join("");
}
function escapeHtml(s) { const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
function render() { $("setupCard").classList.toggle("hidden", !!data.main); $("dashboard").classList.toggle("hidden", !data.main); if (!data.main) return; $("mainName").textContent=data.main; fillSelect($("opponentCharacter"), false); renderStats(); renderChart(); renderHistory(); }
function toast(message) { const t=$("toast"); t.textContent=message; t.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove("show"),2400); }

fillSelect($("playerCharacter"));
$("playerCharacter").addEventListener("change", e => $("startButton").disabled = !e.target.value);
$("startButton").addEventListener("click", () => { data.main=$("playerCharacter").value; data.matches=[]; save(); render(); toast(`${data.main} notebook started!`); });
document.querySelectorAll(".result-option").forEach(btn => btn.addEventListener("click", () => { selectedResult=btn.dataset.result; document.querySelectorAll(".result-option").forEach(b=>b.classList.toggle("active",b===btn)); }));
$("matchForm").addEventListener("submit", e => { e.preventDefault(); const opponent=$("opponentCharacter").value; if(!opponent) return; data.matches.push({id:Date.now(),opponent,result:selectedResult,notes:$("matchNotes").value.trim(),date:new Date().toISOString()}); save(); e.target.reset(); selectedResult="win"; document.querySelectorAll(".result-option").forEach(b=>b.classList.toggle("active",b.dataset.result==="win")); render(); toast("Match logged."); });
$("historyList").addEventListener("click", e => { const id=e.target.dataset.id; if(!id) return; data.matches=data.matches.filter(m=>m.id!==Number(id)); save(); render(); toast("Match removed."); });
$("changeMainButton").addEventListener("click", () => { if(confirm("Changing your main will start a fresh notebook. Continue?\n\nRemember to click 'Upload Notebook' to save this notebook!")){ data={main:"",matches:[]}; save(); fillSelect($("playerCharacter")); render(); } });
$("clearButton").addEventListener("click", () => { if(confirm("Delete every logged match? This cannot be undone.")){ data.matches=[]; save(); render(); toast("Match history cleared."); } });
$("exportButton").addEventListener("click", () => { const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}), url=URL.createObjectURL(blob), a=document.createElement("a"); const mainFilename = (data.main || "Smash_Ultimate").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, ""); a.href=url; a.download=`${mainFilename}_Notebook.json`; a.click(); URL.revokeObjectURL(url); toast("Notebook backup downloaded."); });
$("importInput").addEventListener("change", e => { const file=e.target.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{try{const incoming=JSON.parse(reader.result);if(!incoming.main||!Array.isArray(incoming.matches))throw Error();data=incoming;save();fillSelect($("playerCharacter"));render();toast("Notebook imported.");}catch{toast("That file isn't a valid notebook backup.");}};reader.readAsText(file); e.target.value=""; });
window.addEventListener("beforeunload", event => {
  if (!data.main) return;
  event.preventDefault();
  event.returnValue = "";
});
render();
