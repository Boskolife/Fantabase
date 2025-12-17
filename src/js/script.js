(() => {
  'use strict';

  const MAX_GUEST_MESSAGES = 5;
  const API_BASE_URL = 'https://fantabase-api.wittyocean-de44e066.westus2.azurecontainerapps.io';
  const WAIT_MESSAGES = [
    'Thinking',
    'Analyzing',
    'Processing',
    'Gathering info',
    'Working on it',
    'Looking into it',
    'Checking details',
    'Reviewing data',
    'Almost ready',
    'Finalizing'
  ];
  const WAIT_MESSAGE_INTERVAL_MS = 2500;

  const STORAGE_KEYS = {
    sessionId: 'fantabase_demo_guest_session_id',
    sleeperUsername: 'fantabase_demo_sleeper_username',
    remainingMessages: 'fantabase_demo_remaining_messages',
    history: 'fantabase_demo_chat_history_v1'
  };

  function getHistoryStorageKey(sessionIdValue) {
    return `${STORAGE_KEYS.history}_${sessionIdValue}`;
  }

  function readChatHistory(sessionIdValue) {
    const key = getHistoryStorageKey(sessionIdValue);
    const raw = readStorage(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (m) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.text === 'string' &&
            m.text.trim().length > 0
        )
        .map((m) => ({ role: m.role, text: String(m.text) }))
        .slice(-200);
    } catch {
      return [];
    }
  }

  function writeChatHistory(sessionIdValue, messages) {
    const key = getHistoryStorageKey(sessionIdValue);
    try {
      writeStorage(key, JSON.stringify(messages.slice(-200)));
    } catch {
      // ignore
    }
  }

  function appendToHistory(sessionIdValue, role, text) {
    const cleanText = toTrimmedStringOrNull(text);
    if (!cleanText) return;

    const existing = readChatHistory(sessionIdValue);
    existing.push({ role, text: cleanText });
    writeChatHistory(sessionIdValue, existing);
  }

  function renderHistoryIntoMessages(sessionIdValue) {
    const history = readChatHistory(sessionIdValue);
    if (!history.length) return;

    messagesEl.textContent = '';
    for (const item of history) {
      const el = createMessageElement(item.role, item.text);
      messagesEl.appendChild(el.wrapper);
    }
  }

  /** @returns {string} */
  function createSessionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback UUID-ish: timestamp + random
    const rand = Math.random().toString(16).slice(2);
    const time = Date.now().toString(16);
    return `fallback_${time}_${rand}`;
  }

  /** @param {string} key */
  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /** @param {string} key @param {string} value */
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  /** @param {string} key */
  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  /** @param {number} value */
  function clampToRange(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(MAX_GUEST_MESSAGES, Math.floor(value)));
  }

  /** @param {unknown} value */
  function toTrimmedStringOrNull(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function normalizeApiBaseUrl(value) {
    const api = toTrimmedStringOrNull(value);
    if (!api) return null;

    try {
      const url = new URL(api);
      return url.toString().replace(/\/$/, '');
    } catch {
      return null;
    }
  }

  /**
   * @param {'user'|'assistant'} role
   * @param {string} text
   */
  function createMessageElement(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `howie-message howie-message--${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'howie-message__bubble';
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    return { wrapper, bubble };
  }

  function setLoadingBubbleContent(bubble, text) {
    bubble.classList.add('howie-message__bubble--loading');
    bubble.textContent = '';

    const loadingRow = document.createElement('div');
    loadingRow.className = 'howie-loading';

    const spinner = document.createElement('span');
    spinner.className = 'howie-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'howie-loadingText';
    label.textContent = text;

    const dots = document.createElement('span');
    dots.className = 'howie-dots';
    dots.setAttribute('aria-hidden', 'true');

    const dot1 = document.createElement('span');
    dot1.className = 'howie-dot';
    const dot2 = document.createElement('span');
    dot2.className = 'howie-dot';
    const dot3 = document.createElement('span');
    dot3.className = 'howie-dot';
    dots.appendChild(dot1);
    dots.appendChild(dot2);
    dots.appendChild(dot3);

    loadingRow.appendChild(spinner);
    loadingRow.appendChild(label);
    loadingRow.appendChild(dots);

    bubble.appendChild(loadingRow);

    return { label };
  }

  function clearLoadingBubbleContent(bubble) {
    bubble.classList.remove('howie-message__bubble--loading');
    bubble.textContent = '';
  }

  function scrollMessagesToBottom(messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  const widgetEl = document.getElementById('howieWidget');
  const launcherEl = document.getElementById('howieLauncher');
  const apiErrorEl = document.getElementById('apiError');
  const closeWidgetEl = document.getElementById('closeWidget');
  const configureSleeperBtnEl = document.getElementById('configureSleeperBtn');
  const connectSectionEl = document.getElementById('connectSection');
  const closeSleeperConfigEl = document.getElementById('closeSleeperConfig');
  const connectFormEl = document.getElementById('connectForm');
  const sleeperUsernameInputEl = document.getElementById('sleeperUsernameInput');
  const noSleeperEl = document.getElementById('noSleeper');

  const messagesEl = document.getElementById('messages');
  const chatInputEl = document.getElementById('chatInput');
  const sendBtnEl = document.getElementById('sendBtn');

  const limitCounterEl = document.getElementById('limitCounter');
  const progressSegmentsEl = document.getElementById('progressSegments');

  const limitHitSectionEl = document.getElementById('limitHitSection');
  const chatFooterEl = document.getElementById('chatFooter');
  const waitlistFormEl = document.getElementById('waitlistForm');
  const waitlistEmailEl = document.getElementById('waitlistEmail');

  if (
    !(widgetEl instanceof HTMLElement) ||
    !(launcherEl instanceof HTMLButtonElement) ||
    !(apiErrorEl instanceof HTMLElement) ||
    !(closeWidgetEl instanceof HTMLElement) ||
    !(configureSleeperBtnEl instanceof HTMLButtonElement) ||
    !(connectSectionEl instanceof HTMLElement) ||
    !(closeSleeperConfigEl instanceof HTMLButtonElement) ||
    !(connectFormEl instanceof HTMLFormElement) ||
    !(sleeperUsernameInputEl instanceof HTMLInputElement) ||
    !(noSleeperEl instanceof HTMLButtonElement) ||
    !(messagesEl instanceof HTMLElement) ||
    !(chatInputEl instanceof HTMLInputElement) ||
    !(sendBtnEl instanceof HTMLButtonElement) ||
    !(limitCounterEl instanceof HTMLElement) ||
    !(progressSegmentsEl instanceof HTMLElement) ||
    !(limitHitSectionEl instanceof HTMLElement) ||
    !(chatFooterEl instanceof HTMLElement) ||
    !(waitlistFormEl instanceof HTMLFormElement) ||
    !(waitlistEmailEl instanceof HTMLInputElement)
  ) {
    return;
  }

  const apiBaseUrl = normalizeApiBaseUrl(API_BASE_URL);
  apiErrorEl.hidden = true;

  // Session + persisted state
  let sessionId = readStorage(STORAGE_KEYS.sessionId);
  if (!sessionId) {
    sessionId = createSessionId();
    writeStorage(STORAGE_KEYS.sessionId, sessionId);
  }

  const persistedSleeperUsername = toTrimmedStringOrNull(readStorage(STORAGE_KEYS.sleeperUsername));
  if (persistedSleeperUsername) {
    sleeperUsernameInputEl.value = persistedSleeperUsername;
  }

  let remainingMessages = (() => {
    const stored = readStorage(STORAGE_KEYS.remainingMessages);
    const parsed = stored ? Number(stored) : Number.NaN;
    return clampToRange(Number.isFinite(parsed) ? parsed : MAX_GUEST_MESSAGES);
  })();

  function updateLimitUi() {
    const used = clampToRange(MAX_GUEST_MESSAGES - remainingMessages);
    limitCounterEl.textContent = `${used}/${MAX_GUEST_MESSAGES}`;

    // Update progress segments
    const segments = progressSegmentsEl.querySelectorAll('.howie-progress__segment');
    segments.forEach((seg, i) => {
      if (i < used) {
        seg.classList.add('active');
      } else {
        seg.classList.remove('active');
      }
    });
  }

  function setChatEnabled(enabled) {
    const canChat =
      Boolean(enabled) && Boolean(apiBaseUrl) && remainingMessages > 0 && !messagesEl.hidden && !widgetEl.hidden;
    chatInputEl.disabled = !canChat;
    sendBtnEl.disabled = !canChat;
  }

  function openWidget() {
    widgetEl.hidden = false;
    widgetEl.setAttribute('data-open', 'true');
    launcherEl.setAttribute('data-open', 'true');
    setChatEnabled(true);

    if (!messagesEl.hidden && !chatInputEl.disabled) {
      chatInputEl.focus();
    } else if (!connectSectionEl.hidden) {
      sleeperUsernameInputEl.focus();
    }
  }

  function closeWidget() {
    widgetEl.setAttribute('data-open', 'false');
    widgetEl.hidden = true;
    launcherEl.setAttribute('data-open', 'false');
    setChatEnabled(false);
  }

  function openSleeperConfig() {
    connectSectionEl.hidden = false;
    messagesEl.hidden = true;
    limitHitSectionEl.hidden = true;
    chatFooterEl.hidden = false;
    updateLimitUi();
    setChatEnabled(false);
    if (!widgetEl.hidden) {
      sleeperUsernameInputEl.focus();
    }
  }

  function beginChat() {
    // Check if limit is already hit
    if (remainingMessages <= 0) {
      showLimitHit();
      return;
    }

    connectSectionEl.hidden = true;
    messagesEl.hidden = false;
    limitHitSectionEl.hidden = true;
    chatFooterEl.hidden = false;

    if (messagesEl.childElementCount === 0) {
      renderHistoryIntoMessages(sessionId);
    }

    updateLimitUi();
    setChatEnabled(true);
    if (!widgetEl.hidden) {
      chatInputEl.focus();
    }
    scrollMessagesToBottom(messagesEl);
  }

  function showLimitHit() {
    connectSectionEl.hidden = true;
    messagesEl.hidden = true;
    limitHitSectionEl.hidden = false;
    chatFooterEl.hidden = true;
    updateLimitUi();
    setChatEnabled(false);
    if (!widgetEl.hidden) {
      waitlistEmailEl.focus();
    }
  }

  function persistRemaining() {
    writeStorage(STORAGE_KEYS.remainingMessages, String(remainingMessages));
  }

  function setRemainingMessages(value, options = {}) {
    remainingMessages = clampToRange(value);
    updateLimitUi();
    persistRemaining();

    // Show limit hit screen when messages depleted
    if (remainingMessages <= 0) {
      showLimitHit();
      return true; // Return true to indicate limit was hit
    }

    if (options.enableChat !== false) {
      setChatEnabled(true);
    }
    return false;
  }

  updateLimitUi();
  setChatEnabled(false);

  function toggleWidget() {
    if (widgetEl.hidden) {
      openWidget();
      return;
    }
    closeWidget();
  }

  closeWidgetEl.addEventListener('click', () => closeWidget());
  launcherEl.addEventListener('click', () => toggleWidget());
  configureSleeperBtnEl.addEventListener('click', () => openSleeperConfig());
  closeSleeperConfigEl.addEventListener('click', () => beginChat());

  connectFormEl.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = toTrimmedStringOrNull(sleeperUsernameInputEl.value);
    if (username) {
      writeStorage(STORAGE_KEYS.sleeperUsername, username);
    } else {
      removeStorage(STORAGE_KEYS.sleeperUsername);
    }

    beginChat();
  });

  noSleeperEl.addEventListener('click', () => {
    removeStorage(STORAGE_KEYS.sleeperUsername);
    sleeperUsernameInputEl.value = '';
    beginChat();
  });

  waitlistFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = toTrimmedStringOrNull(waitlistEmailEl.value);
    if (email) {
      // For demo purposes, just show a confirmation
      // In production, this would submit to a backend
      alert('Thanks for joining the waitlist! We\'ll be in touch.');
      waitlistEmailEl.value = '';
    }
  });

  async function sendMessage() {
    if (!apiBaseUrl) {
      apiErrorEl.hidden = false;
      return;
    }

    if (remainingMessages <= 0) {
      setChatEnabled(true);
      return;
    }

    const messageText = toTrimmedStringOrNull(chatInputEl.value);
    if (!messageText) {
      return;
    }

    const userMessage = createMessageElement('user', messageText);
    messagesEl.appendChild(userMessage.wrapper);
    appendToHistory(sessionId, 'user', messageText);

    chatInputEl.value = '';
    setChatEnabled(false);
    scrollMessagesToBottom(messagesEl);

    const previousRemaining = remainingMessages;
    setRemainingMessages(previousRemaining - 1, { enableChat: false });

    const assistantPlaceholder = createMessageElement('assistant', '');
    messagesEl.appendChild(assistantPlaceholder.wrapper);
    scrollMessagesToBottom(messagesEl);

    const loadingState = setLoadingBubbleContent(
      assistantPlaceholder.bubble,
      WAIT_MESSAGES[0] || 'Working on it'
    );

    let waitIndex = 0;
    const waitIntervalId = window.setInterval(() => {
      waitIndex = (waitIndex + 1) % WAIT_MESSAGES.length;
      loadingState.label.textContent = WAIT_MESSAGES[waitIndex] || 'Working on it';
      scrollMessagesToBottom(messagesEl);
    }, WAIT_MESSAGE_INTERVAL_MS);

    const sleeperUsername = toTrimmedStringOrNull(readStorage(STORAGE_KEYS.sleeperUsername));

    /** @type {{message: string, sessionId: string, sleeperUsername?: string}} */
    const payload = {
      message: messageText,
      sessionId: sessionId
    };

    if (sleeperUsername) {
      payload.sleeperUsername = sleeperUsername;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/chatbot/guest/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        const serverMessage = body && typeof body.message === 'string' ? body.message : `Request failed (${res.status})`;
        window.clearInterval(waitIntervalId);
        clearLoadingBubbleContent(assistantPlaceholder.bubble);

        if (res.status === 429) {
          setRemainingMessages(0);
          return; // Limit hit screen is shown
        }

        assistantPlaceholder.bubble.textContent = serverMessage;
        setRemainingMessages(previousRemaining, { enableChat: false });
        return;
      }

      const responseText = body && typeof body.text === 'string' ? body.text : '';
      window.clearInterval(waitIntervalId);
      clearLoadingBubbleContent(assistantPlaceholder.bubble);
      assistantPlaceholder.bubble.textContent = responseText || 'No response text returned.';
      appendToHistory(sessionId, 'assistant', responseText || 'No response text returned.');

      const responseRemaining = body && typeof body.remainingMessages === 'number' ? body.remainingMessages : null;
      if (typeof responseRemaining === 'number') {
        const limitHit = setRemainingMessages(responseRemaining);
        if (limitHit) {
          return; // Exit early - limit hit screen is shown
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      window.clearInterval(waitIntervalId);
      clearLoadingBubbleContent(assistantPlaceholder.bubble);
      assistantPlaceholder.bubble.textContent = `Network error: ${message}`;
      setRemainingMessages(previousRemaining, { enableChat: false });
    } finally {
      // Only update UI if limit not hit (messages still visible)
      if (!messagesEl.hidden) {
        setChatEnabled(true);
        scrollMessagesToBottom(messagesEl);
      }
    }
  }

  sendBtnEl.addEventListener('click', () => {
    void sendMessage();
  });

  chatInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void sendMessage();
    }
  });

  // Start closed like a widget; show launcher.
  closeWidget();

  // If user already provided username previously, default to chat view when opened.
  if (persistedSleeperUsername) {
    beginChat();
  } else {
    openSleeperConfig();
  }
})();

