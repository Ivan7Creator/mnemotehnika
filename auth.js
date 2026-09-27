const SUPABASE_URL = "https://hrmbohnxpfealdogrwwa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SMjKErpKD_23mDZPVOgw1Q_zxC9uRSS";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const accountButton = document.getElementById("account-button");
const authDialog = document.getElementById("auth-dialog");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authNameField = document.getElementById("auth-name-field");
const authName = document.getElementById("auth-name");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const authSubmit = document.getElementById("auth-submit");
const authSwitch = document.getElementById("auth-switch");
const authSignout = document.getElementById("auth-signout");
const authClose = document.getElementById("auth-close");
const authAdmin = document.getElementById("auth-admin");
const adminDialog = document.getElementById("admin-dialog");
const adminClose = document.getElementById("admin-close");
const adminMessage = document.getElementById("admin-message");
const adminSummary = document.getElementById("admin-summary");
const adminUsers = document.getElementById("admin-users");

let authMode = "login";
let currentUser = null;
let currentRole = "user";

window.mnemonicAuth = {
  client: supabaseClient,
  getUser: () => currentUser,
};

accountButton.addEventListener("click", () => {
  renderAuthState();
  authDialog.showModal();
});
authClose.addEventListener("click", () => authDialog.close());
adminClose.addEventListener("click", () => adminDialog.close());
authAdmin.addEventListener("click", () => {
  authDialog.close();
  adminDialog.showModal();
  loadAdminDashboard();
});
authSwitch.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  authMessage.textContent = "";
  renderAuthState();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  authSubmit.disabled = true;

  try {
    if (authMode === "register") {
      const { data, error } = await supabaseClient.auth.signUp({
        email: authEmail.value.trim(),
        password: authPassword.value,
        options: { data: { display_name: authName.value.trim() } },
      });
      if (error) throw error;
      if (!data.session) {
        authMessage.textContent = "Проверь почту и подтверди регистрацию.";
        authMessage.className = "auth-message ok";
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: authEmail.value.trim(),
        password: authPassword.value,
      });
      if (error) throw error;
      authDialog.close();
    }
  } catch (error) {
    authMessage.textContent = authErrorText(error);
    authMessage.className = "auth-message";
  } finally {
    authSubmit.disabled = false;
  }
});

authSignout.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  authDialog.close();
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  currentRole = "user";
  renderAuthState();
  window.dispatchEvent(new CustomEvent("mnemonic-auth-changed", { detail: { user: currentUser } }));
  if (currentUser) setTimeout(refreshCurrentRole, 0);
});

supabaseClient.auth.getSession().then(({ data }) => {
  currentUser = data.session?.user || null;
  renderAuthState();
  if (currentUser) refreshCurrentRole();
});

function renderAuthState() {
  if (!authMessage.textContent) authMessage.className = "auth-message";
  if (currentUser) {
    const name = currentUser.user_metadata?.display_name || currentUser.email || "Аккаунт";
    accountButton.textContent = name;
    authTitle.textContent = name;
    authSubtitle.textContent = currentUser.email || "Вы вошли в аккаунт.";
    authNameField.hidden = true;
    authEmail.closest("label").hidden = true;
    authPassword.closest("label").hidden = true;
    authSubmit.hidden = true;
    authSwitch.hidden = true;
    authAdmin.hidden = currentRole !== "admin";
    authSignout.hidden = false;
    return;
  }

  accountButton.textContent = "Войти";
  const registering = authMode === "register";
  authTitle.textContent = registering ? "Регистрация" : "Вход";
  authSubtitle.textContent = registering
    ? "Создай аккаунт, чтобы сохранять прогресс."
    : "Войди, чтобы продолжить тренировки.";
  authNameField.hidden = !registering;
  authEmail.closest("label").hidden = false;
  authPassword.closest("label").hidden = false;
  authPassword.autocomplete = registering ? "new-password" : "current-password";
  authSubmit.textContent = registering ? "Зарегистрироваться" : "Войти";
  authSubmit.hidden = false;
  authSwitch.textContent = registering
    ? "Уже есть аккаунт? Войти"
    : "Нет аккаунта? Зарегистрироваться";
  authSwitch.hidden = false;
  authAdmin.hidden = true;
  authSignout.hidden = true;
}

async function refreshCurrentRole() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (error) {
    console.error("Не удалось проверить роль:", error.message);
    return;
  }
  currentRole = data?.role || "user";
  renderAuthState();
}

async function loadAdminDashboard() {
  adminMessage.textContent = "Загружаю пользователей…";
  adminMessage.className = "auth-message ok";
  adminSummary.textContent = "";
  adminUsers.innerHTML = "";

  const [profilesResult, attemptsResult] = await Promise.all([
    supabaseClient.from("profiles").select("id, email, display_name, role, created_at").order("created_at"),
    supabaseClient.from("attempts").select("user_id, success, created_at").order("created_at", { ascending: false }),
  ]);

  const error = profilesResult.error || attemptsResult.error;
  if (error) {
    adminMessage.textContent = `Не удалось загрузить данные: ${error.message}`;
    adminMessage.className = "auth-message";
    return;
  }

  const profiles = profilesResult.data || [];
  const attempts = attemptsResult.data || [];
  const statsByUser = new Map();
  attempts.forEach((attempt) => {
    const stats = statsByUser.get(attempt.user_id) || { attempts: 0, correct: 0, lastAt: null };
    stats.attempts += 1;
    if (attempt.success) stats.correct += 1;
    if (!stats.lastAt) stats.lastAt = attempt.created_at;
    statsByUser.set(attempt.user_id, stats);
  });

  adminMessage.textContent = "";
  adminSummary.textContent = `Пользователей: ${profiles.length} · Попыток: ${attempts.length}`;
  profiles.forEach((profile) => {
    const stats = statsByUser.get(profile.id) || { attempts: 0, correct: 0, lastAt: null };
    const accuracy = stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0;
    const card = document.createElement("article");
    card.className = "admin-user";

    const identity = document.createElement("div");
    identity.className = "admin-user-identity";
    const name = document.createElement("strong");
    name.textContent = profile.display_name || "Без имени";
    const email = document.createElement("span");
    email.textContent = profile.email || "Email не указан";
    identity.append(name, email);
    if (profile.role === "admin") {
      const role = document.createElement("small");
      role.className = "admin-role";
      role.textContent = "Администратор";
      identity.appendChild(role);
    }

    card.append(
      identity,
      adminStat("Попытки", stats.attempts),
      adminStat("Точность", `${accuracy}%`),
      adminStat("Последняя", stats.lastAt ? formatAdminDate(stats.lastAt) : "—"),
    );
    adminUsers.appendChild(card);
  });
}

function adminStat(label, value) {
  const item = document.createElement("div");
  item.className = "admin-stat";
  const number = document.createElement("strong");
  number.textContent = value;
  const caption = document.createElement("span");
  caption.textContent = label;
  item.append(number, caption);
  return item;
}

function formatAdminDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function authErrorText(error) {
  const message = String(error?.message || "Не удалось выполнить запрос.");
  if (message.includes("Invalid login credentials")) return "Неверный email или пароль.";
  if (message.includes("already registered")) return "Пользователь с таким email уже зарегистрирован.";
  if (message.includes("Password should be")) return "Пароль должен содержать не меньше 6 символов.";
  return message;
}
