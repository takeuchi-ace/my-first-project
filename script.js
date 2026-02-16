// ========================================
// 外車物損専門 LP - Script
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // --- スムーススクロール ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      const navHeight = document.querySelector('.nav').offsetHeight;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });

      // モバイルメニューを閉じる
      document.getElementById('navLinks').classList.remove('active');
    });
  });

  // --- モバイルナビゲーション ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // --- スクロールフェードイン ---
  const fadeElements = document.querySelectorAll('.fade-in');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => fadeObserver.observe(el));

  // --- 固定CTA表示制御 ---
  const fixedCta = document.getElementById('fixedCta');
  const heroSection = document.getElementById('hero');

  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        fixedCta.classList.remove('visible');
      } else {
        fixedCta.classList.add('visible');
      }
    });
  }, { threshold: 0.3 });

  ctaObserver.observe(heroSection);

  // --- フォームバリデーション ---
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  const validators = {
    name: {
      validate: (value) => value.trim().length > 0,
      message: 'お名前を入力してください。'
    },
    email: {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '有効なメールアドレスを入力してください。'
    },
    phone: {
      validate: (value) => /^[\d\-+()]{8,}$/.test(value.replace(/\s/g, '')),
      message: '有効な電話番号を入力してください。'
    },
    issue: {
      validate: (value) => value.trim().length >= 10,
      message: 'ご相談内容を10文字以上で入力してください。'
    },
    privacy: {
      validate: () => document.getElementById('privacy').checked,
      message: 'プライバシーポリシーへの同意が必要です。'
    }
  };

  function showError(fieldName, message) {
    const errorEl = document.getElementById(fieldName + 'Error');
    const inputEl = document.getElementById(fieldName);
    if (errorEl) errorEl.textContent = message;
    if (inputEl && inputEl.type !== 'checkbox') inputEl.classList.add('error');
  }

  function clearError(fieldName) {
    const errorEl = document.getElementById(fieldName + 'Error');
    const inputEl = document.getElementById(fieldName);
    if (errorEl) errorEl.textContent = '';
    if (inputEl && inputEl.type !== 'checkbox') inputEl.classList.remove('error');
  }

  // リアルタイムバリデーション
  Object.keys(validators).forEach(fieldName => {
    const inputEl = document.getElementById(fieldName);
    if (!inputEl) return;

    const eventType = inputEl.type === 'checkbox' ? 'change' : 'blur';
    inputEl.addEventListener(eventType, () => {
      const value = inputEl.type === 'checkbox' ? '' : inputEl.value;
      if (validators[fieldName].validate(value)) {
        clearError(fieldName);
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;

    // 全フィールドチェック
    Object.keys(validators).forEach(fieldName => {
      const inputEl = document.getElementById(fieldName);
      const value = inputEl.type === 'checkbox' ? '' : inputEl.value;

      if (!validators[fieldName].validate(value)) {
        showError(fieldName, validators[fieldName].message);
        isValid = false;
      } else {
        clearError(fieldName);
      }
    });

    if (isValid) {
      // デモ：送信成功表示
      form.querySelector('.form-grid').style.display = 'none';
      form.querySelector('.form-actions').style.display = 'none';
      formSuccess.classList.add('show');

      // ページ上部へスクロール（フォーム位置）
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});
