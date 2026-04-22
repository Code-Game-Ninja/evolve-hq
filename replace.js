const fs = require('fs');
const files = [
  'src/components/dashboard/profile-card.tsx',
  'src/components/dashboard/progress-time-card.tsx',
  'src/components/dashboard/weekly-schedule-card.tsx',
  'src/components/dashboard/daily-update-card.tsx',
  'src/components/dashboard/upcoming-tasks-card.tsx',
  'src/app/(workspace)/dashboard/dashboard-client.tsx'
];
const replacements = [
  [/backdrop-blur-lg border border-\[\#dddddd\]/g, 'backdrop-blur-xl border border-white/10'],
  [/backgroundColor: "rgba\(241,239,237,0\.45\)"/g, 'backgroundColor: "rgba(11, 17, 32, 0.6)"'],
  [/backgroundColor: "rgba\(10,10,10,0\.88\)"/g, 'backgroundColor: "rgba(11, 17, 32, 0.6)"'],
  [/color: "\#1a1a1a"/g, 'color: "#ffffff"'],
  [/color: "\#292929"/g, 'color: "#ffffff"'],
  [/color: "\#555"/g, 'color: "rgba(255,255,255,0.7)"'],
  [/color: "\#888"/g, 'color: "rgba(255,255,255,0.5)"'],
  [/color: "\#737373"/g, 'color: "rgba(255,255,255,0.6)"'],
  [/color: "\#bbb"/g, 'color: "rgba(255,255,255,0.4)"'],
  [/color: "\#ccc"/g, 'color: "rgba(255,255,255,0.3)"'],
  [/color: "\#ddd"/g, 'color: "rgba(255,255,255,0.2)"'],
  [/backgroundColor: "rgba\(0,0,0,0\.06\)"/g, 'backgroundColor: "rgba(255,255,255,0.06)"'],
  [/backgroundColor: "rgba\(0,0,0,0\.05\)"/g, 'backgroundColor: "rgba(255,255,255,0.05)"'],
  [/backgroundColor: "rgba\(0,0,0,0\.04\)"/g, 'backgroundColor: "rgba(255,255,255,0.04)"'],
  [/backgroundColor: "rgba\(0,0,0,0\.03\)"/g, 'backgroundColor: "rgba(255,255,255,0.03)"'],
  [/backgroundColor: "rgba\(0,0,0,0\.08\)"/g, 'backgroundColor: "rgba(255,255,255,0.08)"'],
  [/backgroundColor: "rgba\(255,255,255,0\.6\)"/g, 'backgroundColor: "rgba(255,255,255,0.05)"'],
  [/backgroundColor: "rgba\(255,255,255,0\.5\)"/g, 'backgroundColor: "rgba(255,255,255,0.03)"'],
  [/hover:bg-black\/\[0\.07\]/g, 'hover:bg-white/[0.07]'],
  [/hover:bg-black\/\[0\.06\]/g, 'hover:bg-white/[0.06]'],
  [/hover:bg-black\/\[0\.03\]/g, 'hover:bg-white/[0.03]'],
  [/hover:bg-black\/5/g, 'hover:bg-white/5'],
  [/borderTop: "1px dashed rgba\(0,0,0,0\.04\)"/g, 'borderTop: "1px dashed rgba(255,255,255,0.04)"'],
  [/borderColor: "rgba\(0,0,0,0\.08\)"/g, 'borderColor: "rgba(255,255,255,0.08)"'],
  [/backgroundColor: "\#0a0a0a"/g, 'backgroundColor: "#ffffff"'],
  [/border border-\[rgba\(255,255,255,0\.08\)\]/g, 'border border-white/10']
];
for(let file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    for(let [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  } catch (e) {
    console.error("Failed on", file, e.message);
  }
}
