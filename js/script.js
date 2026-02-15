let game = {
    score: 0,
    clickPower: 1,
    autoPower: 0,
    critChance: 0.1,
    critMulti: 5,
    rebirths: 0,
    megaRebirths: 0,
    level: 1,
    xp: 0,
    multiplier: 1,
    sound: false,
    totalClicks: 0,
    lastDaily: 0
};

// ELEMENTY
const scoreEl = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");

const upgradeClick = document.getElementById("upgradeClick");
const upgradeAuto = document.getElementById("upgradeAuto");
const boost2x = document.getElementById("boost2x");
const boost5x = document.getElementById("boost5x");
const critUpgrade = document.getElementById("critUpgrade");
const critMultiUpgrade = document.getElementById("critMultiUpgrade");
const rebirthBtn = document.getElementById("rebirthBtn");
const megaRebirthBtn = document.getElementById("megaRebirthBtn");
const dailyRewardBtn = document.getElementById("dailyReward");
const soundToggle = document.getElementById("soundToggle");
const statsEl = document.getElementById("stats");

// LOAD
function load() {
    const save = JSON.parse(localStorage.getItem("superClicker"));
    if(save) game = {...game, ...save};
}
function save() {
    localStorage.setItem("superClicker", JSON.stringify(game));
}
load();

// MENU
menuBtn.onclick = () => menuPanel.classList.toggle("hidden");
menuPanel.onclick = (e) => {
    if(e.target === menuPanel) menuPanel.classList.add("hidden");
};

// CLICK
clickBtn.onclick = () => {

    game.totalClicks++;

    let gained = game.clickPower * game.multiplier;

    if(Math.random() < game.critChance) {
        gained *= game.critMulti;
    }

    game.score += gained;
    game.xp += gained;

    levelCheck();
    randomEvent();
    updateUI();
};

// AUTO
setInterval(() => {
    game.score += game.autoPower * game.multiplier;
    updateUI();
}, 1000);

// LEVEL
function levelCheck() {
    if(game.xp >= 500) {
        game.xp = 0;
        game.level++;
        game.multiplier += 0.1;
        alert("LEVEL UP!");
    }
}

// RANDOM EVENT
function randomEvent() {
    if(Math.random() < 0.02) {
        game.score += 100;
        alert("🍀 Lucky bonus +100!");
    }
}

// SHOP
upgradeClick.onclick = () => buy(() => game.clickPower++, game.clickPower*50);
upgradeAuto.onclick = () => buy(() => game.autoPower++, game.autoPower*100+100);
critUpgrade.onclick = () => buy(() => game.critChance+=0.02, 500);
critMultiUpgrade.onclick = () => buy(() => game.critMulti+=1, 800);

boost2x.onclick = () => buy(() => tempBoost(2, 15000), 2000);
boost5x.onclick = () => buy(() => tempBoost(5, 10000), 5000);

rebirthBtn.onclick = () => {
    if(game.score >= 100000){
        game.rebirths++;
        game.multiplier += 0.5;
        resetBase();
    }
};

megaRebirthBtn.onclick = () => {
    if(game.score >= 1000000){
        game.megaRebirths++;
        game.multiplier += 2;
        resetBase();
    }
};

function resetBase(){
    game.score = 0;
    game.clickPower = 1;
    game.autoPower = 0;
}

// TEMP BOOST
function tempBoost(value, duration){
    game.multiplier *= value;
    setTimeout(()=>{
        game.multiplier /= value;
    }, duration);
}

// DAILY
dailyRewardBtn.onclick = () => {
    if(Date.now() - game.lastDaily > 86400000){
        game.score += 1000;
        game.lastDaily = Date.now();
        alert("🎁 Daily +1000!");
    }
};

// SOUND
soundToggle.onclick = () => {
    game.sound = !game.sound;
    soundToggle.innerText = "Sound: " + (game.sound ? "ON" : "OFF");
};

// BUY FUNCTION
function buy(action, cost){
    if(game.score >= cost){
        game.score -= cost;
        action();
        updateUI();
    }
}

// UI
function updateUI(){
    scoreEl.innerText = Math.floor(game.score);

    upgradeClick.innerText = "+1 Click ("+Math.floor(game.clickPower*50)+")";
    upgradeAuto.innerText = "+1 Auto ("+Math.floor(game.autoPower*100+100)+")";
    boost2x.innerText = "Boost x2 (2000)";
    boost5x.innerText = "Boost x5 (5000)";
    critUpgrade.innerText = "Crit Chance +2% (500)";
    critMultiUpgrade.innerText = "Crit Multi +1 (800)";
    rebirthBtn.innerText = "Rebirth (100k)";
    megaRebirthBtn.innerText = "Mega Rebirth (1M)";

    statsEl.innerHTML = `
    Level: ${game.level} <br>
    Rebirths: ${game.rebirths} <br>
    Mega: ${game.megaRebirths} <br>
    Multiplier: x${game.multiplier.toFixed(2)} <br>
    Clicks: ${game.totalClicks}
    `;

    save();
}

updateUI();