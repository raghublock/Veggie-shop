const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 1. Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Bikaner DB Connected"))
    .catch(err => console.error("DB Connection Fail:", err));

// 2. Product Model
const productSchema = new mongoose.Schema({
    name: String,
    hindiName: String,
    price: Number,
    stock: Number,
    unit: String,
    image: String
});
const Product = mongoose.model('Product', productSchema);

// 3. Shop Location (Bikaner)
const SHOP_LAT = 28.0229; 
const SHOP_LNG = 73.3119;

// --- ROUTES ---

// 4. Home Page Route
app.get('/', (req, res) => {
    res.render('index'); 
});

// 5. Admin Page Route (Password Protected)
app.get('/admin', (req, res) => {
    const { pass } = req.query;
    if (pass === 'bhati@123') {
        res.render('admin');
    } else {
        res.send("<h1>Unauthorized! Sahi password ke saath URL kholiye.</h1><p>Example: /admin?pass=bhati@123</p>");
    }
});

// --- API SECTION ---

// 6. Radius Check API
app.post('/api/user/check-radius', (req, res) => {
    const { lat, lng } = req.body;
    const R = 6371; 
    const dLat = (SHOP_LAT - lat) * Math.PI / 180;
    const dLon = (SHOP_LNG - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(SHOP_LAT * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance <= 5) {
        res.json({ inRadius: true });
    } else {
        res.json({ inRadius: false, error: "Maafi, hum sirf 5km tak hi delivery karte hain." });
    }
});

// 7. Get All Products API
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Data nahi mil raha" });
    }
});

// 8. Admin Update API (Price aur Stock badalne ke liye)
app.post('/api/products/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { price, stock } = req.body;
        
        console.log(`Updating Product ID: ${id} with Price: ${price}`); // Debugging ke liye log

        const updatedProduct = await Product.findByIdAndUpdate(id, { 
            price: Number(price),
            stock: Number(stock) || 100 
        }, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ error: "Product nahi mila" });
        }

        res.status(200).json({ message: "Rate successfully update ho gaya!", data: updatedProduct });
    } catch (err) {
        console.error("Update fail:", err);
        res.status(500).json({ error: "Server error! Update fail ho gaya." });
    }
});

// 9. Advance Booking Logic
app.post('/api/advance-booking', async (req, res) => {
    const { total } = req.body;
    const securityAmount = total * 0.60;
    res.json({
        message: `Advance booking confirm karne ke liye ₹${securityAmount} pay karein.`,
        cancellationFee: total * 0.20
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
