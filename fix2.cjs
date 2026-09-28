const fs = require('fs');

// 1. Fix Vegetables.jsx validate function
const vegFile = '/home/jagrat/Documents/pitch/veggie-vendor/src/pages/Vegetables.jsx';
let vegContent = fs.readFileSync(vegFile, 'utf8');

const validateStart = vegContent.indexOf('function validate(f) {');
const validateEnd = vegContent.indexOf('}', validateStart) + 1;

const newValidate = `  function validate(f) {
    const e = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!f.purchasePrice || f.purchasePrice <= 0) e.purchasePrice = 'Must be > 0';
    if (!f.sellingPrice || f.sellingPrice <= 0) e.sellingPrice = 'Must be > 0';
    if (parseFloat(f.sellingPrice) <= parseFloat(f.purchasePrice)) e.sellingPrice = 'Must be > purchase price';
    if (!f.availableQuantity || f.availableQuantity < 0) e.availableQuantity = 'Must be >= 0';
    if (!f.expectedDemand || f.expectedDemand <= 0) e.expectedDemand = 'Must be > 0';
    return e;
  }`;

if (validateStart !== -1) {
  vegContent = vegContent.substring(0, validateStart) + newValidate + vegContent.substring(validateEnd);
  fs.writeFileSync(vegFile, vegContent);
  console.log("Fixed Vegetables.jsx validate()");
}

// 2. Fix DemandForecast.jsx
const dfFile = '/home/jagrat/Documents/pitch/veggie-vendor/src/pages/DemandForecast.jsx';
let dfContent = fs.readFileSync(dfFile, 'utf8');
dfContent = dfContent.replace(/t\.7dayForecast/g, "t['7dayForecast']");
fs.writeFileSync(dfFile, dfContent);
console.log("Fixed DemandForecast.jsx");

// 3. Fix LPPEngine.jsx
const lppFile = '/home/jagrat/Documents/pitch/veggie-vendor/src/pages/LPPEngine.jsx';
let lppContent = fs.readFileSync(lppFile, 'utf8');
lppContent = lppContent.replace(/t\.100Optimized/g, "t['100Optimized']");
fs.writeFileSync(lppFile, lppContent);
console.log("Fixed LPPEngine.jsx");
