document.addEventListener('DOMContentLoaded', function() {

    // --- 設定値（ご自身のキーとURLに書き換えてください） ---
    const RECAPTCHA_SITE_KEY = '6LfgboIrAAAAACcypRg-zXsfGfu3n_XdwcqnEwt0';
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzr1417OIjQRPtSg4pXHt2v49Zhtw97BtG_hmXH5D8-tb_ceLprUTOzJ6irIRe7FdqfHw/exec';
    
    
    // --- ハンバーガーメニュー機能 ---
    const hamburger = document.getElementById('hamburger-menu');
    const nav = document.getElementById('header-nav');

    const toggleNav = () => {
        hamburger.classList.toggle('is-active');
        nav.classList.toggle('is-active');
        document.body.classList.toggle('nav-is-open');
    };

    if(hamburger && nav) {
        hamburger.addEventListener('click', toggleNav);
    }

    // --- スムーススクロール機能（ロゴクリック対応版） ---
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');

            if (document.body.classList.contains('nav-is-open')) {
                toggleNav();
            }

            if (href === '#') {
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 300);
                return;
            }

            const targetElement = document.getElementById(href.replace('#', ''));
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                setTimeout(() => {
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }, 300);
            }
        });
    });

    
    // --- お問い合わせフォームの送信処理 ---
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // デフォルトの送信をキャンセル
            
            const submitButton = document.getElementById('submit-button');
            submitButton.disabled = true;
            submitButton.innerHTML = '検証中...';

            // reCAPTCHA v3 を実行してトークンを取得
            grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: 'submit'}).then(function(token) {
                
                submitButton.innerHTML = '送信中...';
                
                const formData = new FormData(form);
                const jsonData = {};
                formData.forEach((value, key) => { jsonData[key] = value; });
                jsonData.recaptchaToken = token; // 取得したトークンをデータに追加

                // GASへデータを送信
                fetch(GAS_URL, {
                    method: 'POST',
                    body: JSON.stringify(jsonData),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'success') {
                        const successMessage = document.getElementById('success-message');
                        form.style.display = 'none';
                        successMessage.style.display = 'block';
                    } else {
                        // GAS側でエラーが起きた場合
                        throw new Error(data.message || 'Form submission on server failed');
                    }
                })
                .catch(error => {
                    // 通信エラーなどの場合
                    console.error('Submission Error:', error);
                    alert('送信に失敗しました。時間をおいて再度お試しください。');
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'まずは無料で<br>経営相談する';
                });
            }).catch(recaptchaError => {
                // reCAPTCHAの実行自体に失敗した場合
                console.error('reCAPTCHA Error:', recaptchaError);
                alert('reCAPTCHAの認証に失敗しました。ページを再読み込みしてお試しください。');
                submitButton.disabled = false;
                submitButton.innerHTML = 'まずは無料で<br>経営相談する';
            });
        });
    }

});