/**
 * 90Minutes — Single-page web app (vanilla JS)
 * Connects to: HTTP API (rooms/leaderboard/demo) + WebSocket API (live events).
 */
(function () {
  'use strict';

  const cfg = window.APP_CONFIG;
  const $app = document.getElementById('app');

  // ─────────── State ───────────
  const state = {
    screen: 'splash',
    user: { id: null, name: null, points: 0 },
    room: { id: null, code: null },
    match: {
      id: cfg.DEFAULT_MATCH,
      score: '0:0',
      minute: 0,
      status: 'PRE',
      home: 'FC Team',
      away: 'Club',
    },
    events: [],
    leaderboard: [],
    ws: null,
    wsConnected: false,
    lastReactionAt: 0,
  };

  // ─────────── Utilities ───────────
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'onclick') node.addEventListener('click', v);
      else if (k === 'oninput') node.addEventListener('input', v);
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null || c === false) return;
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  };

  const toast = (msg, type = '') => {
    let bar = document.querySelector('.toast-container');
    if (!bar) {
      bar = el('div', { class: 'toast-container' });
      $app.appendChild(bar);
    }
    const t = el('div', { class: `toast ${type}` }, msg);
    bar.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  };

  const api = async (path, options = {}) => {
    const url = `${cfg.HTTP_API_URL}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = data.error || `HTTP_${res.status}`;
      throw new Error(code);
    }
    return data;
  };

  const saveLocal = () => {
    try {
      localStorage.setItem('90m_user', JSON.stringify(state.user));
      localStorage.setItem('90m_room', JSON.stringify(state.room));
    } catch (e) { /* ignore */ }
  };

  const loadLocal = () => {
    try {
      const u = JSON.parse(localStorage.getItem('90m_user') || 'null');
      const r = JSON.parse(localStorage.getItem('90m_room') || 'null');
      if (u && u.id) state.user = u;
      if (r && r.id) state.room = r;
    } catch (e) { /* ignore */ }
  };

  // ─────────── WebSocket ───────────
  const connectWS = () => {
    if (!state.user.id || !state.room.id) return;
    if (state.ws && state.wsConnected) return;

    const qs = new URLSearchParams({
      roomId: state.room.id,
      userId: state.user.id,
      username: state.user.name,
      matchId: state.match.id,
    }).toString();

    const url = `${cfg.WS_URL}?${qs}`;
    console.log('[ws] Connecting', url);
    const ws = new WebSocket(url);
    state.ws = ws;

    ws.onopen = () => {
      state.wsConnected = true;
      console.log('[ws] Connected');
      updateStatusBanner();
    };

    ws.onclose = () => {
      state.wsConnected = false;
      console.log('[ws] Disconnected');
      updateStatusBanner();
      // Auto-reconnect after 3s if still in match screen
      setTimeout(() => {
        if (state.screen === 'match' && !state.wsConnected) connectWS();
      }, 3000);
    };

    ws.onerror = (e) => console.warn('[ws] Error', e);

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        handleWSMessage(data);
      } catch (e) {
        console.warn('[ws] Bad message', msg.data);
      }
    };
  };

  const sendWS = (action, payload) => {
    if (!state.ws || state.ws.readyState !== 1) {
      toast('Connexion en cours…', 'error');
      return false;
    }
    state.ws.send(JSON.stringify({ action, ...payload }));
    return true;
  };

  const handleWSMessage = (msg) => {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'MATCH_START':
        state.match.status = 'LIVE';
        if (msg.matchInfo) {
          state.match.home = msg.matchInfo.homeTeam || state.match.home;
          state.match.away = msg.matchInfo.guestTeam || state.match.away;
        }
        addEvent({ emoji: '⚽', minute: 0, title: 'Coup d\'envoi !', narration: 'Le match commence' });
        break;
      case 'GOAL':
        state.match.score = msg.score || state.match.score;
        state.match.minute = msg.matchMinute || state.match.minute;
        addEvent({
          emoji: '⚽',
          minute: msg.matchMinute,
          title: `BUT — ${msg.message || ''}`,
          narration: msg.narration || `Score: ${state.match.score}`,
          cls: 'goal',
        });
        toast(`⚽ BUT ! ${state.match.score}`, 'goal');
        break;
      case 'YELLOW_CARD':
        addEvent({
          emoji: '🟡',
          minute: msg.matchMinute,
          title: `Carton jaune — ${msg.message || ''}`,
          narration: msg.narration,
          cls: 'yellow-card',
        });
        break;
      case 'RED_CARD':
        addEvent({
          emoji: '🔴',
          minute: msg.matchMinute,
          title: `Carton rouge — ${msg.message || ''}`,
          narration: msg.narration,
          cls: 'red-card',
        });
        toast(`🔴 Rouge ! ${msg.message || ''}`, 'error');
        break;
      case 'SUBSTITUTION':
        addEvent({
          emoji: '🔄',
          minute: msg.matchMinute,
          title: `Changement — ${msg.message || ''}`,
          narration: msg.narration,
        });
        break;
      case 'HALFTIME':
        state.match.status = 'HT';
        addEvent({ emoji: '⏱️', minute: 45, title: 'Mi-temps', narration: msg.narration || 'Pause' });
        break;
      case 'FULLTIME':
        state.match.status = 'FT';
        addEvent({ emoji: '🏁', minute: 90, title: 'Fin du match', narration: msg.narration || `Score final: ${msg.finalScore || state.match.score}` });
        toast('🏁 Fin du match', 'goal');
        // Auto-refresh leaderboard
        setTimeout(refreshLeaderboard, 1500);
        break;
      case 'REACTION':
        // Visual feedback only; not added as event
        break;
      case 'PREDICTION_RECEIVED':
        toast(`📊 ${msg.fanName} a parié`);
        break;
      default:
        console.log('[ws] Unknown event', msg);
    }
    if (state.screen === 'match') renderMatch();
  };

  const addEvent = (ev) => {
    state.events.unshift(ev);
    if (state.events.length > 30) state.events.length = 30;
  };

  // ─────────── Screens ───────────
  const showScreen = (name) => {
    state.screen = name;
    $app.innerHTML = '';
    if (name === 'splash') renderSplash();
    else if (name === 'onboarding') renderOnboarding();
    else if (name === 'login') renderLogin();
    else if (name === 'home') renderHome();
    else if (name === 'room') renderRoom();
    else if (name === 'match') renderMatch();
    else if (name === 'leaderboard') renderLeaderboard();
  };

  const renderSplash = () => {
    const screen = el('div', { class: 'screen active' }, [
      el('div', { class: 'splash-content' }, [
        el('div', { class: 'splash-logo' }, '⚽'),
        el('div', { class: 'splash-title' }, '90Minutes'),
        el('div', { class: 'splash-tagline' }, 'Le foot, mieux ensemble'),
        el('div', { class: 'splash-spinner' }),
      ]),
    ]);
    $app.appendChild(screen);
    setTimeout(() => {
      if (state.user.id) showScreen('home');
      else showScreen('onboarding');
    }, 1200);
  };

  const renderOnboarding = () => {
    const slides = [
      { emoji: '⚽', title: 'Vis chaque match en direct', desc: 'Buts, cartons, IA narrateur. Tout en temps réel.' },
      { emoji: '👥', title: 'Avec ta squad', desc: 'Crée une room, partage le code, jouez ensemble.' },
      { emoji: '🏆', title: 'Gagne des points', desc: 'Pronos, réactions, classement live.' },
    ];
    let i = 0;
    const slideEl = el('div', { class: 'onboarding-content' }, []);
    const dotsEl = el('div', { class: 'dots' });
    const nextBtn = el('button', { class: 'cta-primary' }, 'Continuer');

    const draw = () => {
      slideEl.innerHTML = '';
      slideEl.appendChild(el('div', { class: 'onboarding-emoji' }, slides[i].emoji));
      slideEl.appendChild(el('div', { class: 'onboarding-title' }, slides[i].title));
      slideEl.appendChild(el('div', { class: 'onboarding-desc' }, slides[i].desc));
      dotsEl.innerHTML = '';
      slides.forEach((_, k) => dotsEl.appendChild(el('div', { class: 'dot' + (k === i ? ' active' : '') })));
      nextBtn.textContent = i === slides.length - 1 ? 'Démarrer' : 'Continuer';
    };

    nextBtn.addEventListener('click', () => {
      if (i < slides.length - 1) { i++; draw(); }
      else showScreen('login');
    });

    const skip = el('button', { class: 'skip-btn', onclick: () => showScreen('login') }, 'Passer');

    const screen = el('div', { class: 'screen active' }, [
      skip,
      slideEl,
      dotsEl,
      el('div', { style: 'padding:0 24px 24px' }, [nextBtn]),
    ]);
    $app.appendChild(screen);
    draw();
  };

  const renderLogin = () => {
    const nameInput = el('input', { type: 'text', placeholder: 'Ton pseudo', maxlength: '20' });
    const cta = el('button', { class: 'cta-primary' }, 'Entrer');
    cta.addEventListener('click', () => {
      const name = nameInput.value.trim() || 'Fan';
      state.user = {
        id: 'user_' + Math.random().toString(36).slice(2, 10),
        name,
        points: 0,
      };
      saveLocal();
      showScreen('home');
    });
    nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') cta.click(); });

    const screen = el('div', { class: 'screen active' }, [
      el('div', { class: 'login-content' }, [
        el('div', { class: 'login-logo' }, '⚽'),
        el('div', { class: 'login-app-name' }, '90Minutes'),
        el('div', { class: 'login-tagline' }, 'Le foot, mieux ensemble'),
        el('div', { class: 'login-title' }, 'Choisis ton pseudo'),
        el('div', { class: 'login-form' }, [nameInput]),
        cta,
        el('button', { class: 'cta-ghost', onclick: () => { state.user = { id: 'jury_' + Date.now(), name: 'JuryFan' }; saveLocal(); showScreen('home'); } }, 'Mode démo (jury)'),
      ]),
    ]);
    $app.appendChild(screen);
    setTimeout(() => nameInput.focus(), 100);
  };

  const renderHome = () => {
    const screen = el('div', { class: 'screen active' }, [
      el('div', { class: 'home-header' }, [
        el('div', { class: 'user-info' }, [
          el('div', { class: 'avatar' }, state.user.name.charAt(0).toUpperCase()),
          el('div', {}, [
            el('div', { class: 'username' }, state.user.name),
            el('div', { style: 'color:var(--text-tertiary);font-size:11px' }, 'Bienvenue'),
          ]),
        ]),
        el('div', { class: 'points-badge' }, `${state.user.points} PTS`),
      ]),
      el('div', { class: 'home-main' }, [
        el('div', { class: 'section-label label live-label' }, '● MATCH DEMO'),
        el('div', { class: 'match-card', onclick: () => showScreen('room') }, [
          el('div', { class: 'match-card-top' }, [
            el('div', { class: 'live-indicator' }, [el('span', { class: 'live-dot' }), 'PRÊT']),
            el('div', { class: 'fans-count' }, 'FC Team vs Club'),
          ]),
          el('div', { class: 'match-card-teams' }, [
            el('div', { class: 'team-name' }, 'FC Team'),
            el('div', { class: 'match-score' }, 'VS'),
            el('div', { class: 'team-name' }, 'Club'),
          ]),
          el('div', { class: 'match-card-accent' }),
        ]),
        el('div', { class: 'section-label label' }, 'COMMENT ÇA MARCHE'),
        el('div', { class: 'upcoming-card' }, [
          el('div', { class: 'upcoming-teams' }, '1. Crée ou rejoins une room'),
          el('div', { class: 'upcoming-time' }, 'Code à 6 chiffres pour ta squad'),
        ]),
        el('div', { class: 'upcoming-card' }, [
          el('div', { class: 'upcoming-teams' }, '2. Lance la démo live'),
          el('div', { class: 'upcoming-time' }, 'Le match Bundesliga démarre'),
        ]),
        el('div', { class: 'upcoming-card' }, [
          el('div', { class: 'upcoming-teams' }, '3. Pronostique, réagis, gagne'),
          el('div', { class: 'upcoming-time' }, 'Top du leaderboard à la fin'),
        ]),
      ]),
      bottomNav('home'),
    ]);
    $app.appendChild(screen);
  };

  const renderRoom = () => {
    const codeInput = el('input', { class: 'join-input', type: 'text', maxlength: '6', placeholder: '------' });
    codeInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });

    const createBtn = el('button', { class: 'cta-primary' }, '🆕 Créer une room');
    createBtn.addEventListener('click', async () => {
      createBtn.disabled = true;
      createBtn.textContent = 'Création…';
      try {
        const r = await api('/rooms', {
          method: 'POST',
          body: JSON.stringify({ ownerUserId: state.user.id, ownerFanName: state.user.name }),
        });
        state.room = { id: r.roomId, code: r.joinCode };
        saveLocal();
        toast(`Room créée: ${r.joinCode}`, 'goal');
        connectWS();
        setTimeout(() => showScreen('match'), 600);
      } catch (e) {
        toast(`Erreur: ${e.message}`, 'error');
        createBtn.disabled = false;
        createBtn.textContent = '🆕 Créer une room';
      }
    });

    const joinBtn = el('button', { class: 'cta-secondary' }, 'Rejoindre');
    joinBtn.addEventListener('click', async () => {
      const code = codeInput.value.trim();
      if (!/^\d{6}$/.test(code)) {
        toast('Code invalide (6 chiffres)', 'error');
        return;
      }
      joinBtn.disabled = true;
      try {
        const r = await api('/rooms/join', {
          method: 'POST',
          body: JSON.stringify({ joinCode: code, userId: state.user.id, fanName: state.user.name }),
        });
        state.room = { id: r.roomId, code: r.joinCode };
        saveLocal();
        toast(`Room rejointe: ${r.joinCode}`, 'goal');
        connectWS();
        setTimeout(() => showScreen('match'), 600);
      } catch (e) {
        toast(e.message === 'ROOM_NOT_FOUND' ? 'Room introuvable' : `Erreur: ${e.message}`, 'error');
        joinBtn.disabled = false;
      }
    });

    const screen = el('div', { class: 'screen active' }, [
      el('div', { class: 'match-top-bar' }, [
        el('button', { class: 'back-btn', onclick: () => showScreen('home') }, '←'),
        el('div', { class: 'heading-md' }, 'Squad Up'),
        el('div', { style: 'width:32px' }),
      ]),
      el('div', { class: 'room-content' }, [
        el('div', { class: 'room-card' }, [
          el('h3', {}, '🆕 Nouvelle room'),
          el('p', {}, 'Crée une room et invite ta squad avec le code à 6 chiffres.'),
          createBtn,
        ]),
        el('div', { class: 'divider' }, '— OU —'),
        el('div', { class: 'room-card' }, [
          el('h3', {}, '🔑 Rejoindre'),
          el('p', {}, 'Entre le code partagé par ton ami.'),
          codeInput,
          joinBtn,
        ]),
      ]),
    ]);
    $app.appendChild(screen);
  };

  const renderMatch = () => {
    const startDemoBtn = el('button', { class: 'cta-primary', style: 'margin-top:12px' }, '🎬 Lancer la démo live');
    startDemoBtn.addEventListener('click', async () => {
      startDemoBtn.disabled = true;
      startDemoBtn.textContent = 'Démarrage…';
      try {
        await api('/start-demo', {
          method: 'POST',
          body: JSON.stringify({ roomId: state.room.id }),
        });
        toast('🎬 Démo démarrée !', 'goal');
        startDemoBtn.style.display = 'none';
      } catch (e) {
        toast(`Erreur: ${e.message}`, 'error');
        startDemoBtn.disabled = false;
        startDemoBtn.textContent = '🎬 Lancer la démo live';
      }
    });

    const eventsList = el('div', { class: 'events-feed' });
    if (state.events.length === 0) {
      eventsList.appendChild(el('div', { style: 'text-align:center;color:var(--text-tertiary);padding:32px 16px' }, 'En attente des événements…'));
      eventsList.appendChild(startDemoBtn);
    } else {
      state.events.forEach((ev) => {
        eventsList.appendChild(el('div', { class: `event-card ${ev.cls || ''}` }, [
          el('div', { class: 'event-emoji' }, ev.emoji || '⚽'),
          el('div', { class: 'event-body' }, [
            el('div', { class: 'event-minute' }, ev.minute != null ? `${ev.minute}'` : ''),
            el('div', { class: 'event-title' }, ev.title || ''),
            ev.narration ? el('div', { class: 'event-narration' }, ev.narration) : null,
          ]),
        ]));
      });
    }

    // Reaction bar
    const emojis = ['⚽', '😱', '🔥', '💀'];
    const reactionBar = el('div', { class: 'reaction-bar' },
      emojis.map((emo) => {
        const btn = el('button', { class: 'reaction-btn' }, emo);
        btn.addEventListener('click', () => {
          const now = Date.now();
          if (now - state.lastReactionAt < 1000) {
            toast('⏱️ Trop rapide', 'error');
            return;
          }
          state.lastReactionAt = now;
          if (sendWS('sendReaction', { roomId: state.room.id, emoji: emo })) {
            btn.classList.add('cooldown');
            setTimeout(() => btn.classList.remove('cooldown'), 1000);
          }
        });
        return btn;
      })
    );

    const predictBtn = el('button', { class: 'predict-fab' }, '📊');
    predictBtn.addEventListener('click', openPredictionModal);

    const statusBanner = el('div', { class: 'status-banner', id: 'status-banner' }, state.wsConnected ? '● CONNECTÉ' : '○ Connexion…');
    if (state.wsConnected) statusBanner.classList.add('connected');

    const screen = el('div', { class: 'screen active match-screen' }, [
      el('div', { class: 'match-top-bar' }, [
        el('button', { class: 'back-btn', onclick: () => { closeWS(); showScreen('home'); } }, '←'),
        el('div', { class: 'match-room-code' }, `Room ${state.room.code || '—'}`),
        el('button', { class: 'back-btn', onclick: () => { refreshLeaderboard(); showScreen('leaderboard'); } }, '🏆'),
      ]),
      statusBanner,
      el('div', { class: 'score-hero' }, [
        el('div', { class: 'score-hero-teams' }, [
          el('div', { class: 'team' }, state.match.home),
          el('div', { class: 'score-hero-score' }, state.match.score),
          el('div', { class: 'team' }, state.match.away),
        ]),
        el('div', { class: 'score-hero-minute' }, state.match.status === 'LIVE' ? `${state.match.minute}' LIVE` : (state.match.status === 'FT' ? 'TERMINÉ' : (state.match.status === 'HT' ? 'MI-TEMPS' : 'EN ATTENTE'))),
      ]),
      eventsList,
      predictBtn,
      reactionBar,
      bottomNav('match'),
    ]);
    $app.appendChild(screen);

    if (!state.wsConnected) connectWS();
  };

  const updateStatusBanner = () => {
    const b = document.getElementById('status-banner');
    if (!b) return;
    b.textContent = state.wsConnected ? '● CONNECTÉ' : '○ Connexion…';
    b.className = 'status-banner' + (state.wsConnected ? ' connected' : '');
  };

  const openPredictionModal = () => {
    let home = 1, away = 1;
    const homeVal = el('div', { class: 'stepper-value' }, '1');
    const awayVal = el('div', { class: 'stepper-value' }, '1');

    const stepper = (val, getter, setter, valEl) => el('div', { class: 'stepper' }, [
      el('button', { class: 'stepper-btn', onclick: () => { setter(Math.min(99, getter() + 1)); valEl.textContent = String(getter()); } }, '+'),
      valEl,
      el('button', { class: 'stepper-btn', onclick: () => { setter(Math.max(0, getter() - 1)); valEl.textContent = String(getter()); } }, '−'),
    ]);

    const submit = el('button', { class: 'cta-primary' }, 'Valider mon prono');
    submit.addEventListener('click', () => {
      if (sendWS('sendPrediction', {
        roomId: state.room.id,
        prediction: { homeScore: home, awayScore: away },
        predictionType: state.match.status === 'HT' ? 'halftime' : 'pre-match',
      })) {
        toast('📊 Prono envoyé !', 'goal');
        backdrop.remove();
      }
    });

    const cancel = el('button', { class: 'cta-ghost' }, 'Annuler');
    cancel.addEventListener('click', () => backdrop.remove());

    const backdrop = el('div', { class: 'modal-backdrop active' }, [
      el('div', { class: 'modal' }, [
        el('h3', {}, 'Ton pronostic'),
        el('p', {}, `${state.match.home} vs ${state.match.away}`),
        el('div', { class: 'score-picker' }, [
          stepper(home, () => home, (v) => home = v, homeVal),
          el('div', { class: 'score-picker-sep' }, ':'),
          stepper(away, () => away, (v) => away = v, awayVal),
        ]),
        submit,
        cancel,
      ]),
    ]);
    $app.appendChild(backdrop);
  };

  const renderLeaderboard = () => {
    const list = el('div', { class: 'lb-content' });
    if (state.leaderboard.length === 0) {
      list.appendChild(el('div', { style: 'text-align:center;color:var(--text-tertiary);padding:48px 16px' }, 'Le classement sera visible après le coup d\'envoi.'));
    } else {
      state.leaderboard.forEach((p, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const isMe = p.fanName === state.user.name;
        list.appendChild(el('div', { class: `lb-row ${isMe ? 'me' : ''}` }, [
          el('div', { class: `lb-rank ${rankClass}` }, i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i + 1}`))),
          el('div', { class: 'lb-name' }, p.fanName),
          el('div', { class: 'lb-points' }, `${p.points} PTS`),
        ]));
      });
    }

    const screen = el('div', { class: 'screen active' }, [
      el('div', { class: 'match-top-bar' }, [
        el('button', { class: 'back-btn', onclick: () => showScreen('match') }, '←'),
        el('div', { class: 'heading-md' }, '🏆 Classement'),
        el('button', { class: 'back-btn', onclick: refreshLeaderboard }, '↻'),
      ]),
      el('div', { class: 'lb-header' }, el('div', { class: 'label' }, `Room ${state.room.code || '—'}`)),
      list,
      bottomNav('leaderboard'),
    ]);
    $app.appendChild(screen);
  };

  const refreshLeaderboard = async () => {
    if (!state.room.id) return;
    try {
      const r = await api(`/leaderboard?roomId=${encodeURIComponent(state.room.id)}`);
      state.leaderboard = r.leaderboard || [];
      if (state.screen === 'leaderboard') renderLeaderboard();
    } catch (e) {
      toast(`Erreur leaderboard: ${e.message}`, 'error');
    }
  };

  const closeWS = () => {
    if (state.ws) {
      try { state.ws.close(); } catch (e) {}
      state.ws = null;
      state.wsConnected = false;
    }
  };

  const bottomNav = (active) => el('div', { class: 'bottom-nav' }, [
    el('button', { class: `nav-btn ${active === 'home' ? 'active' : ''}`, onclick: () => showScreen('home') }, '🏠'),
    el('button', { class: `nav-btn ${active === 'match' ? 'active' : ''}`, onclick: () => state.room.id ? showScreen('match') : toast('Crée ou rejoins une room', 'error') }, '⚽'),
    el('button', { class: `nav-btn ${active === 'leaderboard' ? 'active' : ''}`, onclick: () => state.room.id ? (refreshLeaderboard(), showScreen('leaderboard')) : toast('Crée ou rejoins une room', 'error') }, '🏆'),
  ]);

  // ─────────── Boot ───────────
  loadLocal();
  showScreen('splash');
})();
