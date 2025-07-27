document.addEventListener('DOMContentLoaded', function() {

    // --- 設定値（Google Apps ScriptのURLを設定） ---
    const RECAPTCHA_SITE_KEY = '6LfgboIrAAAAACcypRg-zXsfGfu3n_XdwcqnEwt0';
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwyQIBIqjryiTBcrw0CWy0inoXPHlTS3IrX1g-dYmoSogviy4Qkt_TrqOBqCrBhEWGI/exec';
    
    
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
        // GAS接続テストを実行
        testGASConnection();
        
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
                    // 成功時：メール送信を無効化（スプレッドシートのみ）
                    // sendEmail(companyName, userName, email, message);
                    
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
                    
                    // エラー時：メール送信を無効化（スプレッドシートのみ）
                    // sendEmail(companyName, userName, email, message);
                    
                    // エラーメッセージを表示
                    alert('送信に失敗しました。時間をおいて再度お試しください。');
                    
                    // ボタンを元に戻す
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
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

            console.log('Attempting to save to spreadsheet:', data);
            console.log('GAS URL:', GAS_URL);

            // JSONP風のアプローチでGASに送信
            const url = new URL(GAS_URL);
            url.searchParams.append('callback', 'spreadsheetCallback');
            url.searchParams.append('data', JSON.stringify(data));

            console.log('Full URL:', url.toString());

            const script = document.createElement('script');
            script.src = url.toString();
            
            window.spreadsheetCallback = function(response) {
                console.log('Spreadsheet save response:', response);
                if (response && response.result === 'success') {
                    console.log('✅ Spreadsheet save successful');
                    resolve(response);
                } else {
                    console.error('❌ Spreadsheet save failed:', response);
                    reject(new Error(response ? response.message : 'Unknown error'));
                }
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                delete window.spreadsheetCallback;
            };
            
            script.onerror = function() {
                console.error('❌ Script loading failed - GAS URL may be incorrect');
                reject(new Error('Script loading failed'));
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                delete window.spreadsheetCallback;
            };
            
            // タイムアウト設定
            setTimeout(() => {
                if (window.spreadsheetCallback) {
                    console.error('❌ Request timeout - GAS may not be responding');
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

    // GAS接続テスト関数
    function testGASConnection() {
        console.log('🔍 Testing GAS connection...');
        console.log('GAS URL:', GAS_URL);
        
        const testUrl = new URL(GAS_URL);
        testUrl.searchParams.append('callback', 'testCallback');
        testUrl.searchParams.append('test', 'true');
        
        const testScript = document.createElement('script');
        testScript.src = testUrl.toString();
        
        window.testCallback = function(response) {
            console.log('✅ GAS Connection Test - Success:', response);
            delete window.testCallback;
        };
        
        testScript.onerror = function() {
            console.error('❌ GAS Connection Test - Failed');
            console.error('Please check your Google Apps Script configuration');
            delete window.testCallback;
        };
        
        setTimeout(() => {
            if (window.testCallback) {
                console.error('❌ GAS Connection Test - Timeout');
                delete window.testCallback;
            }
        }, 5000);
        
        document.head.appendChild(testScript);
    }

});