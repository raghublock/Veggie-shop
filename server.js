<!DOCTYPE html>
<html>
<head>
    <title>Admin - Bikaner Fresh Veggies</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; font-family: 'Segoe UI', sans-serif; }
        .admin-card { max-width: 900px; margin: 20px auto; padding: 25px; border-radius: 20px; }
        .veg-row { background: white; padding: 15px; border-radius: 12px; margin-bottom: 12px; border-left: 6px solid #198754; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    </style>
</head>
<body>
    <div class="container">
        <div class="card admin-card shadow-lg">
            <h3 class="text-center text-success fw-bold">Admin Panel - Bikaner Mandi</h3>
            <hr>

            <div class="bg-white p-3 rounded mb-4 shadow-sm border-start border-primary border-5">
                <h6 class="fw-bold text-primary">📢 Live Mandi Bhav Ticker Update Karein</h6>
                <div class="input-group">
                    <input type="text" id="mandi-input" class="form-control" placeholder="Aloo ₹25, Pyaaz ₹30, Tamatar ₹40...">
                    <button onclick="updateMandiBhav()" class="btn btn-primary fw-bold">Update Patti</button>
                </div>
            </div>
            
            <div class="bg-light p-3 rounded mb-4 border">
                <h6 class="fw-bold">➕ Nayi Sabzi Add Karein</h6>
                <div class="row g-2">
                    <div class="col-md-3"><input type="text" id="add-name" placeholder="Name" class="form-control"></div>
                    <div class="col-md-3"><input type="text" id="add-hindi" placeholder="Hindi Name" class="form-control"></div>
                    <div class="col-md-2"><input type="number" id="add-price" placeholder="Price" class="form-control"></div>
                    <div class="col-md-2"><button onclick="addNew()" class="btn btn-success w-100 fw-bold">Add</button></div>
                </div>
            </div>

            <div id="admin-list"></div>
        </div>
    </div>

    <script>
        async function updateMandiBhav() {
            const msg = document.getElementById('mandi-input').value;
            if(!msg) return alert("Kuch toh likho bhai!");
            const res = await fetch('/api/settings/update', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: msg })
            });
            if(res.ok) alert("Patti Update ho gayi!");
        }

        async function loadAdmin() {
            const res = await fetch('/api/products');
            const prods = await res.json();
            let html = '';
            prods.forEach(p => {
                const isOut = p.stock === 0;
                html += `
                <div class="veg-row d-flex justify-content-between align-items-center">
                    <div style="flex: 1.5;">
                        <span class="fw-bold fs-5">${p.name}</span><br>
                        <span class="badge ${isOut ? 'bg-danger' : 'bg-success'}">${isOut ? 'OUT' : 'IN'}</span>
                    </div>
                    <div style="flex: 1;"><input type="number" id="p-${p._id}" value="${p.price}" class="form-control"></div>
                    <div class="d-flex gap-1">
                        <button onclick="updPrice('${p._id}')" class="btn btn-success btn-sm">Rate</button>
                        <button onclick="updStock('${p._id}', ${isOut ? 100 : 0})" class="btn btn-outline-danger btn-sm">${isOut ? 'In' : 'Out'}</button>
                        <button onclick="del('${p._id}')" class="btn btn-light btn-sm">🗑️</button>
                    </div>
                </div>`;
            });
            document.getElementById('admin-list').innerHTML = html;
        }

        async function updPrice(id) {
            const price = document.getElementById(`p-${id}`).value;
            await fetch(`/api/products/update/${id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ price }) });
            alert("Rate Updated!");
        }

        async function updStock(id, stock) {
            await fetch(`/api/products/update/${id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ stock }) });
            loadAdmin();
        }

        async function addNew() {
            const data = { name: document.getElementById('add-name').value, hindiName: document.getElementById('add-hindi').value, price: document.getElementById('add-price').value, unit: 'kg' };
            await fetch('/api/products/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            location.reload();
        }

        async function del(id) {
            if(confirm("Pakka?")) { await fetch(`/api/products/delete/${id}`, { method: 'DELETE' }); loadAdmin(); }
        }

        loadAdmin();
    </script>
</body>
</html>
