/* ==========================================================================
   HAPPY BIRTHDAY FLORYN — Full Interactive Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initIntroSlides();   // ← runs first, covers page
    initBalloonCanvas();
    initAudioAutoplay(); // ← audio queued; plays after intro finishes
    initStickerPlayground();
    initPasswordGate();
    initScratchCard();
    initCakeBlowing();
    initQuiz();
    initEnvelopeLetter();
    initWishJar();
    initScrollReveal();
});

/* ==========================================================================
   0. INTRO SLIDES
   ========================================================================== */
function initIntroSlides() {
    const wrapper = document.getElementById('introSlides');
    if (!wrapper) return;

    const slideEls = Array.from(wrapper.querySelectorAll('.intro-slide'));
    const dots = Array.from(wrapper.querySelectorAll('.sdot'));
    const enterBtn = document.getElementById('enterBtn');
    const TOTAL = slideEls.length;
    let cur = 0;

    function showSlide(n) {
        cur = Math.max(0, Math.min(n, TOTAL - 1));

        slideEls.forEach((slide, idx) => {
            if (idx === cur) {
                slide.classList.add('is-active');
                slide.style.display = 'flex';
                const el = slide.querySelector('.slide-content');
                if (el) {
                    el.style.animation = 'none';
                    el.offsetHeight; // force reflow
                    el.style.animation = '';
                }
            } else {
                slide.classList.remove('is-active');
                slide.style.display = 'none';
            }
        });

        dots.forEach((d, i) => d.classList.toggle('active', i === cur));
    }

    // Single delegated click on wrapper
    wrapper.addEventListener('click', (e) => {
        // Dot click
        const dot = e.target.closest('.sdot');
        if (dot) {
            const idx = parseInt(dot.dataset.i, 10);
            if (!isNaN(idx)) {
                showSlide(idx);
                return;
            }
        }

        // On last slide, click button to enter
        if (cur === TOTAL - 1) {
            if (e.target.closest('#enterBtn')) {
                enterHero();
            }
            return;
        }

        // On slides 0..3, clicking anywhere advances to next slide
        showSlide(cur + 1);
    });

    function enterHero() {
        wrapper.classList.add('exiting');
        window.dispatchEvent(new Event('introFinished'));
        
        // Trigger staggered hero entrance animation
        const hero = document.getElementById('hero');
        if (hero) {
            setTimeout(() => {
                hero.classList.add('is-revealed');
                if (window.confetti) {
                    confetti({ particleCount: 80, spread: 80, origin: { y: 0.45 } });
                }
            }, 300);
        }

        setTimeout(() => { wrapper.style.display = 'none'; }, 850);
    }

    if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            enterHero();
        });
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!wrapper || wrapper.style.display === 'none') return;
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (cur < TOTAL - 1) {
                showSlide(cur + 1);
            } else {
                enterHero();
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (cur > 0) showSlide(cur - 1);
        }
    });

    // Start at slide 0
    showSlide(0);
}




/* ==========================================================================
   1. FLOATING BALLOONS + POP PARTICLES
   ========================================================================== */
function initBalloonCanvas() {
    const canvas = document.getElementById('balloonCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

    const COLORS = ['#ffc8dd', '#a2d2ff', '#cdb4db', '#ffafcc', '#bde0fe', '#e8d7f1'];

    class Balloon {
        constructor() { this.spawn(); }
        spawn() {
            this.x = Math.random() * W;
            this.y = H + 60 + Math.random() * 200;
            this.r = 22 + Math.random() * 22;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.vy = .9 + Math.random() * 1.2;
            this.angle = Math.random() * Math.PI * 2;
        }
        update() {
            this.y -= this.vy;
            this.angle += .018;
            this.x += Math.sin(this.angle) * .55;
            if (this.y < -80) this.spawn();
        }
        draw() {
            ctx.save();
            // Body
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.r, this.r * 1.22, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            // Shine
            ctx.beginPath();
            ctx.ellipse(this.x - this.r * .3, this.y - this.r * .4, this.r * .22, this.r * .18, -.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,.55)';
            ctx.fill();
            // String
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.r * 1.22);
            ctx.quadraticCurveTo(this.x + Math.sin(this.angle) * 12, this.y + this.r * 1.22 + 18, this.x + Math.sin(this.angle) * 6, this.y + this.r * 1.22 + 35);
            ctx.strokeStyle = 'rgba(140,80,100,.35)';
            ctx.lineWidth = 1.3;
            ctx.stroke();
            ctx.restore();
        }
        hit(mx, my) {
            return (mx - this.x) ** 2 + (my - this.y) ** 2 <= (this.r * 1.25) ** 2;
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.vx = (Math.random() - .5) * 9;

            this.vy = (Math.random() - .5) * 9;
            this.life = 1;
            this.decay = .022 + Math.random() * .018;
            this.size = 3 + Math.random() * 6;
        }
        update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Initialize AFTER class declarations to avoid temporal dead zone
    const balloons = Array.from({ length: 15 }, () => new Balloon());
    const particles = [];

    // Click to pop
    window.addEventListener('click', e => {
        for (let i = balloons.length - 1; i >= 0; i--) {
            if (balloons[i].hit(e.clientX, e.clientY)) {
                for (let p = 0; p < 22; p++) particles.push(new Particle(balloons[i].x, balloons[i].y, balloons[i].color));
                if (window.confetti) confetti({ particleCount: 28, spread: 55, origin: { x: e.clientX / W, y: e.clientY / H } });
                balloons[i].spawn();
                break;
            }
        }
    });

    (function frame() {
        ctx.clearRect(0, 0, W, H);
        balloons.forEach(b => { b.update(); b.draw(); });
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(); particles[i].draw();
            if (particles[i].life <= 0) particles.splice(i, 1);
        }
        requestAnimationFrame(frame);
    })();
}


/* ==========================================================================
   3. AUDIO AUTO-PLAY ("Cantik - Kahitna")
   ========================================================================== */
function initAudioAutoplay() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('audioToggleBtn');
    const icon = document.getElementById('playIcon');
    const statusTxt = document.getElementById('musicStatusText');
    const disc = document.getElementById('vinylRecord');

    let playing = false;
    let synthCtx = null;
    let synthTimer = null;

    // Gentle synth melody as fallback when MP3 not yet added
    function startSynth() {
        if (synthCtx) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            synthCtx = new AC();
            const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 349.23, 293.66, 261.63];
            let i = 0;
            synthTimer = setInterval(() => {
                if (!playing) return;
                const osc = synthCtx.createOscillator();
                const gain = synthCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(notes[i % notes.length], synthCtx.currentTime);
                gain.gain.setValueAtTime(0.06, synthCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, synthCtx.currentTime + 0.9);
                osc.connect(gain); gain.connect(synthCtx.destination);
                osc.start(); osc.stop(synthCtx.currentTime + 0.9);
                i++;
            }, 520);
        } catch (e) { }
    }

    function play() {
        if (playing) return;
        audio.play().then(() => {
            playing = true;
            icon.textContent = '⏸';
            statusTxt.textContent = '🎵 Cantik — Kahitna';
            disc.classList.add('spinning');
        }).catch((err) => {
            // Blocked by browser autoplay policy before user gesture
            // Keep playing = false so next tap/click starts music!
            playing = false;
            icon.textContent = '▶';
            statusTxt.textContent = '🎵 Tap untuk putar lagu 💕';
            disc.classList.remove('spinning');
        });
    }

    function pause() {
        audio.pause();
        playing = false;
        icon.textContent = '▶';
        statusTxt.textContent = '⏸ Paused';
        disc.classList.remove('spinning');
    }

    btn.addEventListener('click', () => playing ? pause() : play());

    // 🎵 Play on first tap or click anywhere
    const triggerPlay = () => {
        play();
        ['click', 'touchstart', 'touchend', 'keydown', 'scroll'].forEach(ev => {
            window.removeEventListener(ev, triggerPlay);
            document.removeEventListener(ev, triggerPlay);
        });
    };
    ['click', 'touchstart', 'touchend', 'keydown', 'scroll'].forEach(ev => {
        window.addEventListener(ev, triggerPlay, { once: true });
        document.addEventListener(ev, triggerPlay, { once: true });
    });
    
    // Attempt immediate playback
    play();
}

/* ==========================================================================
   4. STICKER DRAG & DROP
   ========================================================================== */
function initStickerPlayground() {
    document.querySelectorAll('.stk').forEach(s => {
        s.addEventListener('dragstart', e => e.dataTransfer.setData('emoji', s.dataset.e));
        s.addEventListener('click', e => drop(e.clientX, e.clientY + 50, s.dataset.e));
    });

    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => {
        e.preventDefault();
        const em = e.dataTransfer.getData('emoji');
        if (em) drop(e.clientX, e.clientY, em);
    });

    function drop(x, y, em) {
        const el = document.createElement('span');
        el.className = 'dropped-sticker';
        el.textContent = em;
        el.style.left = (x - 18) + 'px';
        el.style.top = (y - 18) + 'px';
        el.addEventListener('mousedown', makeDraggable);
        document.body.appendChild(el);
        if (window.confetti) confetti({ particleCount: 18, spread: 40, origin: { x: x / window.innerWidth, y: y / window.innerHeight } });
    }

    function makeDraggable(e) {
        const el = e.target;
        let sx = e.clientX - el.getBoundingClientRect().left;
        let sy = e.clientY - el.getBoundingClientRect().top;
        const move = ev => { el.style.left = (ev.pageX - sx) + 'px'; el.style.top = (ev.pageY - sy) + 'px'; };
        document.addEventListener('mousemove', move);
        el.addEventListener('mouseup', () => document.removeEventListener('mousemove', move), { once: true });
    }
}

/* ==========================================================================
   5. PASSWORD GATE (3 Juni 2026)
   ========================================================================== */
function initPasswordGate() {
    const input = document.getElementById('passwordInput');
    const btn = document.getElementById('unlockBtn');
    const feedback = document.getElementById('passwordFeedback');
    const content = document.getElementById('lockedContent');
    const card = document.querySelector('.cloud-blob');

    const valid = ['3 juni 2026', '03 juni 2026', '03/06/2026', '3/6/2026', '3-6-2026', '03-06-2026', '03062026', '3 juni', '03 juni'];

    function verify() {
        const val = input.value.trim().toLowerCase();
        if (valid.includes(val)) {
            feedback.className = 'pw-feedback ok';
            feedback.innerHTML = '🎉 Password benar! Membuka Rahasia Cinta… 💕';
            if (window.confetti) confetti({ particleCount: 130, spread: 90, origin: { y: .6 } });
            setTimeout(() => {
                content.classList.remove('hidden');
                document.getElementById('foto-bareng').scrollIntoView({ behavior: 'smooth' });
            }, 700);
        } else {
            feedback.className = 'pw-feedback err';
            feedback.innerHTML = '😱 Waduh, salah! Masa tanggal jadian sendiri lupa? 😜<br><small>Coba ketik: <b>3 Juni 2026</b></small>';
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 500);
        }
    }

    btn.addEventListener('click', verify);
    input.addEventListener('keypress', e => { if (e.key === 'Enter') verify(); });
}

/* ==========================================================================
   6. SCRATCH CARD
   ========================================================================== */
function initScratchCard() {
    const canvas = document.getElementById('scratchCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Draw gold scratch layer
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#f9d423');
    grad.addColorStop(.4, '#ffd700');
    grad.addColorStop(.7, '#f9a825');
    grad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Instruction text on gold layer
    ctx.fillStyle = 'rgba(120,60,0,.55)';
    ctx.font = 'bold 20px Caveat, cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Garuk di sini dengan kursor! ✨', W / 2, H / 2);

    let scratching = false;
    let totalPx = 0;
    let revealed = false;

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function scratch(e) {
        if (!scratching) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        // Count erased pixels occasionally
        totalPx++;
        if (totalPx % 30 === 0 && !revealed) {
            const data = ctx.getImageData(0, 0, W, H).data;
            let cleared = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] < 10) cleared++;
            if (cleared / (W * H) > 0.45) {
                revealed = true;
                setTimeout(() => { canvas.style.opacity = '0'; canvas.style.transition = 'opacity .6s ease'; }, 200);
                if (window.confetti) confetti({ particleCount: 80, spread: 70, origin: { y: .5 } });
            }
        }
    }

    canvas.addEventListener('mousedown', () => scratching = true);
    canvas.addEventListener('mouseup', () => scratching = false);
    canvas.addEventListener('mouseleave', () => scratching = false);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchstart', e => { scratching = true; e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', () => scratching = false);
    canvas.addEventListener('touchmove', scratch, { passive: false });
}

/* ==========================================================================
   7. BIRTHDAY CAKE CANDLE BLOW
   ========================================================================== */
function initCakeBlowing() {
    const btn = document.getElementById('blowCandleBtn');
    const flames = document.querySelectorAll('.flame');
    const status = document.getElementById('wishStatus');
    let blown = false;

    btn.addEventListener('click', () => {
        if (blown) return;
        blown = true;
        flames.forEach((f, i) => setTimeout(() => f.classList.add('out'), i * 180));
        setTimeout(() => {
            status.innerHTML = '✨ <b>Horeee! Semua doamu pasti dikabulkan! Happy Birthday Floryn Sayang! 🎉💕</b>';
            status.style.color = '#b5658e';
            btn.style.display = 'none';
            if (window.confetti) {
                const end = Date.now() + 4500;
                (function burst() {
                    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 } });
                    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 } });
                    if (Date.now() < end) requestAnimationFrame(burst);
                })();
            }
        }, 700);
    });
}

/* ==========================================================================
   8. LOVE QUIZ
   ========================================================================== */
const QUIZ = [
    {
        q: 'Tanggal berapa kita resmi jadian? 💖',
        opts: ['3 Juni 2026', '1 Januari 2026', '14 Februari 2026', '10 Oktober 2026'],
        ans: 0
    },
    {
        q: 'Apa hal yang paling aku suka dari Floryn? 🌸',
        opts: ['Senyum manisnya yang bikin tenang', 'Kebaikan hatinya yang tulus', 'Cara bercandanya yang lucu', 'Semua hal di atas tanpa terkecuali! 💕'],
        ans: 3
    },
    {
        q: 'Kalau lagi kangen, biasanya siapa yang pengen ketemu duluan? ☕',
        opts: ['Aku', 'Floryn', 'Dua-duanya sama-sama kangen parah! 🥰', 'Kucing tetangga'],
        ans: 2
    },
    {
        q: 'Apa harapan terbesar buat Floryn di ultah ini? ✨',
        opts: ['Selalu sehat & makin bersinar', 'Impiannya tercapai satu per satu', 'Selalu bareng terus sama aku', 'Semua jawaban benar & diaminkan seribu kali! 🙏'],
        ans: 3
    }
];

let curQ = 0;

function initQuiz() { renderQ(); }

function renderQ() {
    const data = QUIZ[curQ];
    document.getElementById('questionNumber').textContent = `Pertanyaan ${curQ + 1} dari ${QUIZ.length}`;
    document.getElementById('questionText').textContent = data.q;
    document.getElementById('quizProgressBar').style.width = `${((curQ + 1) / QUIZ.length) * 100}%`;

    const grid = document.getElementById('optionsGrid');
    grid.innerHTML = '';
    data.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'opt-btn';
        b.textContent = opt;
        b.onclick = () => pick(i, b);
        grid.appendChild(b);
    });
}

function pick(idx, btn) {
    const all = document.querySelectorAll('.opt-btn');
    all.forEach(b => b.disabled = true);
    btn.classList.add(idx === QUIZ[curQ].ans ? 'correct' : 'wrong');
    if (idx !== QUIZ[curQ].ans) all[QUIZ[curQ].ans].classList.add('correct');

    setTimeout(() => {
        curQ++;
        if (curQ < QUIZ.length) renderQ();
        else {
            document.getElementById('quizContainer').classList.add('hidden');
            document.getElementById('quizResult').classList.remove('hidden');
            if (window.confetti) confetti({ particleCount: 80, spread: 72, origin: { y: .6 } });
        }
    }, 1300);
}

function resetQuiz() {
    curQ = 0;
    document.getElementById('quizContainer').classList.remove('hidden');
    document.getElementById('quizResult').classList.add('hidden');
    renderQ();
}

/* ==========================================================================
   9. LOVE LETTER TYPEWRITER
   ========================================================================== */
function initEnvelopeLetter() {
    const env = document.getElementById('envelope');
    const btn = document.getElementById('openEnvelopeBtn');
    const tw = document.getElementById('typewriterText');
    const msg =
        `Selamat Ulang Tahun yaa sayangku Floryn! 🌸🎂

Di hari yang sangat spesial ini, aku cuma mau bilang betapa bersyukurnya aku punya kamu dalam hidupku. Kamu itu orang yang luar biasa manis, baik hati, dan selalu berhasil bikin hari-hariku jadi jauh lebih berwarna dan bermakna.

Semoga di usiamu yang baru ini, Floryn selalu diberikan kesehatan yang berlimpah, kebahagiaan yang sejati, dan kemudahan dalam meraih semua cita-cita dan impian kamu.

Tetap jadi Floryn yang ceria, hangat, dan penuh kasih sayang ya! Terima kasih udah selalu ada dan jadi yang terbaik. Happy Birthday, I Love You So Much! 💕✨

— Dari io yang paling ganteng 💖`;

    let opened = false;
    function open() {
        if (opened) return;
        opened = true;
        env.classList.add('open');
        btn.style.display = 'none';
        let i = 0;
        const type = () => { if (i < msg.length) { tw.textContent += msg[i++]; setTimeout(type, 32); } };
        setTimeout(type, 650);
    }

    env.addEventListener('click', open);
    btn.addEventListener('click', open);
}

/* ==========================================================================
   10. WISH JAR
   ========================================================================== */
const REASONS = [
    '✨ Karena senyuman Floryn selalu bisa bikin hari terburukku jadi cerah kembali.',
    '💖 Karena kamu selalu dengerin cerita-ceritaku dengan sabar dan penuh perhatian.',
    '🌸 Karena ketawa kamu itu suara paling merdu yang pernah aku dengar.',
    '☕ Karena date bareng kamu selalu berkesan dan ga pernah ngebosenin.',
    '🥰 Karena kamu orangnya penyayang banget dan selalu peduli sama orang sekitarnya.',
    '🌈 Karena bareng kamu, hal-hal sederhana rasanya jadi spesial banget.',
    '🚀 Karena kamu selalu dukung dan percaya sama impian-impianku.',
    '⭐ Karena kamu satu-satunya orang yang paling ngerti aku apa adanya.',
    '🎀 Karena kamu membawa ketenangan di setiap momen yang kita jalani.',
    '💕 Dan yang paling penting: KARENA KAMU ADALAH FLORYN, CEWEK TERBAIK DI DUNIA!'
];

function initWishJar() {
    const btn = document.getElementById('drawWishBtn');
    const note = document.getElementById('wishNoteDisplay');
    btn.addEventListener('click', () => {
        const r = REASONS[Math.floor(Math.random() * REASONS.length)];
        note.style.opacity = '0';
        setTimeout(() => { note.textContent = r; note.style.opacity = '1'; }, 220);
        if (window.confetti) confetti({ particleCount: 22, spread: 45 });
    });
}

/* ==========================================================================
   11. SCROLL REVEAL (subtle entrance animations)
   ========================================================================== */
function initScrollReveal() {
    // Exclude password-gate from scroll reveal so it's always immediately interactive
    const targets = document.querySelectorAll('.section-wrap:not(#password-gate), .bareng-card, .flip-card');
    targets.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = 'opacity .65s ease, transform .65s ease';
    });

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
                obs.unobserve(e.target);
            }
        });
    }, { threshold: .08 });

    targets.forEach(el => obs.observe(el));
}

/* Helper */
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}
