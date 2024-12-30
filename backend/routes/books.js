const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require ('../middleware/multer-config')

const booksCtrl = require('../controllers/books');

router.get('/',booksCtrl.getAllBook);

router.get('/bestrating', booksCtrl.getBestRatings);

router.get('/:id',booksCtrl.getOneBook );

router.post('/', auth, multer, booksCtrl.createBook );

router.put('/:id', auth, multer, booksCtrl.updateOneBook );

router.delete('/:id', auth, multer, booksCtrl.deleteOneBook );

router.post('/:id/rating', auth, booksCtrl.createOneRating );

module.exports = router;