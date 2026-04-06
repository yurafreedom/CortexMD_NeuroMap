'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Stethoscope, Mail, ArrowLeft, Eye, EyeOff, Dice5, Copy, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { generatePassphrase } from '@/lib/passphrase';

type AuthStep =
  | 'role'
  | 'method'
  | 'password'
  | 'signin'
  | 'confirm'
  | 'onboarding';
type UserRole = 'patient' | 'doctor';

export default function AuthPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    profile,
    signInWithGoogle,
    signUpWithPassword,
    signInWithPassword,
    signInWithEmail,
    updateProfile,
  } = useAuth();

  const [step, setStep] = useState<AuthStep>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passphraseLen, setPassphraseLen] = useState(4);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect if already authed
  useEffect(() => {
    if (!authLoading && user) {
      if (!profile.onboarded) {
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setStep('onboarding');
      } else {
        router.push('/');
      }
    }
  }, [authLoading, user, profile, router]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSelectRole = (r: UserRole) => {
    setRole(r);
    setStep('method');
    setError('');
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка OAuth');
    }
  };

  const handleEmailContinue = () => {
    if (!email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    if (isSignIn) {
      setStep('signin');
    } else {
      setStep('password');
    }
  };

  const handleGeneratePassphrase = () => {
    const pp = generatePassphrase(passphraseLen);
    setPassword(pp);
    setPasswordConfirm(pp);
    setShowPw(true);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    if (password.length < 6) {
      setError('Минимум 6 символов');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (!agreed) {
      setError('Необходимо принять Политику конфиденциальности');
      return;
    }
    setBusy(true);
    try {
      await signUpWithPassword(email, password, {
        firstName,
        lastName,
        role: role || 'patient',
      });
      setStep('confirm');
      setResendTimer(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка регистрации');
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Введите пароль');
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(email, password);
      router.push('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Неверный пароль');
    } finally {
      setBusy(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;
    try {
      await signInWithEmail(email);
      setResendTimer(60);
    } catch {
      setError('Ошибка отправки');
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        role: role || 'patient',
        onboarded: true,
      });
      router.push('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-loader">
          <Loader2 size={24} className="auth-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="auth-header">
        <div className="auth-logo">CortexMD</div>
      </header>

      {/* Form */}
      <main className="auth-main">
        <div className="auth-form-container">
          {/* Step 0: Role selection */}
          {step === 'role' && (
            <div className="auth-step">
              <h2 className="auth-title">Добро пожаловать</h2>
              <p className="auth-subtitle">Выберите вашу роль</p>
              <div className="auth-role-grid">
                <button
                  className={`role-card${role === 'patient' ? ' selected' : ''}`}
                  onClick={() => handleSelectRole('patient')}
                >
                  <div className="role-card-inner">
                    <User size={32} strokeWidth={1.5} />
                    <span className="role-label">Я пациент</span>
                    <span className="role-desc">
                      Отслеживание схемы лечения
                    </span>
                  </div>
                </button>
                <button
                  className={`role-card${role === 'doctor' ? ' selected' : ''}`}
                  onClick={() => handleSelectRole('doctor')}
                >
                  <div className="role-card-inner">
                    <Stethoscope size={32} strokeWidth={1.5} />
                    <span className="role-label">Я врач</span>
                    <span className="role-desc">
                      Фармакологический анализ
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Method selection */}
          {step === 'method' && (
            <div className="auth-step">
              <button
                className="auth-back"
                onClick={() => {
                  setStep('role');
                  setError('');
                }}
              >
                <ArrowLeft size={16} /> Назад
              </button>
              <h2 className="auth-title">
                {isSignIn ? 'Войти' : 'Создать аккаунт'}
              </h2>
              <p className="auth-subtitle">
                {isSignIn
                  ? 'Введите email для входа'
                  : 'Выберите способ регистрации'}
              </p>

              <button className="auth-btn-oauth" onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Продолжить с Google
              </button>

              <div className="auth-divider">
                <span>или</span>
              </div>

              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  autoFocus
                />
              </div>

              <button
                className="auth-btn-primary"
                onClick={handleEmailContinue}
              >
                Продолжить
              </button>

              {error && <div className="auth-error">{error}</div>}

              <div className="auth-switch">
                {isSignIn ? (
                  <>
                    Нет аккаунта?{' '}
                    <button onClick={() => setIsSignIn(false)}>
                      Зарегистрироваться
                    </button>
                  </>
                ) : (
                  <>
                    Уже есть аккаунт?{' '}
                    <button onClick={() => setIsSignIn(true)}>Войти</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Password (Sign Up) */}
          {step === 'password' && (
            <form className="auth-step" onSubmit={handleSignUp}>
              <button
                type="button"
                className="auth-back"
                onClick={() => {
                  setStep('method');
                  setError('');
                }}
              >
                <ArrowLeft size={16} /> {email}
              </button>
              <h2 className="auth-title">Создание аккаунта</h2>

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Имя</label>
                  <input
                    className="auth-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                    autoFocus
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Фамилия</label>
                  <input
                    className="auth-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Пароль</label>
                <div className="auth-pw-row">
                  <div className="auth-pw-wrap">
                    <input
                      className="auth-input"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                    />
                    <button
                      type="button"
                      className="auth-pw-toggle"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="auth-btn-gen"
                    onClick={handleGeneratePassphrase}
                    title="Сгенерировать passphrase"
                  >
                    <Dice5 size={16} />
                  </button>
                </div>
              </div>

              {/* Passphrase controls */}
              {showPw && password.includes('-') && (
                <div className="passphrase-box">
                  <span className="passphrase-text">{password}</span>
                  <div className="passphrase-actions">
                    <select
                      className="passphrase-len"
                      value={passphraseLen}
                      onChange={(e) => {
                        setPassphraseLen(Number(e.target.value));
                        const pp = generatePassphrase(Number(e.target.value));
                        setPassword(pp);
                        setPasswordConfirm(pp);
                      }}
                    >
                      <option value={3}>3 слова</option>
                      <option value={4}>4 слова</option>
                      <option value={5}>5 слов</option>
                      <option value={6}>6 слов</option>
                    </select>
                    <button
                      type="button"
                      className="passphrase-copy"
                      onClick={handleCopyPassword}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Подтвердите пароль</label>
                <input
                  className="auth-input"
                  type={showPw ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                />
              </div>

              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  Я согласен с{' '}
                  <a href="/privacy" target="_blank">
                    Политикой конфиденциальности
                  </a>
                </span>
              </label>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={busy}
              >
                {busy ? (
                  <Loader2 size={18} className="auth-spinner" />
                ) : (
                  'Создать аккаунт'
                )}
              </button>

              {error && <div className="auth-error">{error}</div>}
            </form>
          )}

          {/* Step 2: Sign In */}
          {step === 'signin' && (
            <form className="auth-step" onSubmit={handleSignIn}>
              <button
                type="button"
                className="auth-back"
                onClick={() => {
                  setStep('method');
                  setError('');
                }}
              >
                <ArrowLeft size={16} /> {email}
              </button>
              <h2 className="auth-title">Вход</h2>

              <div className="auth-field">
                <label className="auth-label">Пароль</label>
                <div className="auth-pw-wrap">
                  <input
                    className="auth-input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={busy}
              >
                {busy ? (
                  <Loader2 size={18} className="auth-spinner" />
                ) : (
                  'Войти'
                )}
              </button>

              {error && <div className="auth-error">{error}</div>}
            </form>
          )}

          {/* Step 2b: Email confirmation */}
          {step === 'confirm' && (
            <div className="auth-step auth-step-center">
              <div className="auth-confirm-icon">
                <Mail size={40} strokeWidth={1.5} />
              </div>
              <h2 className="auth-title">Проверьте почту</h2>
              <p className="auth-subtitle">
                Мы отправили письмо на{' '}
                <strong style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {email}
                </strong>
              </p>
              <p className="auth-subtitle">
                Нажмите ссылку в письме для подтверждения
              </p>
              <button
                className="auth-btn-secondary"
                onClick={handleResendEmail}
                disabled={resendTimer > 0}
              >
                {resendTimer > 0
                  ? `Отправить повторно (${resendTimer}с)`
                  : 'Отправить повторно'}
              </button>
            </div>
          )}

          {/* Step 3: Onboarding */}
          {step === 'onboarding' && (
            <form className="auth-step" onSubmit={handleOnboarding}>
              <h2 className="auth-title">
                {firstName ? 'Подтвердите данные' : 'Как вас зовут?'}
              </h2>
              <p className="auth-subtitle">
                {firstName
                  ? 'Проверьте правильность данных из вашего аккаунта'
                  : 'Заполните профиль для начала работы'}
              </p>

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Имя</label>
                  <input
                    className="auth-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                    autoFocus
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Фамилия</label>
                  <input
                    className="auth-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={busy}
              >
                {busy ? (
                  <Loader2 size={18} className="auth-spinner" />
                ) : firstName ? (
                  'Всё верно'
                ) : (
                  'Продолжить'
                )}
              </button>

              {error && <div className="auth-error">{error}</div>}
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <p>
          &copy; 2026 CortexMD &middot;{' '}
          <a href="/privacy">Политика конфиденциальности</a>
        </p>
        <p className="auth-footer-sub">Ваши данные защищены шифрованием</p>
      </footer>
    </div>
  );
}
