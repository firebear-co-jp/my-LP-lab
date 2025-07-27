document.addEventListener('DOMContentLoaded', function() {

    // --- 設定値（Google Apps ScriptのURLを設定） ---
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
            submitButton.innerHTML = '送信中...';

            // フォームデータを取得
            const companyName = document.getElementById('company-name').value || '';
            const userName = document.getElementById('user-name').value || '';
            const email = document.getElementById('email').value || '';
            const message = document.getElementById('message').value || '';

            // スプレッドシートにデータを保存
            saveToSpreadsheet(companyName, userName, email, message)
                .then(() => {
                    // 成功時：メールクライアントも開く
                    sendEmail(companyName, userName, email, message);
                    
                    // 成功メッセージを表示
                    setTimeout(() => {
                        const successMessage = document.getElementById('success-message');
                        if (successMessage) {
                            form.style.display = 'none';
                            successMessage.style.display = 'block';
                        }
                        
                        // ボタンを元に戻す
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalText;
                    }, 1000);
                })
                .catch((error) => {
                    console.error('Spreadsheet save error:', error);
                    
                    // エラー時：メール送信のみ実行
                    sendEmail(companyName, userName, email, message);
                    
                    // 成功メッセージを表示（メール送信は成功したため）
                    setTimeout(() => {
                        const successMessage = document.getElementById('success-message');
                        if (successMessage) {
                            form.style.display = 'none';
                            successMessage.style.display = 'block';
                        }
                        
                        // ボタンを元に戻す
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalText;
                    }, 1000);
                });
        });
    }

    // スプレッドシートにデータを保存する関数
    function saveToSpreadsheet(companyName, userName, email, message) {
        return new Promise((resolve, reject) => {
            const data = {
                timestamp: new Date().toISOString(),
                companyName: companyName,
                userName: userName,
                email: email,
                message: message
            };

            // JSONP風のアプローチでGASに送信
            const url = new URL(GAS_URL);
            url.searchParams.append('callback', 'spreadsheetCallback');
            url.searchParams.append('data', JSON.stringify(data));

            const script = document.createElement('script');
            script.src = url.toString();
            
            window.spreadsheetCallback = function(response) {
                console.log('Spreadsheet save response:', response);
                if (response && response.result === 'success') {
                    resolve(response);
                } else {
                    reject(new Error(response ? response.message : 'Unknown error'));
                }
                document.head.removeChild(script);
                delete window.spreadsheetCallback;
            };
            
            script.onerror = function() {
                reject(new Error('Script loading failed'));
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                delete window.spreadsheetCallback;
            };
            
            // タイムアウト設定
            setTimeout(() => {
                if (window.spreadsheetCallback) {
                    reject(new Error('Request timeout'));
                    if (document.head.contains(script)) {
                        document.head.removeChild(script);
                    }
                    delete window.spreadsheetCallback;
                }
            }, 10000);
            
            document.head.appendChild(script);
        });
    }

    // メール送信関数
    function sendEmail(companyName, userName, email, message) {
        const mailtoLink = `mailto:takayuki.sase@firebear.co.jp?subject=お問い合わせ：${encodeURIComponent(companyName)}&body=${encodeURIComponent(`
会社名：${companyName}
ご担当者様名：${userName}
メールアドレス：${email}

ご相談内容：
${message}
        `)}`;

        window.location.href = mailtoLink;
    }

});