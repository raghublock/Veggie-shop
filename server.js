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
    stock: { type: Number, default: 100 },
    unit: { type: String, default: 'kg' },
    image: String
});
const Product = mongoose.model('Product', productSchema);

const SHOP_LAT = 28.0229; 
const SHOP_LNG = 73.3119;

// --- ROUTES ---

// 3. Home Page
app.get('/', (req, res) => {
    res.render('index'); 
});

// 4. Admin Page (Password: bhati@123)
app.get('/admin', (req, res) => {
    const { pass } = req.query;
    if (pass === 'bhati@123') {
        res.render('admin');
    } else {
        res.send("<h1>Unauthorized!</h1><p>URL ke peeche ?pass=bhati@123 lagayein.</p>");
    }
});

// --- API SECTION ---

// 5. Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Data nahi mil raha" });
    }
});

// 6. Update Product (Price & Stock)
app.post('/api/products/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { price, stock } = req.body;
        await Product.findByIdAndUpdate(id, { 
            price: Number(price),
            stock: Number(stock)
        });
        res.json({ message: "Update success!" });
    } catch (err) {
        res.status(500).json({ error: "Update fail" });
    }
});

// 7. Add New Product (Seasonal)
app.post('/api/products/add', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.json({ message: "Nayi sabzi add ho gayi!" });
    } catch (err) {
        res.status(500).json({ error: "Add fail" });
    }
});

// 8. Delete Product
app.delete('/api/products/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Delete success!" });
    } catch (err) {
        res.status(500).json({ error: "Delete fail" });
    }
});

// 9. Radius Check
app.post('/api/user/check-radius', (req, res) => {
    const { lat, lng } = req.body;
    const R = 6371; 
    const dLat = (SHOP_LAT - lat) * Math.PI / 180;
    const dLon = (SHOP_LNG - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(SHOP_LAT * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    res.json({ inRadius: distance <= 5 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
