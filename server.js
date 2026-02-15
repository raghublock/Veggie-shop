const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// 1. Shop Location (Bikaner)
const SHOP_LAT = 28.0229; 
const SHOP_LNG = 73.3119;

// 2. Distance Calculator (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// 3. Order Placement API
app.post('/api/order', async (req, res) => {
    const { mobile, whatsapp, lat, lng, total, isFutureDelivery } = req.body;

    // Check Distance (Must be within 5km)
    const distance = calculateDistance(lat, lng, SHOP_LAT, SHOP_LNG);
    if (distance > 5) {
        return res.status(400).json({ error: "Hum sirf 5km ke area mein delivery karte hain." });
    }

    let responseMsg = "Order received!";
    let commission = total * 0.10; // Aapka 10% commission

    // Future Delivery Logic (60% Advance)
    if (isFutureDelivery) {
        const securityDeposit = total * 0.60;
        responseMsg = `Advance booking confirm karne ke liye ₹${securityDeposit} (60%) pay karein. Cancel karne par 20% charge lagega.`;
    }

    // Yahan hum WhatsApp API call add karenge future mein
    console.log(`Order from: ${mobile}, WhatsApp: ${whatsapp}`);

    res.json({ message: responseMsg, commission: commission });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chalu hai port ${PORT} par`));

app.set('view engine', 'ejs'); // EJS engine set karne ke liye

app.get('/', (req, res) => {
    res.render('index'); // Yeh 'views/index.ejs' ko load karega
});

