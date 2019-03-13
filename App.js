const express = require('express');
const faker = require('faker');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

// Image Storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/images/products/');
	},
	filename: function (req, file, cb) {
		var finalName = Date.now() + '.' + file.originalname.split('.').pop();
		cb(null, finalName);
	}
});

const upload = multer({ storage: storage });

// Run express function
const app = express();

// Server port and listenin
app.listen(2020, () => console.log('App running un 2020 port'));

// Set template engine
app.set('view engine', 'ejs');

// Set 'public' folder as public
app.use('/public/', express.static(path.join(__dirname, '/public')));

// Connect with DB
mongoose.connect('mongodb://localhost/webstore');

// Product Schema
const productSchema = new mongoose.Schema({
	name: { type: String, required: true },
	shortDescription: { type: String, required: true },
	longDescription: { type: String, required: true },
	price: { type: String, required: true },
	image: { type: String, default: 'no-image.jpg' },
	slug: String
}, { versionKey: false });

// Product model
const Product = mongoose.model('products', productSchema);

// Insert fake products to DB
Product.find({}, (error, result) => {
	if (error) {
		console.log('Error para insertar los productos fake');
	}

	if (result.length <= 1) {
		for (var i = 1; i <= 20; i++) {
			let name = faker.commerce.productName();
			Product.create({
				name: name,
				slug: name.toLowerCase().replace(/ /g, '-'),
				shortDescription: faker.lorem.sentence(),
				longDescription: faker.lorem.sentences(),
				price: faker.commerce.price()
			});
		}
	}
});

// Route system
app.get('/', (req, res) => {
	Product.find({}, (error, result) => {
		if (error) {
			res.send('Error mostrando el index');
		}
		res.render('index', {
			products: result
		});
	});
});

// Rutas de edición - Start
app.get('/product/edit/:id', (req, res) => {
	Product.findOne({ _id: req.params.id }, (error, result) => {
		if (error) {
			res.send(error);
		}
		res.json(result);
	});
});
// Rutas de edición - End

app.get('/product/:id/:slug', (req, res) => {
	Product.findOne({ _id: req.params.id }, (error, result) => {
		if (error) {
			res.send('No se encontró el producto');
		}
		res.render('detail', {
			product: result
		});
	});
});

app.get('/create', (req, res) => {
	res.render('create', { error: '' });
});

app.post('/create', upload.single('image'), (req, res) => {
	if (req.file === undefined) {
		res.render('create', {
			error: 'Subime una imagen'
		});
	}
	req.body.slug = req.body.name.toLowerCase().replace(/ /g, '-');
	req.body.image = req.file.filename;
	Product.create(req.body, (error, result) => {
		if (error) {
			res.send('No se pudo guardar el producto');
		}
		res.redirect('/');
	});
});

app.post('/product/delete/:id', (req, res) => {
	Product.deleteOne({ _id: req.params.id }, (error, result) => {
		if (error) {
			res.send('No se pudo borrar el producto');
		}
		res.redirect('/');
	});
});

app.get('/search/', (req, res) => {
	Product.find({
		[req.query.searchBy]: { $regex: '.*' + req.query.word + '.*' }
	}, (error, result) => {
		if (error) {
			res.send('Error de búsqueda');
		};
		res.render('index', {
			products: result
		});
	});
});
