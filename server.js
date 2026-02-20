const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Bikaner DB Connected"))
    .catch(err => console.error("DB Connection Fail:", err));

// --- MODELS ---
const productSchema = new mongoose.Schema({
    name: String, hindiName: String, price: Number, stock: { type: Number, default: 100 }, unit: { type: String, default: 'kg' }, isFree: { type: Boolean, default: false }
});
const Product = mongoose.model('Product', productSchema);

const customerSchema = new mongoose.Schema({
    mobile: { type: String, unique: true }, address: String, referralCode: { type: String, unique: true }, referredBy: String, lastOrder: { type: Date, default: Date.now }
});
const Customer = mongoose.model('Customer', customerSchema);

// Mandi Bhav Settings Model
const settingsSchema = new mongoose.Schema({
    mandiMessage: { type: String, default: "Bikaner Mandi ke aaj ke taaza bhav yahan dekhein!" }
});
const Settings = mongoose.model('Settings', settingsSchema);

// --- ROUTES ---
app.get('/', (req, res) => res.render('index'));

app.get('/admin', (req, res) => {
    if (req.query.pass === 'bhati@123') res.render('admin');
    else res.send("Unauthorized!");
});

// --- API SECTION ---

// Ticker APIs
app.get('/api/settings', async (req, res) => {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    res.json(s);
});

app.post('/api/settings/update', async (req, res) => {
    await Settings.findOneAndUpdate({}, { mandiMessage: req.body.message }, { upsert: true });
    res.json({ message: "Ticker Update Ho Gaya!" });
});

app.post('/api/customer/get-address', async (req, res) => {
    const customer = await Customer.findOne({ mobile: req.body.mobile });
    res.json({ address: customer ? customer.address : null, myCode: customer ? customer.referralCode : null });
});

app.post('/api/customer/save', async (req, res) => {
    const { mobile, address, referredBy } = req.body;
    const myCode = "BK" + mobile.slice(-4);
    const c = await Customer.findOneAndUpdate({ mobile }, { address, referralCode: myCode, referredBy, lastOrder: new Date() }, { upsert: true, new: true });
    res.json({ success: true, myCode: c.referralCode });
});

app.get('/api/products', async (req, res) => res.json(await Product.find({})));

app.post('/api/products/update/:id', async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Success!" });
});

app.post('/api/products/add', async (req, res) => {
    await new Product(req.body).save();
    res.json({ message: "Added!" });
});

app.delete('/api/products/delete/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live!`));
