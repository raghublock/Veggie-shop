const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 1. Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Bikaner DB Connected"))
    .catch(err => console.error("DB Connection Fail:", err));

// 2. Product Model (Free Item Support ke saath)
const productSchema = new mongoose.Schema({
    name: String,
    hindiName: String,
    price: Number,
    stock: { type: Number, default: 100 },
    unit: { type: String, default: 'kg' },
    isFree: { type: Boolean, default: false } // Admin yahan se Free mark karega
});
const Product = mongoose.model('Product', productSchema);

// 3. Customer Model (Referral aur Address Saving)
const customerSchema = new mongoose.Schema({
    mobile: { type: String, unique: true },
    address: String,
    referralCode: { type: String, unique: true },
    referredBy: String,
    lastOrder: { type: Date, default: Date.now }
});
const Customer = mongoose.model('Customer', customerSchema);

const SHOP_LAT = 28.0229; 
const SHOP_LNG = 73.3119;

// --- ROUTES ---

app.get('/', (req, res) => res.render('index'));

app.get('/admin', (req, res) => {
    if (req.query.pass === 'bhati@123') res.render('admin');
    else res.send("Unauthorized! URL mein ?pass=bhati@123 lagayein.");
});

// API: Customer Logic
app.post('/api/customer/get-address', async (req, res) => {
    try {
        const customer = await Customer.findOne({ mobile: req.body.mobile });
        res.json({ 
            address: customer ? customer.address : null,
            myCode: customer ? customer.referralCode : null 
        });
    } catch (err) { res.status(500).json({ error: "Fail" }); }
});

app.post('/api/customer/save', async (req, res) => {
    try {
        const { mobile, address, referredBy } = req.body;
        const myCode = "BK" + mobile.slice(-4);
        const customer = await Customer.findOneAndUpdate(
            { mobile }, 
            { address, referralCode: myCode, referredBy, lastOrder: new Date() }, 
            { upsert: true, new: true }
        );
        res.json({ success: true, myCode: customer.referralCode });
    } catch (err) { res.status(500).json({ error: "Save Fail" }); }
});

// API: Product Logic
app.get('/api/products', async (req, res) => {
    const products = await Product.find({});
    res.json(products);
});

app.post('/api/products/update/:id', async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Update Success!" });
});

app.post('/api/products/add', async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ message: "Added!" });
});

app.delete('/api/products/delete/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted!" });
});

app.post('/api/user/check-radius', (req, res) => {
    const { lat, lng } = req.body;
    const R = 6371; 
    const dLat = (SHOP_LAT - lat) * Math.PI / 180;
    const dLon = (SHOP_LNG - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat * Math.PI / 180) * Math.cos(SHOP_LAT * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    res.json({ inRadius: distance <= 5 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bikaner Fresh Veggies Live!`));
