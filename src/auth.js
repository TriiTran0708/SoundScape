import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL =
  window.__SUPABASE_URL__ ||
  (import.meta?.env?.VITE_SUPABASE_URL) ||
  "";
const SUPA_KEY =
  window.__SUPABASE_ANON_KEY__ ||
  (import.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
  "";

const sb = SUPA_URL && SUPA_KEY ? createClient(SUPA_URL, SUPA_KEY) : null;

const $ = (s) => document.querySelector(s);
const errEl = $("#error");
const heading = $("#heading");
const submitBtn = $("#submitBtn");
const switchText = $("#switchText");
const form = $("#authForm");

let mode = "signin";

function setMode(next) {
  mode = next;
  heading.textContent = mode === "signin" ? "Welcome back" : "Create your account";
  submitBtn.value = mode === "signin" ? "Sign In" : "Sign Up";
  switchText.innerHTML =
    mode === "signin"
      ? `New here? <a href="#" id="switchLink">Create an account</a>`
      : `Already have one? <a href="#" id="switchLink">Sign in</a>`;
  $("#switchLink").addEventListener("click", (e) => {
    e.preventDefault();
    setMode(mode === "signin" ? "signup" : "signin");
  });
  setError("");
}

function setError(msg) {
  errEl.textContent = msg || "";
  errEl.classList.toggle("visible", !!msg);
}

function humanizeAuthError(err) {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("provider is not enabled")) {
    return "Google sign-in chưa được bật. Vào Supabase → Authentication → Providers → bật Google rồi thêm Client ID/Secret.";
  }
  if (m.includes("invalid login")) return "Email hoặc mật khẩu không đúng.";
  if (m.includes("user already registered")) return "Email này đã được đăng ký. Hãy đăng nhập.";
  if (m.includes("email not confirmed")) return "Bạn cần xác nhận email trước khi đăng nhập.";
  if (m.includes("password should be")) return "Mật khẩu tối thiểu 6 ký tự.";
  return err?.message || "Đã có lỗi xảy ra.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");

  if (!sb) {
    setError("Supabase chưa được cấu hình. Kiểm tra biến môi trường VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
    return;
  }

  submitBtn.disabled = true;
  const email = $("#email").value.trim();
  const password = $("#password").value;

  try {
    if (mode === "signup") {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
    window.location.href = "/";
  } catch (err) {
    setError(humanizeAuthError(err));
  } finally {
    submitBtn.disabled = false;
  }
});

export async function signInWithGoogle() {
  if (!sb) return { error: new Error("Supabase chưa cấu hình.") };

  const redirectTo = `${window.location.origin}/`;
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    if ((error.message || "").toLowerCase().includes("provider is not enabled")) {
      return {
        error: new Error("Google OAuth chưa bật. Vào Supabase → Authentication → Providers → Google và thêm Client ID/Secret."),
      };
    }
    return { error };
  }

  return { error: null };
}

try {
  const email = new URLSearchParams(window.location.search).get("email");
  if (email) $("#email").value = email;
} catch (_) {}

setMode("signin");
