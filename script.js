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

// Support for Enter Key
function handleKeyPress(e) {
  if (e.key === "Enter") {
    checkPassword();
  }
}

function logout() {
  window.location.href = "https://agcneranga.github.io/LS-Publication/";
}

let processedRaces = [];
let currentDisplayMode = 'block'; // Track mode for refresh

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
  const meetingsFilter = meetingsRaw
    ? meetingsRaw.split(',').map(m => m.trim().toUpperCase()).filter(m => m.length > 0)
    : [];

  if (!text.trim()) {
    alert('Please paste race card text first.');
    return;
  }

  const lines = text.split(/\r?\n/);
  let currentMeeting = 'Unknown';
  let raceNumberCounter = 0;
  let races = [];

  const explicitRaceLineRegex = /^([\w]+(?:\s*\/\s*\d+)?)[\s]+(\d{1,2}[—:]\d{2})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^[A-Z\s\-']{1,30}$/.test(line) && !line.match(/\d/) && !line.includes('£')) {
      currentMeeting = line;
      raceNumberCounter = 0;
      continue;
    }

    let explicitMatch = line.match(explicitRaceLineRegex);
    if (explicitMatch) {
      const raceNumber = explicitMatch[1].trim();
      const ukTime = explicitMatch[2];
      let slTime = 'N/A';
      let prize = 0;
      let raceNameLines = [];

      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const l = lines[j].trim();
        if (slTime === 'N/A' && /^\(?\d{1,2}[:.]\d{2}\)?$/.test(l)) {
          slTime = l.replace(/[()]/g, '');
          continue;
        }
        if (l.includes('£')) {
          const pMatch = l.match(/£([\d,]+)/);
          if (pMatch) prize = parseInt(pMatch[1].replace(/,/g, ''));
          break;
        }
        if (l.length > 2 && !/^\(?\d{1,2}[.:]\d{2}\)?$/.test(l)) {
          raceNameLines.push(l);
        }
      }
      
      let raceName = raceNameLines.join(' ');
      if (meetingsFilter.length && !meetingsFilter.includes(currentMeeting.toUpperCase())) continue;
      if (prize >= minPrize && prize <= maxPrize) {
        races.push({meeting: currentMeeting, raceNumber, ukTime, rawSLTime: slTime, raceName, prize});
      }
      continue;
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
    let html = `
      <table class="vip-table">
        <thead>
          <tr>
            <th>Meeting</th>
            <th>No.</th>
            <th>UK Time</th>
            <th>SL Time</th>
            <th>Race Name</th>
            <th>Prize (£)</th>
          </tr>
        </thead>
        <tbody>
    `;
    races.forEach(r => {
      html += `
        <tr>
          <td>${r.meeting}</td>
          <td>${r.raceNumber}</td>
          <td>${r.ukTime}</td>
          <td>${r.rawSLTime}</td>
          <td>${escapeHtml(r.raceName)}</td>
          <td>${r.prize.toLocaleString()}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    output.innerHTML = html;
  } else {
    output.innerHTML = races.map(r => `
      <div class="race-block">
        <div class="race-meeting"><strong>Race Course:</strong> ${r.meeting}</div>
        <div class="race-number"><strong>Race Number:</strong> ${r.raceNumber}</div>
        <div class="race-time"><strong>UK Time:</strong> ${r.ukTime} | <strong>SL Time:</strong> ${r.rawSLTime}</div>
        <div class="race-name"><strong>Race Name:</strong> ${escapeHtml(r.raceName)}</div>
        <div class="race-prize"><strong>Prize Money:</strong> £${r.prize.toLocaleString()}</div>
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
    if (!bestRaces[r.meeting] || r.prize > bestRaces[r.meeting].prize) {
      bestRaces[r.meeting] = r;
    }
  });
  renderRaces(Object.values(bestRaces).sort((a, b) => b.prize - a.prize));
}

function downloadPDF() {
  if (!processedRaces.length) { alert("No data to download."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("UK RAFFLE-ELIGIBLE RACES REPORT", 14, 15);
  doc.setFontSize(10);
  doc.text("Generated via VIP Dashboard Access", 14, 22);
  const tableData = processedRaces.map(r => [
    r.meeting, r.raceNumber, r.ukTime, r.rawSLTime, r.raceName, r.prize.toLocaleString()
  ]);
  doc.autoTable({
    head: [['Meeting', 'No.', 'UK Time', 'SL Time', 'Race Name', 'Prize (£)']],
    body: tableData,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [67, 160, 71] }
  });
  const finalY = doc.lastAutoTable.finalY || 30;
  doc.text("Copyright © 2025. VIP Premium Publication - Charith Neranga.", 14, finalY + 10);
  doc.save("VIP_Race_Report.pdf");
}

function downloadTXT() {
  if (!processedRaces.length) { alert("No data available."); return; }
  let textContent = "UK RAFFLE-ELIGIBLE RACES REPORT\nHeader: VIP Access Report\n========================================\n\n";
  processedRaces.forEach((r, index) => {
    textContent += `Race #${index + 1}\nCourse: ${r.meeting}\nNo: ${r.raceNumber}\nUK: ${r.ukTime} | SL: ${r.rawSLTime}\nName: ${r.raceName}\nPrize: £${r.prize.toLocaleString()}\n----------------------------------------\n`;
  });
  textContent += "\nFooter: Copyright © 2025 Charith Neranga.";
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = "Races_Report.txt";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// NEW FUNCTION: Stables TXT Output format
function downloadStablesTXT() {
  if (!processedRaces.length) { alert("No data available."); return; }
  let textContent = "";
  processedRaces.forEach((r) => {
    textContent += `UK TIME: ${r.ukTime}\n`;
    textContent += `SL TIME: ${r.rawSLTime}\n`;
    textContent += `RACE COURSE: ${r.meeting}\n`;
    textContent += `RACE NAME: ${r.raceName}\n`;
    textContent += `Prize MONEY: £${r.prize.toLocaleString()}\n\n`;
  });
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = "Stables_Output.txt";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
