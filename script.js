document.addEventListener('DOMContentLoaded', function() {

    // --- 設定値（Formspreeのエンドポイントに変更） ---
    const RECAPTCHA_SITE_KEY = '6LfgboIrAAAAACcypRg-zXsfGfu3n_XdwcqnEwt0';
    const FORMSPREE_URL = 'https://formspree.io/f/YOUR_FORM_ID'; // ここにFormspreeのエンドポイントを設定
    
    
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

    
    // --- お問い合わせフォームの送信処理（メール送信版） ---
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // デフォルトの送信をキャンセル
            
            const submitButton = document.getElementById('submit-button');
            const originalText = submitButton.innerHTML;
            
            submitButton.disabled = true;
            submitButton.innerHTML = '送信中...';

            // フォームデータを取得
            const formData = new FormData(form);
            
            // メール送信を実行
            sendEmailFallback(formData);
            
            // 成功メッセージを表示
            setTimeout(() => {
                const successMessage = document.getElementById('success-message');
                form.style.display = 'none';
                successMessage.style.display = 'block';
                
                // ボタンを元に戻す
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }, 1000);
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