(() => {
  const css = document.createElement("style");
  css.textContent = `
    #b10Loader {
      position:fixed;inset:0;background:#080e19;z-index:9999;
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;transition:opacity .5s;
    }
    #b10Loader h1 {color:#26e0a1;font-size:36px;animation:pulse 1s infinite}
    .loaderRing {
      width:48px;height:48px;border:4px solid #263b56;
      border-top-color:#26e0a1;border-radius:50%;
      animation:spin .8s linear infinite;
    }
    @keyframes spin {to{transform:rotate(360deg)}}
    @keyframes pulse {50%{opacity:.5;transform:scale(1.05)}}
    .game-card,.panel {animation:appear .35s ease}
    @keyframes appear {
      from{opacity:0;transform:translateY(12px)}
      to{opacity:1;transform:translateY(0)}
    }
    #soundToggle {
      position:fixed;right:14px;bottom:78px;z-index:20;
      background:#203149;color:white;border:1px solid #40536d;
      border-radius:30px;padding:11px 15px;font-size:17px;
    }
    .b10-confetti {
      position:fixed;top:-15px;width:9px;height:13px;
      z-index:9998;pointer-events:none;
      animation:fall 2.5s linear forwards;
    }
    @keyframes fall {
      to{transform:translateY(110vh) rotate(720deg);opacity:0}
    }
    .win-glow {animation:glow .7s ease 2}
    @keyframes glow {
      50%{box-shadow:0 0 28px #26e0a1}
    }
  `;
  document.head.appendChild(css);

  const loader = document.createElement("div");
  loader.id = "b10Loader";
  loader.innerHTML = '<h1>B10 GAME</h1><div class="loaderRing"></div><p>Loading your games...</p>';
  document.body.appendChild(loader);

  const soundButton = document.createElement("button");
  soundButton.id = "soundToggle";
  soundButton.textContent = "🔊 SOUND ON";
  document.body.appendChild(soundButton);

  let soundOn = true;
  let audio = null;

  function beep(freq = 500, duration = .09, type = "sine") {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(.07, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch (e) {}
  }

  soundButton.onclick = () => {
    soundOn = !soundOn;
    soundButton.textContent = soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF";
    if (soundOn) beep(650);
  };

  document.addEventListener("click", event => {
    if (event.target.closest("button")) beep(420, .055);
  });

  function confetti() {
    for (let i = 0; i < 45; i++) {
      const piece = document.createElement("i");
      piece.className = "b10-confetti";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = ["#26e0a1","#ffd45c","#4b9cff","#ff6685"][i % 4];
      piece.style.animationDelay = Math.random() * .7 + "s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3500);
    }
    beep(700, .15);
    setTimeout(() => beep(900, .2), 150);
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 550);
    }, 700);
  });

  const content = document.getElementById("gameContent");
  if (content) {
    let lastWin = "";
    const observer = new MutationObserver(() => {
      const text = content.innerText || "";
      if (/YOU WIN|CASHED OUT|WIN \+/i.test(text)) {
        if (text !== lastWin) {
          lastWin = text;
          confetti();
          const panel = document.getElementById("panel");
          if (panel) {
            panel.classList.add("win-glow");
            setTimeout(() => panel.classList.remove("win-glow"), 1500);
          }
        }
      } else {
        lastWin = "";
      }
    });
    observer.observe(content, {childList:true,subtree:true,characterData:true});
  }
})();
