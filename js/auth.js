emailjs.init("YOUR_PUBLIC_KEY"); // Ganti dengan EmailJS Public Key

let currentUser = null;
let otpSent = null;

function showLogin() {
    document.getElementById("landing").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
}

function showRegister() {
    alert("Gunakan email valid, sistem akan kirim OTP.");
    showLogin();
}

function startDemo() {
    currentUser = { email: "demo@metanexus.ai", demo: true };
    document.getElementById("landing").classList.add("hidden");
    document.getElementById("game-dashboard").classList.remove("hidden");
    startGame();
}

function sendLoginOTP() {
    const email = document.getElementById("loginEmail").value;
    if (!email) return alert("Masukkan email");
    otpSent = Math.floor(100000 + Math.random() * 900000).toString();

    emailjs.send("service_tdwgl89", "template_otp", {
        to_email: email,
        otp: otpSent
    }).then(() => alert("OTP terkirim ke email!"));
}

function verifyLogin() {
    const code = document.getElementById("otpCode").value;
    if (code === otpSent) {
        currentUser = { email: document.getElementById("loginEmail").value, demo: false };
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("game-dashboard").classList.remove("hidden");
        startGame();
    } else {
        alert("OTP salah!");
    }
}

function logout() {
    currentUser = null;
    otpSent = null;
    location.reload();
}