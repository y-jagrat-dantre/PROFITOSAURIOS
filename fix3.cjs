const fs = require('fs');

const lppFile = '/home/jagrat/Documents/pitch/veggie-vendor/src/pages/LPPEngine.jsx';
let lppContent = fs.readFileSync(lppFile, 'utf8');

const target = `                const canFulfill = ws.available >{t.lppresultrecommendedqtyConstTotalcostCanfulfillWspriceLppresultrecommendedqtyNullReturn || '= lppResult.recommendedQty;
                const totalCost = canFulfill ? (ws.price * lppResult.recommendedQty) : null;
                
                return ('}`;

const replacement = `                const canFulfill = ws.available >= lppResult.recommendedQty;
                const totalCost = canFulfill ? (ws.price * lppResult.recommendedQty) : null;
                
                return (`;

if (lppContent.includes(target)) {
    lppContent = lppContent.replace(target, replacement);
    fs.writeFileSync(lppFile, lppContent);
    console.log("Fixed LPPEngine.jsx");
} else {
    console.log("Target not found in LPPEngine.jsx");
}
