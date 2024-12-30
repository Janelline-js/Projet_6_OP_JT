const Book = require('../models/book');
const fs = require('fs');
const path = require('path')
const sharp = require('sharp')

exports.getOneBook = (req, res, next) => {

    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
}

exports.getAllBook = (req, res, next) => {
    
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
}

exports.getBestRatings = (req, res, next) => {
    Book.find()
        .then((books) => {



            let orderedGrades = books.sort((a, b) => +a.averageRating - +b.averageRating);
            console.log(orderedGrades)
            let highestBooks = orderedGrades.slice(0, 3)

            return res.status(200).json(highestBooks)
        }
        )
        .catch(error => res.status(400).json({ error }));

}

exports.createBook = async (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);

    delete bookObject._id;
    delete bookObject._userId;

    // Créez un nom de fichier unique
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;

    // Définissez le chemin complet du fichier
    const filepath = path.join(__dirname, '..', 'images', filename);

    // Assurez-vous que le dossier 'images' existe
    const dir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        // Utilisez Sharp pour traiter et sauvegarder l'image
        await sharp(req.file.buffer)
            .resize(600, 600)
            .webp({ quality: 30 })
            .toFile(filepath);

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`
        });

        await book.save();
        res.status(201).json({ message: 'Book added !' });
    } catch (error) {
        console.error('Error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.updateOneBook = async (req, res, next) => {
    // const bookObject = req.file ? {
    //     ...JSON.parse(req.body.book),
    //     imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`


    // } : { ...req.body };
    let bookObject = {};

    if (req.file) {

        // Créez un nom de fichier unique
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;

        // Définissez le chemin complet du fichier
        const filepath = path.join(__dirname, '..', 'images', filename);

        // Assurez-vous que le dossier 'images' existe
        const dir = path.join(__dirname, '..', 'images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        try {
            // Utilisez Sharp pour traiter et sauvegarder l'image
            await sharp(req.file.buffer)
                .resize(600, 600)
                .webp({ quality: 30 })
                .toFile(filepath);

            bookObject = {
                ...JSON.parse(req.body.book),
                imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`
            }

        } catch (error) {
            console.error('Error:', error);
            return res.status(400).json({ error: error.message });
        }
    } else {
        bookObject = { ...req.body }

    }

    delete bookObject.userId;
    console.log(bookObject)
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            console.log(book)
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Book updated' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));

}

exports.deleteOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Unauthorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Book deleted !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
}

exports.createOneRating = (req, res, next) => {


    let bookObject = {
        userId: req.body.userId,
        grade: req.body.rating
    }



    Book.findOne({ _id: req.params.id })
        .then(book => {


            let allRatings = book.ratings
            allRatings.push(bookObject)


            let allGrades = allRatings.map(e => e.grade)
            const averageRatings = allGrades.reduce((a, b) => a + b) / allGrades.length;

            let completeObject = {
                ratings: allRatings,
                averageRating: averageRatings
            }

            Book.updateOne({ _id: req.params.id }, { ...completeObject, _id: req.params.id })
                .then((book) => 
                    res.status(200).json(book))

                .catch(error => res.status(400).json({ error }))
        })
        .catch(error => res.status(400).json({ error }))

}