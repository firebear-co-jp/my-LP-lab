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

    
    // --- お問い合わせフォームの送信処理（CORS対応版） ---
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

                // CORSエラーを回避するため、JSONP風のアプローチを使用
                const url = new URL(GAS_URL);
                url.searchParams.append('callback', 'handleResponse');
                url.searchParams.append('data', JSON.stringify(jsonData));

                // 動的にスクリプトタグを作成してリクエスト
                const script = document.createElement('script');
                script.src = url.toString();
                
                // グローバルコールバック関数を定義
                window.handleResponse = function(response) {
                    console.log('GAS Response:', response);
                    
                    if (response && response.result === 'success') {
                        // 成功メッセージを表示
                        const successMessage = document.getElementById('success-message');
                        form.style.display = 'none';
                        successMessage.style.display = 'block';
                    } else {
                        throw new Error(response ? response.message : 'Unknown error');
                    }
                    
                    // ボタンを元に戻す
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                    
                    // スクリプトタグを削除
                    document.head.removeChild(script);
                    delete window.handleResponse;
                };
                
                // エラーハンドリング
                script.onerror = function() {
                    console.error('Script loading error');
                    
                    // フォールバック: メール送信に切り替え
                    if (confirm('自動送信に失敗しました。メールクライアントで送信しますか？')) {
                        sendEmailFallback(formData);
                    } else {
                        alert('送信をキャンセルしました。');
                    }
                    
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                    document.head.removeChild(script);
                    delete window.handleResponse;
                };
                
                // タイムアウト設定
                setTimeout(() => {
                    if (window.handleResponse) {
                        console.error('Request timeout');
                        
                        // フォールバック: メール送信に切り替え
                        if (confirm('送信がタイムアウトしました。メールクライアントで送信しますか？')) {
                            sendEmailFallback(formData);
                        } else {
                            alert('送信をキャンセルしました。');
                        }
                        
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalText;
                        if (document.head.contains(script)) {
                            document.head.removeChild(script);
                        }
                        delete window.handleResponse;
                    }
                }, 10000); // 10秒でタイムアウト
                
                document.head.appendChild(script);
                
            }).catch(recaptchaError => {
                // reCAPTCHAの実行自体に失敗した場合
                console.error('reCAPTCHA Error:', recaptchaError);
                alert('reCAPTCHAの認証に失敗しました。ページを再読み込みしてお試しください。');
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            });
        });
    }

    // フォールバック用のメール送信関数
    function sendEmailFallback(formData) {
        const companyName = formData.get('companyName');
        const userName = formData.get('userName');
        const email = formData.get('email');
        const message = formData.get('message');

        const mailtoLink = `mailto:your-email@example.com?subject=お問い合わせ：${encodeURIComponent(companyName)}&body=${encodeURIComponent(`
会社名：${companyName}
ご担当者様名：${userName}
メールアドレス：${email}

ご相談内容：
${message}
        `)}`;

        window.location.href = mailtoLink;
    }

});