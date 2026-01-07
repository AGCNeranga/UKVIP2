/**
 * PROJECT: VIP RAFFLE-ELIGIBLE RACES
 * AUTHOR: Charith Neranga
 * OWNERSHIP: LS Publication Dept. © 2026
 * CANARY ID: LSPUB-JS-2026-X99
 */

// === Source Protection Logic ===

// 1. Disable Right-Click
document.addEventListener('contextmenu', event => event.preventDefault());

// 2. Disable Keyboard Shortcuts (F12, Ctrl+U, Ctrl+Shift+I, etc.)
document.onkeydown = function(e) {
  // F12
  if (e.keyCode === 123) return false;
  // Ctrl+Shift+I (Inspect)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) return false;
  // Ctrl+Shift+J (Console)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 74) return false;
  // Ctrl+U (View Source)
  if (e.ctrlKey && e.keyCode === 85) return false;
};

// === Password & Redirect Logic ===
function checkPassword() {
  const entered = document.getElementById("password").value;
  if (entered === "lal1234") {
    document.getElementById("passwordScreen").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
  } else {
    alert("Incorrect VIP Password!");
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    checkPassword();
  }
}

function logout() {
  window.location.href = "https://agcneranga.github.io/LS-Publication/";
}

let processedRaces = [];
let currentDisplayMode = 'block';

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clearAll() {
  document.getElementById('raceText').value = '';
  document.getElementById('meetingsInput').value = '';
  document.getElementById('minPrize').value = '';
  document.getElementById('maxPrize').value = '';
  document.getElementById('output').innerHTML = '';
  processedRaces = [];
}

function processText(mode = 'block') {
  currentDisplayMode = mode;
  const text = document.getElementById('raceText').value;
  const minPrize = parseInt(document.getElementById('minPrize').value || 0);
  const maxPrize = parseInt(document.getElementById('maxPrize').value || 99999999);
  const meetingsRaw = document.getElementById('meetingsInput').value;
  const meetingsFilter = meetingsRaw ? meetingsRaw.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length > 0) : [];

  if (!text.trim()) { alert('Please paste race card text first.'); return; }

  const lines = text.split(/\r?\n/);
  let currentMeeting = 'Unknown';
  let races = [];
  const explicitRaceLineRegex = /^([\w]+(?:\s*\/\s*\d+)?)[\s]+(\d{1,2}[—:]\d{2})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^[A-Z\s\-']{1,30}$/.test(line) && !line.match(/\d/) && !line.includes('£')) {
      currentMeeting = line;
      continue;
    }

    let explicitMatch = line.match(explicitRaceLineRegex);
    if (explicitMatch) {
      const raceNumber = explicitMatch[1].trim();
      const ukTime = explicitMatch[2];
      let slTime = 'N/A', prize = 0, raceNameLines = [];

      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const l = lines[j].trim();
        if (slTime === 'N/A' && /^\(?\d{1,2}[:.]\d{2}\)?$/.test(l)) { slTime = l.replace(/[()]/g, ''); continue; }
        if (l.includes('£')) {
          const pMatch = l.match(/£([\d,]+)/);
          if (pMatch) prize = parseInt(pMatch[1].replace(/,/g, ''));
          break;
        }
        if (l.length > 2 && !/^\(?\d{1,2}[.:]\d{2}\)?$/.test(l)) { raceNameLines.push(l); }
      }
      
      if (meetingsFilter.length && !meetingsFilter.includes(currentMeeting.toUpperCase())) continue;
      if (prize >= minPrize && prize <= maxPrize) {
        races.push({meeting: currentMeeting, raceNumber, ukTime, rawSLTime: slTime, raceName: raceNameLines.join(' '), prize});
      }
    }
  }

  races.sort((a, b) => {
    const timeToMinutes = t => {
      if (t === 'N/A') return 9999;
      const parts = t.split(/[:.]/).map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };
    return timeToMinutes(a.rawSLTime) - timeToMinutes(b.rawSLTime);
  });

  processedRaces = races;
  renderRaces(races, mode);
}

function renderRaces(races, mode = currentDisplayMode) {
  const output = document.getElementById('output');
  if (mode === 'table') {
    let html = `<table class="vip-table"><thead><tr><th>Meeting</th><th>No.</th><th>UK Time</th><th>SL Time</th><th>Race Name</th><th>Prize (£)</th></tr></thead><tbody>`;
    races.forEach(r => {
      html += `<tr><td>${r.meeting}</td><td>${r.raceNumber}</td><td>${r.ukTime}</td><td>${r.rawSLTime}</td><td>${escapeHtml(r.raceName)}</td><td>${r.prize.toLocaleString()}</td></tr>`;
    });
    html += `</tbody></table>`;
    output.innerHTML = html;
  } else {
    output.innerHTML = races.map(r => `
      <div class="race-block">
        <div><strong>Race Course:</strong> ${r.meeting}</div>
        <div><strong>Race Number:</strong> ${r.raceNumber}</div>
        <div><strong>UK Time:</strong> ${r.ukTime} | <strong>SL Time:</strong> ${r.rawSLTime}</div>
        <div><strong>Race Name:</strong> ${escapeHtml(r.raceName)}</div>
        <div><strong>Prize Money:</strong> £${r.prize.toLocaleString()}</div>
      </div>
    `).join('');
  }
}

function showTopRaces(limit) {
  if (!processedRaces.length) { alert("Please process races first."); return; }
  const topRaces = [...processedRaces].sort((a, b) => b.prize - a.prize).slice(0, limit);
  renderRaces(topRaces);
}

function showBestRacePerMeeting() {
  if (!processedRaces.length) { alert("Please process races first."); return; }
  const bestRaces = {};
  processedRaces.forEach(r => {
    if (!bestRaces[r.meeting] || r.prize > bestRaces[r.meeting].prize) { bestRaces[r.meeting] = r; }
  });
  renderRaces(Object.values(bestRaces).sort((a, b) => b.prize - a.prize));
}

function downloadPDF() {
  if (!processedRaces.length) { alert("No data to download."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("UK RAFFLE-ELIGIBLE RACES REPORT", 14, 15);
  const tableData = processedRaces.map(r => [r.meeting, r.raceNumber, r.ukTime, r.rawSLTime, r.raceName, r.prize.toLocaleString()]);
  doc.autoTable({
    head: [['Meeting', 'No.', 'UK Time', 'SL Time', 'Race Name', 'Prize (£)']],
    body: tableData,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [67, 160, 71] }
  });
  doc.setFontSize(10);
  doc.text("© 2026 | LS Publication Dept.", 14, doc.lastAutoTable.finalY + 10);
  doc.save("VIP_Race_Report.pdf");
}

function downloadTXT() {
  if (!processedRaces.length) { alert("No data available."); return; }
  let textContent = "UK RAFFLE-ELIGIBLE RACES REPORT\n========================================\n\n";
  processedRaces.forEach((r, index) => {
    textContent += `Race #${index + 1}\nCourse: ${r.meeting}\nNo: ${r.raceNumber}\nUK: ${r.ukTime} | SL: ${r.rawSLTime}\nName: ${r.raceName}\nPrize: £${r.prize.toLocaleString()}\n----------------------------------------\n`;
  });
  textContent += "\n© 2026 | LS Publication Dept.";
  const blob = new Blob([textContent], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "Races_Report.txt";
  a.click();
}

function downloadStablesTXT() {
  if (!processedRaces.length) { alert("No data available."); return; }
  let textContent = "";
  processedRaces.forEach((r) => {
    textContent += `UK TIME: ${r.ukTime}\nSL TIME: ${r.rawSLTime}\nRACE COURSE: ${r.meeting}\nRACE NAME: ${r.raceName}\nPrize MONEY: £${r.prize.toLocaleString()}\n\n`;
  });
  textContent += "© 2026 | LS Publication Dept.";
  const blob = new Blob([textContent], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "Stables_Output.txt";
  a.click();
}
