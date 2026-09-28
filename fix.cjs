const fs = require('fs');
const file = '/home/jagrat/Documents/pitch/veggie-vendor/src/pages/Vegetables.jsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    if (!f.purchasePrice || f.purchasePrice <= 0) e.purchasePrice = 'Must be > {t.0IfFsellingpriceFsellingprice || \\'0\\\\';
    if (!f.sellingPrice || f.sellingPrice'} <= 0) e.sellingPrice = 'Must be > {t.0IfParsefloatfsellingprice || \\'0\\\\';
    if (parseFloat(f.sellingPrice)'} <= parseFloat(f.purchasePrice)) e.sellingPrice = 'Must be > {t.purchasePriceIfFavailablequantityFavailablequantity || \\'purchase price\\\\';
    if (!f.availableQuantity || f.availableQuantity'} < 0) e.availableQuantity = 'Must be ≥ 0';
    if (!f.expectedDemand || f.expectedDemand <= 0) e.expectedDemand = 'Must be > 0';`;

const replacement1 = `    if (!f.purchasePrice || f.purchasePrice <= 0) e.purchasePrice = 'Must be > 0';
    if (!f.sellingPrice || f.sellingPrice <= 0) e.sellingPrice = 'Must be > 0';
    if (parseFloat(f.sellingPrice) <= parseFloat(f.purchasePrice)) e.sellingPrice = 'Must be > purchase price';
    if (!f.availableQuantity || f.availableQuantity < 0) e.availableQuantity = 'Must be >= 0';
    if (!f.expectedDemand || f.expectedDemand <= 0) e.expectedDemand = 'Must be > 0';`;

const target2 = `                  const wRisk = veg.wastageRate >= 15 ? 'High' : veg.wastageRate >{t.8MediumLowReturn || '= 8 ? \\'Medium\\' : \\'Low\\';
                  return ('}`;

const replacement2 = `                  const wRisk = veg.wastageRate >= 15 ? 'High' : veg.wastageRate >= 8 ? 'Medium' : 'Low';
                  return (`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log("Replaced target1");
} else {
    console.log("Could not find target1");
    // fallback
    const lines = content.split('\\n');
    lines[54] = "    if (!f.purchasePrice || f.purchasePrice <= 0) e.purchasePrice = 'Must be > 0';";
    lines[55] = "    if (!f.sellingPrice || f.sellingPrice <= 0) e.sellingPrice = 'Must be > 0';";
    lines[56] = "    if (parseFloat(f.sellingPrice) <= parseFloat(f.purchasePrice)) e.sellingPrice = 'Must be > purchase price';";
    lines[57] = "    if (!f.availableQuantity || f.availableQuantity < 0) e.availableQuantity = 'Must be >= 0';";
    lines[58] = "    if (!f.expectedDemand || f.expectedDemand <= 0) e.expectedDemand = 'Must be > 0';";
    content = lines.join('\\n');
    console.log("Used fallback line replacement for target1");
}

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    console.log("Replaced target2");
} else {
    console.log("Could not find target2");
    const lines = content.split('\\n');
    lines[158] = "                  const wRisk = veg.wastageRate >= 15 ? 'High' : veg.wastageRate >= 8 ? 'Medium' : 'Low';";
    lines[159] = "                  return (";
    content = lines.join('\\n');
    console.log("Used fallback line replacement for target2");
}

fs.writeFileSync(file, content);
console.log("Done");
