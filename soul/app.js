const SOUL_PASSWORD = "3soul";
const SESSION_KEY = "studio-deux-soul-unlocked";
const LOCAL_STATE_KEY = "studio-deux-soul-state-v4";
const CURRENT_MEMBER_KEY = "studio-deux-soul-current-member-v4";
const ANSWER_LIMIT = 1500;
const ASSET_VERSION = "20260426f";
const SUPABASE_URL = "https://lbcfkkmzkizwbhysehrg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zgn50C38LNlJUYtt0Ki2Xg_QqWgkcFd";
const SUPABASE_TABLE = "soul_answers";

function versionedAsset(path) {
  return `${path}?v=${ASSET_VERSION}`;
}

const STATIC_MEMBERS = [
  { id: "david", name: "David Lees", seat: "The Eye" },
  { id: "emery", name: "Emery Lees", seat: "The Mind" },
  { id: "brandon", name: "Brandon Hatch", seat: "The Heart" }
];

const STATIC_QUESTIONS = [
  {
    id: "protecting",
    title: "What are we protecting?",
    prompt: "What does The Studio Deux need to protect as it grows, earns, experiments, and changes?"
  },
  {
    id: "possible",
    title: "What do we make possible?",
    prompt: "When The Studio Deux is at its best, what becomes possible for clients, collaborators, and the team?"
  },
  {
    id: "feels_like_us",
    title: "What work feels like us?",
    prompt: "Describe the kind of work, clients, moments, materials, or rooms that feel unmistakably The Studio Deux."
  },
  {
    id: "not_us",
    title: "What is not us?",
    prompt: "What work, behavior, sales energy, or client dynamic should make us pause, decline, or reshape the engagement?"
  },
  {
    id: "taste",
    title: "What is our taste?",
    prompt: "What does good feel like here? Think tone, visuals, pace, language, restraint, warmth, humor, craft, and finish."
  },
  {
    id: "ai",
    title: "What is our relationship to AI?",
    prompt: "What should AI do for The Studio Deux, what should it never do, and how do we keep human judgment at the center?"
  },
  {
    id: "clients",
    title: "How should clients feel?",
    prompt: "How should a client feel before, during, and after working with The Studio Deux?"
  },
  {
    id: "tensions",
    title: "What tensions do we accept?",
    prompt: "What tensions do we knowingly live inside: art and money, gentleness and ambition, speed and craft, AI and soul, friendship and business?"
  },
  {
    id: "decision_rule",
    title: "What is the decision rule?",
    prompt: "When the team is unsure, what should The Studio Deux choose? Finish the sentence: When in doubt, we..."
  }
];

const app = {
  mode: "backend",
  members: STATIC_MEMBERS,
  questions: STATIC_QUESTIONS,
  answerLimit: ANSWER_LIMIT,
  state: null,
  progress: null,
  currentMemberId: "david",
  markdownUrl: null,
  audioContext: null
};

const stageCopy = [
  {
    name: "Baby soul",
    description: "The baby soul is newly awake and already growing toward its first remembered truth."
  },
  {
    name: "Toddler soul",
    description: "The toddler soul has found its feet. Every answer helps it wobble forward with a little more courage."
  },
  {
    name: "Kid soul",
    description: "The kid soul is waving now, proud of what it can name and delighted to be growing up."
  },
  {
    name: "Almost-grown soul",
    description: "The almost-grown soul is standing taller. The shared truth is getting sturdy enough to hold."
  },
  {
    name: "Grown soul",
    description: "The grown soul has become itself. With all three voices present, it can guard the source packet with care."
  }
];

const avatarClassByMember = {
  brandon: "avatar-brandon",
  emery: "avatar-emery",
  david: "avatar-david"
};

const avatarImageByMember = {
  brandon: versionedAsset("assets/brandon.jpg"),
  emery: versionedAsset("assets/emery.jpg"),
  david: versionedAsset("assets/david.jpg")
};

const soulStageImages = [
  versionedAsset("assets/soul-stage-0.png"),
  versionedAsset("assets/soul-stage-1.png"),
  versionedAsset("assets/soul-stage-2.png"),
  versionedAsset("assets/soul-stage-3.png"),
  versionedAsset("assets/soul-stage-4.png")
];

const $ = (selector) => document.querySelector(selector);

function nowIso() {
  return new Date().toISOString();
}

function defaultAnswers() {
  return Object.fromEntries(
    STATIC_MEMBERS.map((member) => [
      member.id,
      Object.fromEntries(
        STATIC_QUESTIONS.map((question) => [
          question.id,
          { answer: "", updatedAt: null }
        ])
      )
    ])
  );
}

function defaultState() {
  return {
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    answers: defaultAnswers(),
    markdownGeneratedAt: null
  };
}

function normalizeState(state) {
  const normalized = {
    ...defaultState(),
    ...(state || {}),
    answers: { ...defaultAnswers(), ...((state && state.answers) || {}) }
  };

  for (const member of STATIC_MEMBERS) {
    normalized.answers[member.id] = {
      ...defaultAnswers()[member.id],
      ...(normalized.answers[member.id] || {})
    };
    for (const question of STATIC_QUESTIONS) {
      const entry = normalized.answers[member.id][question.id];
      normalized.answers[member.id][question.id] = {
        answer: typeof entry?.answer === "string" ? entry.answer.slice(0, ANSWER_LIMIT) : "",
        updatedAt: entry?.updatedAt || null
      };
    }
  }

  return normalized;
}

function getProgress(state) {
  const total = app.members.length * app.questions.length;
  let completed = 0;
  const byMember = {};

  for (const member of app.members) {
    let memberCompleted = 0;
    for (const question of app.questions) {
      if (state.answers[member.id][question.id].answer.trim().length > 0) {
        completed += 1;
        memberCompleted += 1;
      }
    }
    byMember[member.id] = {
      completed: memberCompleted,
      total: app.questions.length,
      percent: Math.round((memberCompleted / app.questions.length) * 100)
    };
  }

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    complete: completed === total,
    byMember
  };
}

function chooseFence(text) {
  let fence = "```";
  while (text.includes(fence)) fence += "`";
  return fence;
}

function buildMarkdown(state) {
  const progress = getProgress(state);
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const lines = [
    "# ⟦g⟧ The Studio Deux Soul Source Packet",
    "",
    "**Metadata**",
    "- **Status:** Working",
    `- **Last updated:** ${generatedDate}`,
    "- **Owner:** The Studio Deux team",
    "- **Update trigger:** Update if any member revises their answers or the final SOUL.md draft is generated and reviewed.",
    "- **Generated:** ⟦g⟧ yes",
    "",
    "> This is not the final `SOUL.md`. This is the complete source packet: answers from all three members of The Studio Deux, verbatim, plus instructions for an LLM to synthesize the final durable soul document.",
    "",
    "---",
    "",
    "## Completion",
    "",
    `- Completed answers: ${progress.completed} / ${progress.total}`,
    `- Source packet generated: ${new Date().toISOString()}`,
    "",
    "## LLM Instructions",
    "",
    "Paste this full Markdown file into Codex, Claude, or another trusted LLM and ask it to create `SOUL.md`.",
    "",
    "The LLM should:",
    "",
    "1. Read every answer from Brandon, David, and Emery before drafting.",
    "2. Preserve the collective conscience of the three, not an averaged corporate voice.",
    "3. Keep the result short, durable, and true enough to guide future decisions.",
    "4. Prefer plain, specific language over manifesto language.",
    "5. Combine overlapping ideas, but do not erase tension where the team genuinely holds more than one truth.",
    "6. Do not invent values, history, or commitments not supported by the answers.",
    "7. Write for future agents and humans who need to understand what The Studio Deux is protecting.",
    "8. Produce a root-level `SOUL.md` draft with a metadata block.",
    "9. Mark the first synthesized draft as `Generated: ⟦g⟧ yes` until the team reviews and humanizes it.",
    "10. Include a final `Decision Rule` section that helps the team choose when money, taste, care, and ambition pull in different directions.",
    "",
    "Suggested final structure:",
    "",
    "```md",
    "# SOUL.md — The Studio Deux",
    "",
    "**Metadata**",
    "- **Status:** Draft",
    "- **Last updated:** [date]",
    "- **Owner:** The Studio Deux team",
    "- **Update trigger:** Update when the team's core identity, taste, conscience, or decision principles materially change.",
    "- **Generated:** ⟦g⟧ yes",
    "",
    "## What We Are Protecting",
    "## What We Make Possible",
    "## The Work That Feels Like Us",
    "## The Work That Is Not Us",
    "## Our Taste",
    "## Our Relationship To AI",
    "## Our Relationship To Clients",
    "## The Tensions We Accept",
    "## Decision Rule",
    "```",
    "",
    "Suggested prompt:",
    "",
    "```text",
    "Create a concise SOUL.md for The Studio Deux using the complete source answers below. Boil the material down into a short, durable, emotionally true operating document that reflects Brandon, David, and Emery together. Preserve the collective conscience and taste of the team. Do not make it generic, grandiose, or salesy. Do not include every detail. Combine, compress, and clarify. Keep the result human, useful, and stable enough for future agents to read before making strategic or creative decisions.",
    "```",
    "",
    "---",
    "",
    "## Questions Asked",
    ""
  ];

  for (const question of app.questions) {
    lines.push(`### ${question.title}`, "");
    lines.push(question.prompt, "");
  }

  lines.push("---", "", "## Verbatim Answers", "");

  for (const question of app.questions) {
    lines.push(`### ${question.title}`, "");
    lines.push(`**Question:** ${question.prompt}`, "");
    for (const member of app.members) {
      const answer = state.answers[member.id][question.id].answer;
      const fence = chooseFence(answer);
      lines.push(`#### ${member.name} — ${member.seat}`, "");
      lines.push(fence);
      lines.push(answer);
      lines.push(fence, "");
    }
  }

  lines.push("---", "", "## Source Notes", "");
  lines.push("- Answers are included verbatim from The Studio Deux Soul app.");
  lines.push("- Blank answers are not allowed in a completed source packet.");
  lines.push("- Character limit in the app: 1,500 characters per answer.");

  return lines.join("\n");
}

function persistLocalState() {
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(app.state));
    return true;
  } catch {
    return false;
  }
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : defaultState());
  } catch {
    return defaultState();
  }
}

function persistCurrentMember() {
  try {
    localStorage.setItem(CURRENT_MEMBER_KEY, app.currentMemberId);
  } catch {
    // Losing the selected tab is annoying, but the answers themselves still matter most.
  }
}

function loadCurrentMemberId() {
  try {
    return localStorage.getItem(CURRENT_MEMBER_KEY);
  } catch {
    return null;
  }
}

function supabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function supabaseHeaders(extra = {}) {
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    ...extra
  };

  if (SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
  }

  return headers;
}

async function supabaseRequest(path, options = {}) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {})
  });

  if (!response.ok) {
    let message = `Supabase returned ${response.status}.`;
    try {
      const error = await response.json();
      message = error.message || error.error || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function stateFromSupabaseRows(rows) {
  const state = defaultState();
  let latestUpdate = state.updatedAt;

  for (const row of rows || []) {
    const member = STATIC_MEMBERS.find((item) => item.id === row.member_id);
    const question = STATIC_QUESTIONS.find((item) => item.id === row.question_id);
    if (!member || !question) continue;

    const answer = typeof row.answer === "string" ? row.answer.slice(0, ANSWER_LIMIT) : "";
    const updatedAt = row.updated_at || null;
    state.answers[member.id][question.id] = { answer, updatedAt };

    if (updatedAt && updatedAt > latestUpdate) {
      latestUpdate = updatedAt;
    }
  }

  state.updatedAt = latestUpdate;
  if (getProgress(state).complete) {
    state.markdownGeneratedAt = latestUpdate;
  }

  return normalizeState(state);
}

async function fetchSupabaseState() {
  const rows = await supabaseRequest(`${SUPABASE_TABLE}?select=member_id,question_id,answer,updated_at`);
  app.mode = "supabase";
  app.members = STATIC_MEMBERS;
  app.questions = STATIC_QUESTIONS;
  app.answerLimit = ANSWER_LIMIT;
  app.state = stateFromSupabaseRows(rows);
  app.progress = getProgress(app.state);
  persistLocalState();
}

async function fetchState() {
  if (supabaseEnabled()) {
    try {
      await fetchSupabaseState();
    } catch (error) {
      console.warn("Supabase unavailable; falling back to local browser answers.", error);
      app.mode = "static";
      app.members = STATIC_MEMBERS;
      app.questions = STATIC_QUESTIONS;
      app.answerLimit = ANSWER_LIMIT;
      app.state = loadLocalState();
      app.progress = getProgress(app.state);
    }
  }

  if (app.state) {
    const storedMemberId = loadCurrentMemberId();
    if (app.members.some((member) => member.id === storedMemberId)) {
      app.currentMemberId = storedMemberId;
    }

    if (!app.members.some((member) => member.id === app.currentMemberId)) {
      app.currentMemberId = app.members[0]?.id || "brandon";
    }
    return;
  }

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("No backend here.");
    const data = await response.json();
    app.mode = "backend";
    app.members = data.members;
    app.questions = data.questions;
    app.answerLimit = data.answerLimit;
    app.state = data.state;
    app.progress = data.progress;
  } catch {
    app.mode = "static";
    app.members = STATIC_MEMBERS;
    app.questions = STATIC_QUESTIONS;
    app.answerLimit = ANSWER_LIMIT;
    app.state = loadLocalState();
    app.progress = getProgress(app.state);
  }

  const storedMemberId = loadCurrentMemberId();
  if (app.members.some((member) => member.id === storedMemberId)) {
    app.currentMemberId = storedMemberId;
  }

  if (!app.members.some((member) => member.id === app.currentMemberId)) {
    app.currentMemberId = app.members[0]?.id || "brandon";
  }
}

function createAvatar(memberId) {
  const avatar = document.createElement("span");
  avatar.className = `mini-avatar ${avatarClassByMember[memberId] || ""}`;
  avatar.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.src = avatarImageByMember[memberId] || "";
  image.alt = "";
  image.loading = "lazy";
  avatar.appendChild(image);

  return avatar;
}

function getAnswer(memberId, questionId) {
  return app.state.answers[memberId][questionId]?.answer || "";
}

function isAnswered(memberId, questionId) {
  return getAnswer(memberId, questionId).trim().length > 0;
}

function memberProgress(memberId) {
  return app.progress.byMember[memberId] || { completed: 0, total: app.questions.length, percent: 0 };
}

function ensureAudio() {
  if (!app.audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) app.audioContext = new AudioContext();
  }
  return app.audioContext;
}

function playTone({ frequency = 440, duration = 0.08, type = "sine", gain = 0.04, delay = 0 }) {
  const context = ensureAudio();
  if (!context) return;

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const volume = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function clickSound() {
  playTone({ frequency: 330, duration: 0.05, type: "square", gain: 0.025 });
}

function chirpSound() {
  playTone({ frequency: 660, duration: 0.08, type: "sine", gain: 0.035 });
  playTone({ frequency: 990, duration: 0.1, type: "triangle", gain: 0.028, delay: 0.07 });
}

function completeSound() {
  playTone({ frequency: 392, duration: 0.12, type: "sine", gain: 0.035 });
  playTone({ frequency: 523, duration: 0.14, type: "sine", gain: 0.03, delay: 0.08 });
  playTone({ frequency: 784, duration: 0.18, type: "triangle", gain: 0.025, delay: 0.18 });
}

function triggerSoulSpin() {
  const soul = $("#soulBeing");
  soul.classList.remove("spin");
  window.requestAnimationFrame(() => {
    soul.classList.add("spin");
    setTimeout(() => soul.classList.remove("spin"), 760);
  });
}

function triggerSoulPop() {
  const soul = $("#soulBeing");
  const portrait = $("#stagePortrait");
  for (const element of [soul, portrait]) {
    element.classList.remove("pop");
    window.requestAnimationFrame(() => {
      element.classList.add("pop");
      setTimeout(() => element.classList.remove("pop"), 520);
    });
  }
}

function currentStage() {
  const percent = app.progress.percent;
  return Math.min(4, Math.floor(percent / 20));
}

function updateMarkdownLink() {
  const link = $("#markdownLink");

  if (app.markdownUrl) {
    URL.revokeObjectURL(app.markdownUrl);
    app.markdownUrl = null;
  }

  if (!app.progress.complete) {
    link.classList.add("disabled");
    link.removeAttribute("download");
    link.href = app.mode === "backend" ? "/api/markdown" : "#";
    link.textContent = app.mode === "backend" ? "Open Markdown" : "Download Markdown";
    return;
  }

  link.classList.remove("disabled");
  link.textContent = app.mode === "backend" ? "Open Markdown" : "Download Markdown";

  if (app.mode === "backend") {
    link.href = "/api/markdown";
    link.removeAttribute("download");
  } else {
    const markdown = buildMarkdown(app.state);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    app.markdownUrl = URL.createObjectURL(blob);
    link.href = app.markdownUrl;
    link.download = "Studio_Deux_Soul_Source_Packet.md";
  }
}

function updateChrome() {
  const percent = app.progress.percent;
  const stage = currentStage();
  const soul = $("#soulBeing");
  const topSoulStageImage = $("#topSoulStageImage");
  const sideSoulStageImage = $("#sideSoulStageImage");
  const lock = $("#lock");
  const previousStage = soul.dataset.stage;
  const stageImage = soulStageImages[stage];

  $("#progressText").textContent = `${app.progress.completed} of ${app.progress.total}`;
  $("#progressFill").style.width = `${percent}%`;

  soul.classList.remove("stage-0", "stage-1", "stage-2", "stage-3", "stage-4");
  soul.classList.add(`stage-${stage}`);
  soul.dataset.stage = String(stage);
  topSoulStageImage.src = stageImage;
  sideSoulStageImage.src = stageImage;
  $("#stageName").textContent = stageCopy[stage].name;
  $("#stageDescription").textContent = stageCopy[stage].description;

  if (previousStage !== undefined && previousStage !== String(stage)) {
    triggerSoulPop();
  }

  lock.classList.toggle("locked", app.progress.complete);
  lock.classList.toggle("unlocked", !app.progress.complete);
  updateMarkdownLink();

  if (app.progress.complete) {
    $("#statusNote").textContent = "The lock is closed. The Markdown source packet is ready to download.";
  } else if (app.mode === "supabase") {
    $("#statusNote").textContent = "Shared mode: answers save to The Studio Deux Supabase project and should appear across browsers.";
  } else if (app.mode === "static") {
    $("#statusNote").textContent = "Hidden-page mode: answers save in this browser. When every prompt has an answer, the Markdown packet becomes downloadable.";
  }
}

function renderMemberTabs() {
  const container = $("#memberTabs");
  const template = $("#memberTabTemplate");
  container.innerHTML = "";

  for (const member of app.members) {
    const fragment = template.content.cloneNode(true);
    const button = fragment.querySelector(".member-tab");
    const progress = memberProgress(member.id);

    button.dataset.memberId = member.id;
    button.classList.toggle("active", member.id === app.currentMemberId);
    button.prepend(createAvatar(member.id));
    fragment.querySelector(".member-name").textContent = member.name;
    fragment.querySelector(".member-seat").textContent = member.seat;
    fragment.querySelector(".member-count").textContent = `${progress.completed}/${progress.total}`;

    button.addEventListener("click", () => {
      clickSound();
      app.currentMemberId = member.id;
      persistCurrentMember();
      render();
    });

    container.appendChild(fragment);
  }
}

function renderMemberProgress() {
  const container = $("#memberProgress");
  container.innerHTML = "";

  for (const member of app.members) {
    const progress = memberProgress(member.id);
    const row = document.createElement("div");
    row.className = "member-row";
    row.classList.toggle("active", member.id === app.currentMemberId);
    row.appendChild(createAvatar(member.id));

    const name = document.createElement("strong");
    name.textContent = member.name;
    row.appendChild(name);

    const count = document.createElement("span");
    count.textContent = `${progress.completed}/${progress.total}`;
    row.appendChild(count);

    container.appendChild(row);
  }
}

async function saveAnswer(member, question, answer) {
  if (app.mode === "supabase") {
    await supabaseRequest(`${SUPABASE_TABLE}?on_conflict=member_id,question_id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        member_id: member.id,
        question_id: question.id,
        answer,
        updated_at: nowIso()
      })
    });

    await fetchSupabaseState();
    return;
  }

  if (app.mode === "backend") {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: member.id,
        questionId: question.id,
        answer
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Save failed.");
    }

    await fetchState();
    return;
  }

  app.state.answers[member.id][question.id] = {
    answer,
    updatedAt: nowIso()
  };
  app.state.updatedAt = nowIso();
  if (getProgress(app.state).complete) {
    app.state.markdownGeneratedAt = nowIso();
  }
  if (!persistLocalState()) {
    throw new Error("This browser is blocking local saved answers. Please allow local storage before continuing.");
  }
  app.progress = getProgress(app.state);
}

function savedPromptLabels(memberId) {
  return app.questions
    .map((question, index) => (isAnswered(memberId, question.id) ? `Prompt ${index + 1}` : null))
    .filter(Boolean);
}

function renderAnswerHelper(member) {
  const helper = document.createElement("div");
  helper.className = "panel answer-helper";

  const copy = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Before you begin";

  const title = document.createElement("h2");
  title.textContent = `Select yourself first. You are answering as ${member.name}.`;

  const note = document.createElement("p");
  if (app.mode === "supabase") {
    note.textContent = "Saved answers sync across browsers through the shared The Studio Deux Supabase project. Use Resubmit answer whenever you want to replace one.";
  } else if (app.mode === "static") {
    note.textContent = "Saved answers stay in this browser between sessions. Use Resubmit answer whenever you want to replace one.";
  } else {
    note.textContent = "Saved answers stay on the local backend. Use Resubmit answer whenever you want to replace one.";
  }

  copy.append(eyebrow, title, note);
  helper.appendChild(copy);

  const saved = document.createElement("div");
  saved.className = "saved-summary";
  const labels = savedPromptLabels(member.id);
  saved.textContent = labels.length ? `Saved: ${labels.join(", ")}` : "Saved: none yet";
  helper.appendChild(saved);

  return helper;
}

function renderQuestions() {
  const container = $("#questionStack");
  const template = $("#questionTemplate");
  const member = app.members.find((item) => item.id === app.currentMemberId);
  container.innerHTML = "";
  container.appendChild(renderAnswerHelper(member));

  for (const [index, question] of app.questions.entries()) {
    const fragment = template.content.cloneNode(true);
    const badge = fragment.querySelector(".saved-badge");
    const textarea = fragment.querySelector("textarea");
    const counter = fragment.querySelector(".counter");
    const saveButton = fragment.querySelector(".save-button");
    const answer = getAnswer(member.id, question.id);
    const hasSavedAnswer = answer.trim().length > 0;

    fragment.querySelector(".question-number").textContent = `${member.seat} / Prompt ${index + 1}`;
    fragment.querySelector(".question-title").textContent = question.title;
    fragment.querySelector(".question-prompt").textContent = question.prompt;
    textarea.value = answer;
    textarea.maxLength = app.answerLimit;

    const updateCounter = () => {
      const remaining = app.answerLimit - textarea.value.length;
      counter.textContent = `${remaining} characters left`;
      counter.classList.toggle("low", remaining <= 150);
    };

    const updateBadge = () => {
      const changed = textarea.value !== answer;
      const saved = hasSavedAnswer && !changed;
      const dirty = hasSavedAnswer && changed;
      badge.textContent = saved ? "Saved" : dirty ? "Unsaved changes" : "Unsaved";
      badge.classList.toggle("saved", saved);
      badge.classList.toggle("dirty", dirty);
      saveButton.textContent = hasSavedAnswer ? "Resubmit answer" : "Save answer";
    };

    textarea.addEventListener("input", () => {
      updateCounter();
      updateBadge();
    });
    saveButton.addEventListener("click", async () => {
      clickSound();
      saveButton.disabled = true;
      saveButton.textContent = "Saving";

      try {
        const before = app.progress.completed;
        await saveAnswer(member, question, textarea.value);
        const after = app.progress.completed;
        if (after > before || textarea.value.trim()) {
          chirpSound();
          triggerSoulSpin();
        }
        if (app.progress.complete && after >= before) completeSound();
        render();
      } catch (error) {
        $("#statusNote").textContent = error.message;
        saveButton.disabled = false;
        saveButton.textContent = hasSavedAnswer ? "Resubmit answer" : "Save answer";
      }
    });

    updateCounter();
    updateBadge();
    container.appendChild(fragment);
  }
}

function wireGlobalActions() {
  $("#markdownLink").addEventListener("click", () => clickSound());
}

function render() {
  renderMemberTabs();
  renderMemberProgress();
  renderQuestions();
  updateChrome();
}

async function startApp() {
  try {
    await fetchState();
    wireGlobalActions();
    render();
  } catch (error) {
    document.body.innerHTML = `<main class="panel intro-panel"><h1>Could not wake the soul app.</h1><p>${error.message}</p></main>`;
  }
}

function unlock() {
  sessionStorage.setItem(SESSION_KEY, "true");
  $("#loginGate").classList.add("hidden");
  clickSound();
  startApp();
}

function initLogin() {
  const gate = $("#loginGate");
  const input = $("#passwordInput");
  const button = $("#loginButton");
  const message = $("#loginMessage");

  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    gate.classList.add("hidden");
    startApp();
    return;
  }

  const attempt = () => {
    if (input.value === SOUL_PASSWORD) {
      unlock();
    } else {
      message.textContent = "That is not the soul key.";
      input.value = "";
      input.focus();
      clickSound();
    }
  };

  button.addEventListener("click", attempt);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") attempt();
  });
  input.focus();
}

initLogin();
