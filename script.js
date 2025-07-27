document.addEventListener('DOMContentLoaded', function() {

    // --- 設定値（ご自身のキーとURLに書き換えてください） ---
    const RECAPTCHA_SITE_KEY = '6LfgboIrAAAAACcypRg-zXsfGfu3n_XdwcqnEwt0';
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzI5IARlTFDjVg6XUEzn1tSQ_c2DtD05tnlQKOJn4RvNFhHMfwyUyXINZgbOP-gnxPH/exec';
    
    
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

    
    // --- お問い合わせフォームの送信処理（スプレッドシート連携版） ---
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // デフォルトの送信をキャンセル
            
            const submitButton = document.getElementById('submit-button');
            const originalText = submitButton.innerHTML;
            
            submitButton.disabled = true;
            submitButton.innerHTML = '検証中...';

            // reCAPTCHA v3 を実行してトークンを取得
            grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: 'submit'}).then(function(token) {
                
                submitButton.innerHTML = '送信中...';
                
                const formData = new FormData(form);
                const jsonData = {};
                formData.forEach((value, key) => { jsonData[key] = value; });
                jsonData.recaptchaToken = token; // 取得したトークンをデータに追加
                jsonData.timestamp = new Date().toISOString(); // 送信日時を追加

                // GASへデータを送信
                fetch(GAS_URL, {
                    method: 'POST',
                    body: JSON.stringify(jsonData),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text(); // JSONではなくテキストとして取得
                })
                .then(data => {
                    console.log('GAS Response:', data);
                    
                    // 成功メッセージを表示
                    const successMessage = document.getElementById('success-message');
                    form.style.display = 'none';
                    successMessage.style.display = 'block';
                    
                    // ボタンを元に戻す
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                })
                .catch(error => {
                    // 通信エラーなどの場合
                    console.error('Submission Error:', error);
                    alert('送信に失敗しました。時間をおいて再度お試しください。\n\nエラー詳細: ' + error.message);
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                });
            }).catch(recaptchaError => {
                // reCAPTCHAの実行自体に失敗した場合
                console.error('reCAPTCHA Error:', recaptchaError);
                alert('reCAPTCHAの認証に失敗しました。ページを再読み込みしてお試しください。');
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            });
        });
    }

});