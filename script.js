let game = {
    nickname: "",
    score: 0,
    highScore: 0,
    clickPower: 1,
    autoPower: 0,
    level: 1,
    xp: 0,
    xpNeeded: 200,
    multiplier: 1,
    rebirths: 0
};

// ELEMENTY
const scoreEl = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const upgradeClick = document.getElementById("upgradeClick");
const upgradeAuto = document.getElementById("upgradeAuto");
const boostBtn = document.getElementById("boostBtn");
const rebirthBtn = document.getElementById("rebirthBtn");
const xpFill = document.getElementById("xpFill");

const nicknameInput = document.getElementById("nicknameInput");
const saveNickBtn = document.getElementById("saveNickBtn");
const currentNick = document.getElementById("currentNick");
const leaderboardEl = document.getElementById("leaderboard");

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

// LOAD
function load(){
    const save = JSON.parse(localStorage.getItem("ultraClicker"));
    if(save) game = {...game, ...save};
}
function save(){
    localStorage.setItem("ultraClicker", JSON.stringify(game));
}
load();

// MENU
menuBtn.onclick = () => menu.classList.toggle("hidden");
menu.onclick = e => { if(e.target === menu) menu.classList.add("hidden"); };

// KLIK
clickBtn.onclick = () => {

    let gained = game.clickPower * game.multiplier;

    // CRIT 10%
    if(Math.random() < 0.1){
        gained *= 3;
    }

    game.score += gained;
    game.xp += gained;

    levelCheck();
    updateUI();
};

// AUTO
setInterval(()=>{
    game.score += game.autoPower * game.multiplier;
    updateUI();
},1000);

// LEVEL
function levelCheck(){
    if(game.xp >= game.xpNeeded){
        game.xp = 0;
        game.level++;
        game.multiplier += 0.2;
        game.xpNeeded *= 1.3;
        alert("LEVEL UP! 🔥");
    }
}

// SKLEP
upgradeClick.onclick = () => buy(()=>game.clickPower++, game.clickPower*50);
upgradeAuto.onclick = () => buy(()=>game.autoPower++, game.autoPower*100+100);

boostBtn.onclick = () => {
    if(game.score >= 2000){
        game.score -= 2000;
        game.multiplier *= 2;
        setTimeout(()=> game.multiplier /=2, 15000);
    }
};

rebirthBtn.onclick = () => {
    if(game.score >= 100000){
        game.rebirths++;
        game.multiplier += 0.5;
        game.score = 0;
        game.clickPower = 1;
        game.autoPower = 0;
    }
};

function buy(action, cost){
    if(game.score >= cost){
        game.score -= cost;
        action();
    }
}

// NICK
saveNickBtn.onclick = ()=>{
    game.nickname = nicknameInput.value;
    updateUI();
};

// RANKING
function updateLeaderboard(){

    let board = JSON.parse(localStorage.getItem("leaderboard")) || [];

    if(game.score > game.highScore){
        game.highScore = Math.floor(game.score);

        if(game.nickname){
            board = board.filter(p=>p.nick!==game.nickname);
            board.push({nick:game.nickname, score:game.highScore});
            board.sort((a,b)=>b.score-a.score);
            board = board.slice(0,5);
            localStorage.setItem("leaderboard", JSON.stringify(board));
        }
    }

    leaderboardEl.innerHTML="";
    board.forEach((p,i)=>{
        const li=document.createElement("li");
        li.innerText=p.nick+" - "+p.score;
        if(i===0) li.style.color="gold";
        leaderboardEl.appendChild(li);
    });
}

// UI
function updateUI(){
    scoreEl.innerText = Math.floor(game.score);
    currentNick.innerText = "Nick: "+(game.nickname||"Brak");

    upgradeClick.innerText = "+1 Click ("+Math.floor(game.clickPower*50)+")";
    upgradeAuto.innerText = "+1 Auto ("+Math.floor(game.autoPower*100+100)+")";
    boostBtn.innerText = "Boost x2 (2000)";
    rebirthBtn.innerText = "Rebirth (100k)";

    xpFill.style.width = (game.xp/game.xpNeeded*100)+"%";

    updateLeaderboard();
    save();
}

updateUI();