import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/api";

const STATIC_CAPTCHA = import.meta.env.VITE_CAPTCHA_TEXT || "12345";
const MAX_ATTEMPTS = 3;

const Captcha = ({ value, onChange, onTokenChange }) => {
  const [captchaText, setCaptchaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  
  // Use refs to store callbacks to avoid infinite loops
  const onTokenChangeRef = useRef(onTokenChange);
  const onChangeRef = useRef(onChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onChangeRef.current = onChange;
  }, [onTokenChange, onChange]);

  const loadCaptcha = useCallback(async () => {
    setLoading(true);
    setError("");
    // Clear the input when refreshing
    if (onChangeRef.current) {
      onChangeRef.current("");
    }

    let attempt = 0;
    let fetched = false;

    while (attempt < MAX_ATTEMPTS && !fetched) {
      try {
        const response = await apiClient.get("/auth/captcha", {
          params: { t: Date.now() },
        });
        const nextCaptcha = response?.data?.captcha;
        const token = response?.data?.token;
        if (typeof nextCaptcha === "string" && nextCaptcha.trim().length > 0 && token) {
          setCaptchaText(nextCaptcha.trim());
          if (onTokenChangeRef.current) {
            onTokenChangeRef.current(token);
          }
          setIsFallback(false);
          fetched = true;
        } else {
          throw new Error("Empty captcha or missing token");
        }
      } catch (err) {
        console.warn("Captcha fetch failed", err);
        attempt += 1;
        if (attempt >= MAX_ATTEMPTS) {
          setCaptchaText(STATIC_CAPTCHA);
          if (onTokenChangeRef.current) {
            onTokenChangeRef.current("");
          }
          setIsFallback(true);
          setError("Using fallback code. Click refresh to try again.");
        } else {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }

    setLoading(false);
  }, []); // Empty dependency array - callbacks are accessed via refs

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]); // loadCaptcha is stable (empty deps), so this is safe

  const displayText = loading ? "Loading..." : (captchaText || STATIC_CAPTCHA);

  return (
    <div className="captcha-field">
      <label htmlFor="captcha">Security Check</label>
      <div className="captcha-display">
        <span className="captcha-code" title="Enter this code below">
          {displayText}
        </span>
        <button
          type="button"
          className="captcha-refresh"
          onClick={loadCaptcha}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>
      {error && <small className="captcha-error">{error}</small>}
      {isFallback && !error && (
        <small className="captcha-warning">⚠️ Using fallback code. Click refresh to get the correct code.</small>
      )}
      <label htmlFor="captcha-input">
        <small style={{ color: "#64748b", marginBottom: "0.25rem", display: "block" }}>
          Enter the code shown above: <strong>{displayText}</strong>
        </small>
        <input
          id="captcha-input"
          name="captcha"
          type="text"
          placeholder={`Enter: ${displayText}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete="off"
        />
      </label>
    </div>
  );
};

export default Captcha;

