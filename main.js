/* ==========================================================================
   pranaS — Portfolio JavaScript
   Interactive 3D Kinetic Particle Fabric · Spotlight Cards · Project Modals
   Live Interactive Simulators · Monochrome Elegance
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     1. HERO CANVAS: 3D KINETIC PARTICLE FABRIC
     Adapted from referensi web porto (1.txt) — Pure Canvas Physics
     ------------------------------------------------------------------------ */
  let triggerHeroShockwave;

  (function initKineticFabric() {
    const canvas = document.getElementById('mesh-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animId = null;
    let time = 0;

    const pointer = {
      x: -2000,
      y: -2000,
      prevX: -2000,
      prevY: -2000,
      vx: 0,
      vy: 0,
      targetAngleX: 0.12,
      targetAngleY: 0.0,
      angleX: 0.12,
      angleY: 0.0,
      radius: 180,
      isDown: false,
      shockwaves: []
    };

    let nodes = [];
    let links = [];

    function buildMesh() {
      if (width === 0 || height === 0) return;

      const spacing = 42;
      const cols = Math.ceil((width * 1.15) / spacing) + 1;
      const rows = Math.ceil((height * 1.15) / spacing) + 1;

      nodes = [];
      links = [];
      const grid = [];

      const startX = -(cols * spacing) / 2;
      const startY = -(rows * spacing) / 2;

      let index = 0;
      for (let j = 0; j < rows; j++) {
        grid[j] = [];
        for (let i = 0; i < cols; i++) {
          const bx = startX + i * spacing;
          const by = startY + j * spacing;
          const bz = 0;
          const isPinned = (i === 0 || i === cols - 1 || j === 0 || j === rows - 1);

          nodes.push({
            curr: { x: bx, y: by, z: bz },
            prev: { x: bx, y: by, z: bz },
            base: { x: bx, y: by, z: bz },
            proj: { x: 0, y: 0, scale: 1, alpha: 1 },
            pinned: isPinned,
            excitation: 0
          });

          grid[j][i] = index++;
        }
      }

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const currIdx = grid[j][i];
          if (i < cols - 1) {
            links.push({ p1: currIdx, p2: grid[j][i + 1], length: spacing });
          }
          if (j < rows - 1) {
            links.push({ p1: currIdx, p2: grid[j + 1][i], length: spacing });
          }
          if (i < cols - 1 && j < rows - 1) {
            links.push({ p1: currIdx, p2: grid[j + 1][i + 1], length: Math.SQRT2 * spacing });
          }
        }
      }
    }

    function resize() {
      const parent = canvas.parentElement;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      buildMesh();
    }

    triggerHeroShockwave = function(x, y) {
      pointer.shockwaves.push({
        x: x || width / 2,
        y: y || height / 2,
        radius: 12,
        maxRadius: Math.max(width, height) * 0.7,
        strength: 1.2
      });
    };

    function loop() {
      time += 0.016;

      pointer.vx = (pointer.x - pointer.prevX) * 0.45;
      pointer.vy = (pointer.y - pointer.prevY) * 0.45;
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      const pointerSpeed = Math.min(Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy), 45);

      pointer.angleX += (pointer.targetAngleX - pointer.angleX) * 0.05;
      pointer.angleY += (pointer.targetAngleY - pointer.angleY) * 0.05;

      const cosX = Math.cos(pointer.angleX);
      const sinX = Math.sin(pointer.angleX);
      const cosY = Math.cos(pointer.angleY);
      const sinY = Math.sin(pointer.angleY);

      // Deep dark background
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      // Shockwaves update
      for (let s = pointer.shockwaves.length - 1; s >= 0; s--) {
        const sw = pointer.shockwaves[s];
        sw.radius += 14;
        sw.strength *= 0.94;
        if (sw.radius > sw.maxRadius || sw.strength < 0.01) {
          pointer.shockwaves.splice(s, 1);
        }
      }

      // Physics update: verlet integration & fluid wave oscillation
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.pinned) continue;

        const vx = (n.curr.x - n.prev.x) * 0.955;
        const vy = (n.curr.y - n.prev.y) * 0.955;
        const vz = (n.curr.z - n.prev.z) * 0.955;

        n.prev.x = n.curr.x;
        n.prev.y = n.curr.y;
        n.prev.z = n.curr.z;

        n.curr.x += vx;
        n.curr.y += vy;
        n.curr.z += vz;

        // Harmonic organic wave from reference
        const fluidZ =
          Math.sin(n.base.x * 0.009 + time) * 15 +
          Math.cos(n.base.y * 0.011 + time * 1.2) * 11;

        n.curr.x += (n.base.x - n.curr.x) * 0.038;
        n.curr.y += (n.base.y - n.curr.y) * 0.038;
        n.curr.z += (n.base.z + fluidZ - n.curr.z) * 0.038;

        n.excitation *= 0.92;
      }

      const fov = 640;
      const cx = width / 2;
      const cy = height / 2;

      // 3D perspective rotation & projection
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        const rx1 = n.curr.x * cosY + n.curr.z * sinY;
        const ry1 = n.curr.y;
        const rz1 = -n.curr.x * sinY + n.curr.z * cosY;

        const rx2 = rx1;
        const ry2 = ry1 * cosX - rz1 * sinX;
        const rz2 = ry1 * sinX + rz1 * cosX + 460;

        const scale = fov / Math.max(1, rz2);
        n.proj.x = cx + rx2 * scale;
        n.proj.y = cy + ry2 * scale;
        n.proj.scale = scale;
        n.proj.alpha = Math.min(1, Math.max(0.06, (scale - 0.45) * 1.4));

        // Pointer force repulsion
        if (!n.pinned) {
          const dx = n.proj.x - pointer.x;
          const dy = n.proj.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pointer.radius && dist > 0) {
            const ratio = 1 - dist / pointer.radius;
            const force = ratio * (pointer.isDown ? 42 : 24) + pointerSpeed * 0.38;
            const angle = Math.atan2(dy, dx);

            n.curr.x += (Math.cos(angle) * force * 0.8) / n.proj.scale;
            n.curr.y += (Math.sin(angle) * force * 0.8) / n.proj.scale;
            n.curr.z -= (force * 2.8) / n.proj.scale;
            n.excitation = Math.max(n.excitation, ratio);
          }

          // Shockwave ripple impulse
          for (let s = 0; s < pointer.shockwaves.length; s++) {
            const sw = pointer.shockwaves[s];
            const swDx = n.proj.x - sw.x;
            const swDy = n.proj.y - sw.y;
            const swDist = Math.sqrt(swDx * swDx + swDy * swDy);
            const ringDelta = Math.abs(swDist - sw.radius);

            if (ringDelta < 45) {
              const impulse = (1 - ringDelta / 45) * sw.strength * 30;
              n.curr.z += impulse / n.proj.scale;
              n.excitation = Math.max(n.excitation, 0.85);
            }
          }
        }
      }

      // Structural relaxation passes
      const relaxationPasses = 2;
      for (let p = 0; p < relaxationPasses; p++) {
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          const na = nodes[link.p1];
          const nb = nodes[link.p2];

          const dx = nb.curr.x - na.curr.x;
          const dy = nb.curr.y - na.curr.y;
          const dz = nb.curr.z - na.curr.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const diff = (dist - link.length) / (dist || 1);

          const offsetX = dx * 0.5 * diff;
          const offsetY = dy * 0.5 * diff;
          const offsetZ = dz * 0.5 * diff;

          if (!na.pinned) {
            na.curr.x += offsetX;
            na.curr.y += offsetY;
            na.curr.z += offsetZ;
          }
          if (!nb.pinned) {
            nb.curr.x -= offsetX;
            nb.curr.y -= offsetY;
            nb.curr.z -= offsetZ;
          }
        }
      }

      // Draw structural links (monochrome white/gray)
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const na = nodes[link.p1];
        const nb = nodes[link.p2];

        const avgAlpha = (na.proj.alpha + nb.proj.alpha) * 0.5;
        const excitation = Math.max(na.excitation, nb.excitation);
        const alpha = Math.min(0.5, Math.max(0.04, avgAlpha * 0.2 + excitation * 0.4));

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(na.proj.x, na.proj.y);
        ctx.lineTo(nb.proj.x, nb.proj.y);
        ctx.stroke();
      }

      // Draw particles / node vertices
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const excitation = n.excitation;
        const radius = Math.max(0.8, n.proj.scale * 1.5 + excitation * 2.0);
        const alpha = Math.min(0.9, Math.max(0.08, n.proj.alpha * 0.38 + excitation * 0.6));

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.proj.x, n.proj.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    // Event listeners
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;

      const normX = (pointer.x / width - 0.5) * 2;
      const normY = (pointer.y / height - 0.5) * 2;
      pointer.targetAngleY = normX * 0.16;
      pointer.targetAngleX = -normY * 0.14 + 0.12;
    });

    canvas.addEventListener('mouseleave', () => {
      pointer.x = -2000;
      pointer.y = -2000;
      pointer.targetAngleX = 0.12;
      pointer.targetAngleY = 0.0;
    });

    canvas.addEventListener('mousedown', () => { pointer.isDown = true; });
    canvas.addEventListener('mouseup', () => { pointer.isDown = false; });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      triggerHeroShockwave(e.clientX - rect.left, e.clientY - rect.top);
    });

    resize();
    loop();
  })();

  // Hero Hint Button Click triggers shockwave
  const heroHint = document.getElementById('hero-hint');
  if (heroHint && triggerHeroShockwave) {
    heroHint.addEventListener('click', () => {
      triggerHeroShockwave();
    });
  }


  /* ------------------------------------------------------------------------
     2. SPOTLIGHT & 3D TILT ON PROJECT CARDS (reference 3.txt)
     ------------------------------------------------------------------------ */
  const projectCards = document.querySelectorAll('.pcard');
  projectCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update spotlight position CSS variables
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Gentle 3D perspective tilt
      const normX = (x / rect.width - 0.5) * 2;
      const normY = (y / rect.height - 0.5) * 2;
      card.style.transform = `perspective(800px) rotateX(${-normY * 4}deg) rotateY(${normX * 4}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.setProperty('--mouse-x', `-200px`);
      card.style.setProperty('--mouse-y', `-200px`);
    });
  });


  /* ------------------------------------------------------------------------
     3. NAVBAR SCROLL & ACTIVE STATE
     ------------------------------------------------------------------------ */
  const nav = document.getElementById('nav');
  const sections = ['home', 'projects', 'about', 'contact'];
  const navLinks = document.querySelectorAll('.nl');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 24) {
      nav.classList.add('stuck');
    } else {
      nav.classList.remove('stuck');
    }

    let currentSection = 'home';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 140) {
        currentSection = id;
      }
    }

    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });


  /* ------------------------------------------------------------------------
     4. MOBILE BURGER MENU
     ------------------------------------------------------------------------ */
  const burger = document.getElementById('burger');
  const navMenu = document.getElementById('nav-links');

  if (burger && navMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }


  /* ------------------------------------------------------------------------
     5. TYPEWRITER EFFECT
     ------------------------------------------------------------------------ */
  (function initTypewriter() {
    const typedEl = document.getElementById('typed');
    if (!typedEl) return;

    const texts = [
      'Suka ngulik kode & bikin aplikasi',
      'Web Developer (HTML, CSS, JS, PHP)',
      'Eksplorasi Python, Bot & Otomasi',
      'Belajar sambil langsung praktek'
    ];

    let textIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function tick() {
      const current = texts[textIdx];

      if (!isDeleting) {
        typedEl.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) {
          isDeleting = true;
          setTimeout(tick, 2200);
          return;
        }
        setTimeout(tick, 60);
      } else {
        typedEl.textContent = current.slice(0, --charIdx);
        if (charIdx === 0) {
          isDeleting = false;
          textIdx = (textIdx + 1) % texts.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 35);
      }
    }

    setTimeout(tick, 800);
  })();


  /* ------------------------------------------------------------------------
     6. PROJECT FILTER & SKILL CHIPS INTERACTIVITY
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.fb');

  function applyProjectFilter(filterValue) {
    filterBtns.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-f') === filterValue);
    });

    projectCards.forEach((card) => {
      const categories = card.getAttribute('data-f') || '';
      if (filterValue === 'all' || categories.split(' ').includes(filterValue)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const fVal = btn.getAttribute('data-f');
      applyProjectFilter(fVal);
    });
  });

  // Clicking Skill chips in About section filters the project grid smoothly!
  const skillChips = document.querySelectorAll('#skill-chips span');
  skillChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-filter');
      if (filter) {
        applyProjectFilter(filter);
        const projSec = document.getElementById('projects');
        if (projSec) {
          projSec.scrollIntoView({ behavior: 'smooth' });
        }
        showToast(`Memfilter proyek berdasarkan: ${chip.textContent}`);
      }
    });
  });


  /* ------------------------------------------------------------------------
     7. PROJECT DATA: DESCRIPTIONS, REAL SOURCE CODE & INTERACTIVE SIMULATORS
     ------------------------------------------------------------------------ */
  const projectData = {
    // 01: MarketLens & MarketAI (Disatukan)
    marketlens: {
      number: 'PROYEK 01',
      title: 'MarketLens (MarketAI-Analyst)',
      summary: 'Platform pemantau kondisi pasar keuangan dan berita makro ekonomi otomatis yang terhubung ke bot Telegram, menyajikan rangkuman pintar harian dan analisis interaktif on-demand.',
      tags: ['Python', 'Telegram Bot', 'FinTech', 'Data Analysis'],
      status: 'Dalam Pengembangan',
      simpleExpl: `
        <div class="m-section">
          <h4 class="m-section-title">Apa ini sebenarnya?</h4>
          <p class="m-text">MarketLens (MarketAI) adalah asisten cerdas yang bertugas memantau pergerakan pasar keuangan secara terus-menerus. Daripada kita harus membaca puluhan portal berita satu per satu atau memelototi grafik seharian, program ini mengumpulkan data pasar, merangkumnya, lalu mengirimkan laporan singkat langsung ke obrolan Telegram setiap pagi.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kenapa dibuat?</h4>
          <p class="m-text">Awalnya karena sering ketinggalan informasi pasar penting saat jam pelajaran sekolah. Dengan adanya bot ini, cukup baca ringkasan 2 menit saat istirahat untuk tahu apa yang sedang terjadi di pasar modal.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kemampuan Utama</h4>
          <ul class="m-list">
            <li>Kirim ringkasan pagi (Morning Brief) otomatis terjadwal tiap jam 07:00 WIB ke Telegram.</li>
            <li>Bisa diajak tanya jawab singkat seputar kondisi saham, kripto, atau komoditas tertentu.</li>
            <li>Mendeteksi lonjakan harga yang signifikan dan mengirimkan pesan peringatan cepat.</li>
          </ul>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Alat yang Dipakai</h4>
          <div class="m-stack">
            <span>Python 3.11</span><span>python-telegram-bot</span><span>Financial APIs</span><span>Pandas DataFrames</span>
          </div>
        </div>
      `,
      fileName: 'market/bot-telegram/main.py',
      codeSnippet: `#!/usr/bin/env python3
"""
MarketAI Analyst Bot - Main Entry Point
Bot Telegram untuk analisis pasar keuangan otomatis dengan multi-data source.
"""
import asyncio
import logging
import sys
import os
from datetime import datetime, time, timedelta

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if _BASE_DIR not in sys.path:
    sys.path.insert(0, _BASE_DIR)
os.chdir(_BASE_DIR)

from telegram.ext import Application, CommandHandler, MessageHandler, filters
from config.settings import TELEGRAM_TOKEN, BOT_NAME, MORNING_BRIEF_HOUR

async def morning_brief(context):
    """Mengirim ringkasan pasar harian otomatis."""
    chat_id = context.job.chat_id
    pesan = (
        "🌅 *MARKETAI MORNING BRIEF*\\n"
        "• IHSG: Tren konsolidasi di area 7,500\\n"
        "• XAU/USD (Emas): Menguat +0.8% menguji batas atas\\n"
        "• Catatan: Waspadai rilis data inflasi malam ini pukul 19:30 WIB."
    )
    await context.bot.send_message(chat_id=chat_id, text=pesan, parse_mode="Markdown")

async def cmd_start(update, context):
    user = update.effective_user
    await update.message.reply_text(
        f"Halo {user.first_name}! 👋 Aku {BOT_NAME}.\\n"
        "Ketik /brief untuk rangkuman pasar hari ini, atau /analisis [aset]."
    )

def main():
    print("Menjalankan MarketAI Bot...")
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.run_polling()

if __name__ == "__main__":
    main()`,
      renderSimulator: function(container) {
        container.innerHTML = `
          <div class="sim-box">
            <div class="sim-header">
              <h5 class="sim-title">Simulasi Obrolan Telegram Bot</h5>
              <p class="sim-desc">Klik tombol perintah di bawah ini untuk melihat bagaimana bot merespon permintaan data pasar secara instan!</p>
            </div>
            <div class="sim-chat-window" id="chat-win">
              <div class="chat-bubble bot">
                🤖 <strong>MarketAI:</strong> Halo! Aku asisten analis pasarmu. Pilih perintah di bawah untuk mencoba respons:
              </div>
            </div>
            <div class="sim-btn-row">
              <button class="sim-btn" onclick="simMarketChat('/brief')">Kirim /brief Pagi</button>
              <button class="sim-btn" onclick="simMarketChat('/analisis XAU')">Kirim /analisis Emas</button>
              <button class="sim-btn" onclick="simMarketChat('/status IHSG')">Kirim /status IHSG</button>
            </div>
          </div>
        `;
      }
    },

    // 02: ClassMate
    classmate: {
      number: 'PROYEK 02',
      title: 'ClassMate (Sistem Absensi Digital)',
      summary: 'Aplikasi web absensi siswa yang simpel dan praktis agar sekolah nggak perlu lagi mencatat kehadiran dengan tanda tangan kertas konvensional.',
      tags: ['JavaScript', 'HTML5', 'CSS3', 'Web App', 'Siswa'],
      status: 'Prototype',
      simpleExpl: `
        <div class="m-section">
          <h4 class="m-section-title">Apa ini sebenarnya?</h4>
          <p class="m-text">ClassMate adalah platform web untuk mencatat kehadiran siswa secara langsung (real-time). Siswa cukup membuka aplikasi dari ponsel saat tiba di sekolah, menekan tombol absen, dan sistem langsung memvalidasi waktu kedatangan beserta statusnya (tepat waktu atau terlambat).</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kenapa dibuat?</h4>
          <p class="m-text">Dibuat sebagai solusi untuk masalah absensi manual di sekolah yang sering hilang kertasnya, butuh waktu lama untuk direkap sekretaris kelas, dan rawan titip absen.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kemampuan Utama</h4>
          <ul class="m-list">
            <li>Pencatatan jam kedatangan otomatis menggunakan jam perangkat yang akurat.</li>
            <li>Rekap riwayat absensi bulanan lengkap dengan status sakit, izin, dan alpa.</li>
            <li>Dashboard terpisah untuk siswa (lihat tugas & jadwal) dan guru (rekap kehadiran kelas).</li>
          </ul>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Alat yang Dipakai</h4>
          <div class="m-stack">
            <span>Vanilla JavaScript</span><span>HTML5 Semantics</span><span>CSS Grid & Flex</span><span>Local Storage</span>
          </div>
        </div>
      `,
      fileName: 'classmate/js/siswa.js',
      codeSnippet: `// classmate/js/siswa.js - Logika data siswa & pencatatan kehadiran

const riwayatAbsensi = [
  { tanggal: '2026-10-08', waktu: '06:55:00', status: 'Hadir', keterangan: 'Tepat waktu' },
  { tanggal: '2026-10-07', waktu: '07:05:00', status: 'Hadir', keterangan: 'Tepat waktu' },
  { tanggal: '2026-10-06', waktu: '-',        status: 'Izin',  keterangan: 'Ada urusan keluarga' }
];

function submitAbsensi() {
  const sekarang = new Date();
  const jam = String(sekarang.getHours()).padStart(2, '0');
  const menit = String(sekarang.getMinutes()).padStart(2, '0');
  const waktuStr = \`\${jam}:\${menit}:00\`;

  // Batas jam masuk sekolah 07:15
  const isTerlambat = (sekarang.getHours() > 7) || (sekarang.getHours() === 7 && sekarang.getMinutes() > 15);
  const statusKet = isTerlambat ? 'Terlambat' : 'Tepat waktu';

  const entryBaru = {
    tanggal: sekarang.toISOString().split('T')[0],
    waktu: waktuStr,
    status: 'Hadir',
    keterangan: statusKet
  };

  riwayatAbsensi.unshift(entryBaru);
  return entryBaru;
}`,
      renderSimulator: function(container) {
        container.innerHTML = `
          <div class="sim-box">
            <div class="sim-header">
              <h5 class="sim-title">Simulasi Mesin Absensi Siswa</h5>
              <p class="sim-desc">Coba tekan tombol di bawah ini untuk mensimulasikan pencatatan absensi digital saat siswa tiba di sekolah.</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding:1rem; background:var(--black-elev); border-radius:6px; border:1px solid var(--border);">
              <div>
                <div style="font-size:0.8rem; color:var(--gray-mid); font-family:var(--font-mono);">SISWA TERDAFTAR</div>
                <strong style="color:var(--pure-white);">Nadif Prana Saputra (XII PPLG 1)</strong>
              </div>
              <button class="sim-btn" onclick="simTapAbsen()">Tap Hadir Sekarang ✓</button>
            </div>
            <div id="sim-absen-log" style="font-family:var(--font-mono); font-size:0.82rem; color:var(--gray-light); line-height:1.6; padding:0.8rem; background:var(--black-elev); border-radius:6px; border:1px solid var(--border);">
              Status: Menunggu tombol absensi ditekan...
            </div>
          </div>
        `;
      }
    },

    // 03: Kasir
    kasir: {
      number: 'PROYEK 03',
      title: 'Aplikasi Kasir Toko Sekolah',
      summary: 'Aplikasi kasir komputer desktop berbasis Java dengan database MySQL untuk mempercepat proses transaksi, menghitung uang kembalian, dan memantau stok produk.',
      tags: ['Java', 'Swing Desktop', 'MySQL JDBC', 'FlatDarkLaf'],
      status: 'Selesai',
      simpleExpl: `
        <div class="m-section">
          <h4 class="m-section-title">Apa ini sebenarnya?</h4>
          <p class="m-text">Ini adalah software kasir desktop (Point of Sale) yang dirancang khusus untuk toko atau kantin sekolah. Petugas kasir bisa memilih barang, mengetik jumlah, menghitung total belanja dan uang kembalian secara otomatis, serta mencetak tanda terima pembelian.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kenapa dibuat?</h4>
          <p class="m-text">Proyek tugas kejuruan PPLG untuk mendalami pemrograman berorientasi objek (OOP) di Java dan interaksi database SQL secara langsung. Didesain dengan tampilan modern bertema gelap (Dark Mode) agar nyaman dipandang mata.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kemampuan Utama</h4>
          <ul class="m-list">
            <li>Koneksi database MySQL yang stabil dengan pola Singleton agar memori hemat.</li>
            <li>Manajemen master produk: tambah barang, update harga, dan pantau sisa stok.</li>
            <li>Kalkulasi transaksi otomatis tanpa risiko salah hitung uang kembalian.</li>
          </ul>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Alat yang Dipakai</h4>
          <div class="m-stack">
            <span>Java JDK 17</span><span>Java Swing GUI</span><span>MySQL Database</span><span>FlatLaf Theme</span>
          </div>
        </div>
      `,
      fileName: 'kasir_01/koneksi.java',
      codeSnippet: `package kasir_01;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class koneksi {
    private static Connection mysqlconfig;

    public static Connection configDB() {
        try {
            if (mysqlconfig == null || mysqlconfig.isClosed()) {
                String url  = "jdbc:mysql://localhost:3306/db_kasir_smart";
                String user = "root";
                String pass = "";
                
                DriverManager.registerDriver(new com.mysql.cj.jdbc.Driver());
                mysqlconfig = DriverManager.getConnection(url, user, pass);
                System.out.println("Koneksi Database Kasir Berhasil!");
            }
        } catch (SQLException e) {
            System.err.println("Gagal terhubung ke database: " + e.getMessage());
        }
        return mysqlconfig;
    }
}`,
      renderSimulator: function(container) {
        container.innerHTML = `
          <div class="sim-box">
            <div class="sim-header">
              <h5 class="sim-title">Kalkulator Transaksi Kasir</h5>
              <p class="sim-desc">Coba simulasi transaksi kasir sekolah di bawah ini: pilih barang, tentukan jumlah, dan masukkan uang pembayaran.</p>
            </div>
            <div class="sim-grid-form">
              <div class="sim-field">
                <label class="sim-label">PILIH PRODUK</label>
                <select id="kasir-item" class="sim-input" onchange="hitungKasirSim()">
                  <option value="5000">Buku Tulis Sinar Dunia - Rp 5.000</option>
                  <option value="3000">Pulpen Standard 0.5 - Rp 3.000</option>
                  <option value="25000">Kaos Olahraga Sekolah - Rp 25.000</option>
                </select>
              </div>
              <div class="sim-field">
                <label class="sim-label">JUMLAH (QTY)</label>
                <input id="kasir-qty" type="number" value="2" min="1" max="50" class="sim-input" oninput="hitungKasirSim()" />
              </div>
              <div class="sim-field">
                <label class="sim-label">UANG DIBAYAR (RP)</label>
                <input id="kasir-bayar" type="number" value="20000" step="1000" class="sim-input" oninput="hitungKasirSim()" />
              </div>
            </div>
            <div class="sim-result-card" id="kasir-output">
              <!-- rendered by JS -->
            </div>
          </div>
        `;
        setTimeout(window.hitungKasirSim, 50);
      }
    },

    // 04: Robot Trading WMT
    'robot-wmt': {
      number: 'PROYEK 04',
      title: 'Robot Trading WMT',
      summary: 'Program otomasi Python yang terhubung ke MetaTrader 5 untuk menerapkan aturan manajemen risiko secara disiplin tanpa campur tangan emosi manusia.',
      tags: ['Python', 'MetaTrader 5 API', 'Risk Control', 'Trading'],
      status: 'Eksperimen Aktif',
      simpleExpl: `
        <div class="m-section">
          <h4 class="m-section-title">Apa ini sebenarnya?</h4>
          <p class="m-text">Robot Trading WMT adalah asisten eksekusi transaksi yang berjalan di komputer. Tugas utamanya bukan menebak masa depan pasar, melainkan memastikan bahwa setiap transaksi mematuhi batasan risiko: batasan kerugian harian, ukuran lot yang terukur, dan pemasangan stop loss otomatis.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kenapa dibuat?</h4>
          <p class="m-text">Kesalahan terbesar kebanyakan orang saat belajar trading adalah faktor psikologis dan lupa pasang pengaman risiko. Robot ini dibangun untuk menghilangkan kebiasaan buruk tersebut melalui logika matematika yang baku.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kemampuan Utama</h4>
          <ul class="m-list">
            <li>Kunci batas rugi harian: bot otomatis berhenti jika batas rugi hari itu tercapai.</li>
            <li>Wajib pasang proteksi Stop Loss di setiap transaksi yang dibuka.</li>
            <li>Menghitung persentase risiko akun secara instan sebelum order dikirim.</li>
          </ul>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Alat yang Dipakai</h4>
          <div class="m-stack">
            <span>Python 3.10</span><span>MetaTrader5 Python Library</span><span>Dataclasses</span><span>Custom Journal</span>
          </div>
        </div>
      `,
      fileName: 'robot_trading_wmt/robot/trader.py',
      codeSnippet: `"""Inti robot: membuat rencana order, menjaga aturan akun, eksekusi, dan jurnal."""
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

def hitung_lot_aman(saldo_akun: float, resiko_persen: float, jarak_stop_loss_pip: float) -> float:
    """Menghitung lot transaksi agar risiko tidak melebihi batasan yang ditentukan."""
    uang_resiko = saldo_akun * (resiko_persen / 100.0)
    nilai_per_pip = 10.0 # Nilai kontrak standar per pip
    lot = uang_resiko / (jarak_stop_loss_pip * nilai_per_pip)
    return round(max(lot, 0.01), 2)`,
      renderSimulator: function(container) {
        container.innerHTML = `
          <div class="sim-box">
            <div class="sim-header">
              <h5 class="sim-title">Kalkulator Manajemen Risiko Otomatis</h5>
              <p class="sim-desc">Geser nilai saldo akun dan toleransi risiko untuk melihat bagaimana robot menghitung batas kerugian maksimal dan lot aman.</p>
            </div>
            <div class="sim-grid-form">
              <div class="sim-field">
                <label class="sim-label">SALDO AKUN ($)</label>
                <input id="wmt-saldo" type="number" value="5000" step="500" class="sim-input" oninput="hitungWmtSim()" />
              </div>
              <div class="sim-field">
                <label class="sim-label">BATAS RESIKO PER TRANSAKSI (%)</label>
                <input id="wmt-risk" type="number" value="1.5" step="0.5" min="0.5" max="5" class="sim-input" oninput="hitungWmtSim()" />
              </div>
              <div class="sim-field">
                <label class="sim-label">JARAK STOP LOSS (PIPS)</label>
                <input id="wmt-pips" type="number" value="25" step="5" class="sim-input" oninput="hitungWmtSim()" />
              </div>
            </div>
            <div class="sim-result-card" id="wmt-output">
              <!-- rendered by JS -->
            </div>
          </div>
        `;
        setTimeout(window.hitungWmtSim, 50);
      }
    },

    // 05: XAU Momentum Alert (Nama baru sesuai request)
    'xau-momentum': {
      number: 'PROYEK 05',
      title: 'XAU Momentum Alert',
      summary: 'Bot pemantau pergerakan harga komoditas emas dunia (XAU/USD) 24 jam yang langsung memicu peringatan kilat saat mendeteksi percepatan momentum harga.',
      tags: ['Python', 'API Stream', 'XAU/USD', 'Momentum Alert'],
      status: 'Eksperimen Aktif',
      simpleExpl: `
        <div class="m-section">
          <h4 class="m-section-title">Apa ini sebenarnya?</h4>
          <p class="m-text">XAU Momentum Alert adalah bot pemantau khusus untuk emas dunia (XAU/USD). Program ini bekerja seperti radar: setiap detik memeriksa kecepatan perubahan harga, dan seketika membunyikan notifikasi jika harga emas mengalami lonjakan momentum atau breakout dari batas aman.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kenapa dibuat?</h4>
          <p class="m-text">Pergerakan emas sering kali sangat volatil dan cepat, terutama saat pembukaan sesi London dan New York. Dengan bot ini, kita tidak perlu menatap grafik tanpa henti karena sistem akan otomatis mengirimkan sinyal saat momentum terjadi.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kemampuan Utama</h4>
          <ul class="m-list">
            <li>Deteksi lonjakan momentum berdasarkan ambang batas pips per menit.</li>
            <li>Pengiriman notifikasi instan ke grup chat dengan detail harga & volume.</li>
            <li>Pencatatan riwayat lonjakan harga harian untuk bahan evaluasi.</li>
          </ul>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Alat yang Dipakai</h4>
          <div class="m-stack">
            <span>Python</span><span>Broker WebSocket / REST</span><span>Momentum Calculation</span><span>Telegram Alerts</span>
          </div>
        </div>
      `,
      fileName: 'xau_bot/momentum_engine.py',
      codeSnippet: `import time
import requests

def cek_momentum_emas(harga_sekarang, harga_sebelumnya, batas_lonjakan=3.5):
    """
    Mendeteksi apakah terjadi momentum lonjakan harga emas yang signifikan.
    """
    selisih = round(harga_sekarang - harga_sebelumnya, 2)
    kecepatan_lonjakan = abs(selisih)

    if kecepatan_lonjakan >= batas_lonjakan:
        arah = "📈 LONJAKAN NAIK" if selisih > 0 else "📉 TEKANAN TURUN"
        pesan = (
            f"⚡ [XAU MOMENTUM ALERT]\\n"
            f"Arah: {arah}\\n"
            f"Harga Terkini: \${harga_sekarang:.2f}\\n"
            f"Perubahan: {selisih:+.2f} dalam rentang waktu singkat!"
        )
        kirim_notifikasi_telegram(pesan)
        return True
    return False`,
      renderSimulator: function(container) {
        container.innerHTML = `
          <div class="sim-box">
            <div class="sim-header">
              <h5 class="sim-title">Live Ticker &amp; Simulasi Momentum Emas (XAU/USD)</h5>
              <p class="sim-desc">Lihat harga simulasi emas bergerak, atau coba klik tombol pemicu lonjakan untuk melihat sistem alert bereaksi!</p>
            </div>
            <div class="sim-ticker">
              <div>
                <span class="ticker-symbol">XAU / USD</span>
                <div style="font-size:0.75rem; color:var(--gray-mid); font-family:var(--font-mono);">PASAR EMAS DUNIA</div>
              </div>
              <div class="ticker-price" id="xau-price-display">$2,648.50</div>
            </div>
            <div class="sim-btn-row">
              <button class="sim-btn" onclick="simTriggerXauSurge(true)">Simulasikan Lonjakan Naik (+$5.20)</button>
              <button class="sim-btn" onclick="simTriggerXauSurge(false)">Simulasikan Penurunan Cepat (-$6.10)</button>
            </div>
            <div id="xau-alert-log" style="margin-top:1rem; font-family:var(--font-mono); font-size:0.82rem; padding:0.8rem; background:var(--black-elev); border-radius:6px; border:1px solid var(--border); color:var(--gray-light);">
              Status: Pemantau momentum aktif... Menunggu fluktuasi besar.
            </div>
          </div>
        `;
        startLiveXauTicker();
      }
    },

    // 06: Backtesting Engine
    backtest: {
      number: 'PROYEK 06',
      title: 'Simulasi Strategi Pasar (Backtesting)',
      summary: 'Program penguji logika trading menggunakan ribuan data harga masa lalu untuk menguji tingkat kemenangan (win rate) dan probabilitas keuntungan secara objektif.',
      tags: ['Python', 'Pandas', 'NumPy', 'Statistik Data'],
      status: 'Riset Aktif',
      simpleExpl: `
        <div class="m-section">
          <h4 class="m-section-title">Apa ini sebenarnya?</h4>
          <p class="m-text">Sebelum mencoba strategi apapun dengan dana sungguhan, program ini menjalankan simulasi matematis ke ribuan baris data harga di masa lampau. Dari situ kita bisa tahu secara pasti: berapa kali strategi ini menang, berapa kali rugi, dan seberapa besar potensi penurunan modal maksimalnya (drawdown).</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kenapa dibuat?</h4>
          <p class="m-text">Untuk melatih kemampuan analisis data secara objektif menggunakan Python, menghindari tebak-tebakan atau prasangka, serta memahami bagaimana data probabilitas bekerja di dunia nyata.</p>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Kemampuan Utama</h4>
          <ul class="m-list">
            <li>Mengolah ribuan baris candlestick harga menggunakan pustaka Pandas.</li>
            <li>Menghitung metrik performa: Win Rate, Profit Factor, dan Maximum Drawdown.</li>
            <li>Menyajikan hasil simulasi dalam format angka yang objektif tanpa bias.</li>
          </ul>
        </div>
        <div class="m-section">
          <h4 class="m-section-title">Alat yang Dipakai</h4>
          <div class="m-stack">
            <span>Python</span><span>Pandas DataFrames</span><span>NumPy Math</span><span>Matplotlib</span>
          </div>
        </div>
      `,
      fileName: 'backtesting/engine.py',
      codeSnippet: `import pandas as pd
import numpy as np

def jalankan_simulasi(df_harga, strategi_func):
    """
    Menjalankan simulasi pengujian strategi pada DataFrame harga historis.
    """
    df = df_harga.copy()
    df['sinyal'] = strategi_func(df)
    
    # Hitung persentase perubahan harga harian
    df['return_pasar'] = df['close'].pct_change()
    df['return_strategi'] = df['sinyal'].shift(1) * df['return_pasar']
    
    total_profit = (1 + df['return_strategi']).cumprod().iloc[-1] - 1
    win_trades = len(df[df['return_strategi'] > 0])
    total_trades = len(df[df['return_strategi'] != 0])
    win_rate = (win_trades / total_trades * 100) if total_trades > 0 else 0
    
    return {
        'total_profit_persen': round(total_profit * 100, 2),
        'win_rate': round(win_rate, 2),
        'total_transaksi': total_trades
    }`,
      renderSimulator: function(container) {
        container.innerHTML = `
          <div class="sim-box">
            <div class="sim-header">
              <h5 class="sim-title">Mesin Uji Simulasi 100 Transaksi</h5>
              <p class="sim-desc">Ubah tingkat kemenangan (Win Rate) dan rasio Risk-Reward untuk melihat hasil simulasi probabilitas akun setelah 100 transaksi.</p>
            </div>
            <div class="sim-grid-form">
              <div class="sim-field">
                <label class="sim-label">ESTIMASI WIN RATE (%)</label>
                <input id="bt-winrate" type="range" min="30" max="75" value="55" class="sim-input" oninput="simRunBacktest()" />
                <span id="bt-winrate-val" style="font-family:var(--font-mono); font-size:0.8rem; color:var(--pure-white);">55%</span>
              </div>
              <div class="sim-field">
                <label class="sim-label">RASIO RISK : REWARD</label>
                <select id="bt-rr" class="sim-input" onchange="simRunBacktest()">
                  <option value="1.5">1 : 1.5 (Rugi 1R, Menang 1.5R)</option>
                  <option value="2.0" selected>1 : 2.0 (Rugi 1R, Menang 2.0R)</option>
                  <option value="3.0">1 : 3.0 (Rugi 1R, Menang 3.0R)</option>
                </select>
              </div>
            </div>
            <div class="sim-result-card" id="bt-output">
              <!-- rendered by JS -->
            </div>
          </div>
        `;
        setTimeout(window.simRunBacktest, 50);
      }
    }
  };


  /* ------------------------------------------------------------------------
     8. MODAL LOGIC: OPEN, RENDER 3 TABS, COPY CODE & LIVE PLAYGROUNDS
     ------------------------------------------------------------------------ */
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close');
  const modalInner = document.getElementById('modal-inner');

  function openProjectModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    // Render Modal with 3 Tabs
    modalInner.innerHTML = `
      <div class="m-header">
        <div class="m-num">${data.number}</div>
        <div class="m-tags">
          ${data.tags.map((t) => `<span class="pt">${t}</span>`).join('')}
          <span class="pstatus done">${data.status}</span>
        </div>
        <h3 class="m-title">${data.title}</h3>
        <p class="m-summary">${data.summary}</p>
      </div>

      <!-- 3 Navigation Tabs -->
      <div class="m-tabs-nav">
        <button class="m-tab-btn active" data-tab="tab-desc">Penjelasan &amp; Fitur</button>
        <button class="m-tab-btn" data-tab="tab-code">Source Code Asli</button>
        <button class="m-tab-btn" data-tab="tab-sim">⚡ Simulasi Interaktif</button>
      </div>

      <!-- Tab 1: Explanation -->
      <div class="m-tab-pane active" id="tab-desc">
        ${data.simpleExpl}
      </div>

      <!-- Tab 2: Code Viewer -->
      <div class="m-tab-pane" id="tab-code">
        <div class="code-wrap">
          <div class="code-header">
            <span class="code-fname">${data.fileName}</span>
            <button class="code-copy" id="btn-copy-code">Salin Kode</button>
          </div>
          <pre class="code-block" id="modal-code-snippet"><code>${escapeHtml(data.codeSnippet)}</code></pre>
        </div>
        <p class="code-note">Cuplikan kode di atas adalah bagian logika asli dari file proyek ini di repositori lokal Nadif.</p>
      </div>

      <!-- Tab 3: Interactive Simulation -->
      <div class="m-tab-pane" id="tab-sim">
        <div id="sim-container"></div>
      </div>
    `;

    // Render Simulator into Tab 3
    const simContainer = modalInner.querySelector('#sim-container');
    if (simContainer && typeof data.renderSimulator === 'function') {
      data.renderSimulator(simContainer);
    }

    // Tab switching event
    const tabBtns = modalInner.querySelectorAll('.m-tab-btn');
    const tabPanes = modalInner.querySelectorAll('.m-tab-pane');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        tabPanes.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetPane = modalInner.querySelector(`#${targetId}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Copy Code button event
    const copyCodeBtn = modalInner.querySelector('#btn-copy-code');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(data.codeSnippet).then(() => {
          copyCodeBtn.textContent = 'Tersalin! ✓';
          showToast('Kode berhasil disalin ke clipboard!');
          setTimeout(() => {
            copyCodeBtn.textContent = 'Salin Kode';
          }, 2500);
        }).catch(() => {
          showToast('Gagal menyalin kode.');
        });
      });
    }

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    stopLiveXauTicker();
  }

  // Open modal on card click
  projectCards.forEach((card) => {
    card.addEventListener('click', () => {
      const pId = card.getAttribute('data-id');
      if (pId) openProjectModal(pId);
    });
  });

  // Close modal events
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeProjectModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeProjectModal();
    }
  });


  /* ------------------------------------------------------------------------
     9. INTERACTIVE SIMULATION FUNCTIONS (WINDOW SCOPED)
     ------------------------------------------------------------------------ */

  // 1) MarketLens Chat Simulator
  window.simMarketChat = function(cmd) {
    const win = document.getElementById('chat-win');
    if (!win) return;

    // Append user message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-bubble user';
    userDiv.textContent = cmd;
    win.appendChild(userDiv);

    // Bot response
    setTimeout(() => {
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-bubble bot';

      if (cmd === '/brief') {
        botDiv.innerHTML = `🤖 <strong>MarketAI:</strong> 🌅 Ringkasan Pagi:<br/>• Emas (XAU): $2,648 (+0.6%)<br/>• Sentimen: Waspada rilis data suku bunga<br/>• Rekomendasi: Tunggu konfirmasi breakout.`;
      } else if (cmd === '/analisis XAU') {
        botDiv.innerHTML = `🤖 <strong>MarketAI:</strong> 📊 Analisis XAU/USD:<br/>Area support terdekat di $2,635, resisten di $2,660. Volume beli stabil di sesi Asia.`;
      } else {
        botDiv.innerHTML = `🤖 <strong>MarketAI:</strong> 📈 Status Pasar:<br/>Indeks bergerak sideways dalam range aman. Tidak terdeteksi anomali volume.`;
      }

      win.appendChild(botDiv);
      win.scrollTop = win.scrollHeight;
    }, 400);
  };

  // 2) ClassMate Absensi Simulator
  window.simTapAbsen = function() {
    const log = document.getElementById('sim-absen-log');
    if (!log) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID');
    const isLate = now.getHours() >= 7 && now.getMinutes() > 15;
    const status = isLate ? 'Terlambat' : 'Tepat Waktu';

    log.innerHTML = `
      <div style="color:var(--pure-white); font-weight:600; margin-bottom:4px;">✅ Absensi Sukses Terverifikasi!</div>
      Waktu Tercatat: ${timeStr} WIB<br/>
      Status Kehadiran: <span style="color:var(--pure-white); text-decoration:underline;">${status}</span><br/>
      Lokasi: Presensi Sekolah SMK N 1 Kebumen
    `;
    showToast('Kehadiran siswa berhasil dicatat ke sistem!');
  };

  // 3) Kasir Calculator Simulator
  window.hitungKasirSim = function() {
    const harga = parseInt(document.getElementById('kasir-item')?.value || '5000');
    const qty = parseInt(document.getElementById('kasir-qty')?.value || '1');
    const bayar = parseInt(document.getElementById('kasir-bayar')?.value || '0');
    const out = document.getElementById('kasir-output');
    if (!out) return;

    const total = harga * qty;
    const kembalian = bayar - total;

    out.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--gray-mid);">TOTAL TRANSAKSI:</span>
        <span style="font-family:var(--font-mono); font-size:1.1rem; font-weight:700; color:var(--pure-white);">Rp ${total.toLocaleString('id-ID')}</span>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--gray-mid);">UANG KEMBALIAN:</span>
        <span style="font-family:var(--font-mono); font-size:1.1rem; font-weight:700; color:${kembalian >= 0 ? 'var(--pure-white)' : '#888'};">
          ${kembalian >= 0 ? 'Rp ' + kembalian.toLocaleString('id-ID') : 'Kurang Rp ' + Math.abs(kembalian).toLocaleString('id-ID')}
        </span>
      </div>
    `;
  };

  // 4) WMT Risk Simulator
  window.hitungWmtSim = function() {
    const saldo = parseFloat(document.getElementById('wmt-saldo')?.value || '5000');
    const riskPct = parseFloat(document.getElementById('wmt-risk')?.value || '1.5');
    const pips = parseFloat(document.getElementById('wmt-pips')?.value || '25');
    const out = document.getElementById('wmt-output');
    if (!out) return;

    const maxLossDollar = saldo * (riskPct / 100);
    const lotSize = Math.max(0.01, (maxLossDollar / (pips * 10))).toFixed(2);

    out.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <div style="font-size:0.75rem; color:var(--gray-mid); font-family:var(--font-mono);">BATAS RUGI MAKSIMAL</div>
          <div class="sim-res-val">$${maxLossDollar.toFixed(2)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--gray-mid); font-family:var(--font-mono);">UKURAN LOT OTOMATIS</div>
          <div class="sim-res-val">${lotSize} Lot</div>
        </div>
      </div>
      <div style="font-size:0.76rem; color:var(--gray-mid); margin-top:8px;">
        *Robot WMT akan otomatis menolak eksekusi jika lot melebihi batasan keamanan ini.
      </div>
    `;
  };

  // 5) XAU Live Ticker & Alert Simulator
  let xauTimer = null;
  let currentXauPrice = 2648.50;

  function startLiveXauTicker() {
    stopLiveXauTicker();
    xauTimer = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.4;
      currentXauPrice = +(currentXauPrice + delta).toFixed(2);
      const el = document.getElementById('xau-price-display');
      if (el) el.textContent = `$${currentXauPrice.toFixed(2)}`;
    }, 1800);
  }

  function stopLiveXauTicker() {
    if (xauTimer) { clearInterval(xauTimer); xauTimer = null; }
  }

  window.simTriggerXauSurge = function(isUp) {
    const delta = isUp ? 5.20 : -6.10;
    currentXauPrice = +(currentXauPrice + delta).toFixed(2);
    const el = document.getElementById('xau-price-display');
    if (el) {
      el.textContent = `$${currentXauPrice.toFixed(2)}`;
      el.style.color = '#ffffff';
      setTimeout(() => { el.style.color = ''; }, 800);
    }

    const log = document.getElementById('xau-alert-log');
    if (log) {
      const direction = isUp ? 'LONJAKAN NAIK (BULLISH)' : 'PENURUNAN TAJAM (BEARISH)';
      log.innerHTML = `
        <div style="color:var(--pure-white); font-weight:700;">⚡ [MOMENTUM ALERT DIPICU!]</div>
        Arah: <strong>${direction}</strong><br/>
        Harga Terkini: $${currentXauPrice.toFixed(2)} (${isUp ? '+' : ''}${delta.toFixed(2)})<br/>
        Notifikasi pesan telegram telah berhasil dikirimkan secara otomatis!
      `;
    }
    showToast('Peringatan momentum emas terpicu!');
  };

  // 6) Backtesting Simulator
  window.simRunBacktest = function() {
    const wr = parseInt(document.getElementById('bt-winrate')?.value || '55');
    const rr = parseFloat(document.getElementById('bt-rr')?.value || '2.0');
    const wrVal = document.getElementById('bt-winrate-val');
    if (wrVal) wrVal.textContent = `${wr}%`;

    const out = document.getElementById('bt-output');
    if (!out) return;

    const totalTrades = 100;
    const wins = Math.round(totalTrades * (wr / 100));
    const losses = totalTrades - wins;
    const netR = (wins * rr) - (losses * 1.0);
    const profitPct = (netR * 1.5).toFixed(1);

    out.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <div style="font-size:0.75rem; color:var(--gray-mid); font-family:var(--font-mono);">HASIL 100 TRADE</div>
          <div class="sim-res-val">${wins} Menang / ${losses} Kalah</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--gray-mid); font-family:var(--font-mono);">ESTIMASI PROFIT BERSIH</div>
          <div class="sim-res-val" style="color:var(--pure-white);">${profitPct > 0 ? '+' : ''}${profitPct}%</div>
        </div>
      </div>
      <div style="font-size:0.78rem; color:var(--gray-mid); margin-top:8px;">
        Ekspektasi Matematis: ${netR > 0 ? 'Strategi memiliki keunggulan positif (Edge Positif) ✓' : 'Strategi berisiko negatif dalam jangka panjang ✗'}
      </div>
    `;
  };


  /* ------------------------------------------------------------------------
     10. TOAST NOTIFICATION & EMAIL COPY
     ------------------------------------------------------------------------ */
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  window.copyEmail = function () {
    const email = 'nadifpranasaputra@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      showToast('Email nadifpranasaputra@gmail.com berhasil disalin! ✓');
      const label = document.getElementById('email-label');
      if (label) {
        label.textContent = 'Tersalin! ✓';
        setTimeout(() => {
          label.textContent = 'Salin Email';
        }, 2500);
      }
    }).catch(() => {
      showToast('Gagal menyalin: ' + email);
    });
  };

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

});
