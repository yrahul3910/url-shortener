const mongo = require('mongodb').MongoClient;
const express = require('express');
const validator = require('validator');

let app = express();
const dbUrl = process.env.MONGO_URI;

app.get('/', (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("<html><body>Hello! Please go to /new/&lt;URL&gt; to shorten a URL, or to /&lt;number &gt; to be redirected.</body></html>");
});

app.get('/new/:url*', (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    let url = req.params.url + req.params[0];
    
    let index;
    if (!validator.isURL(url, {require_protocol: true}))
        res.end(JSON.stringify({error: 'Please enter a valid URL, with the protocol (HTTP, HTTPS, etc.)'}));
    else {
        mongo.connect(dbUrl, (err, db) => {
            if (err) throw err;
            
            let coll = db.collection('url');
            coll.count().then((index) => {
                try {
                    coll.insertOne({index, url});
                    db.close();
                    res.end(JSON.stringify({
                        original_url: url,
                        shortened_url: req.get('host') + '/' + index
                    }));
                } catch(e) {
                    console.log(e);
                }
            });
        });
    }
});

app.get('/:id', (req, res) => {
    let index = Number.parseInt(req.params.id);
    console.log(typeof(index));
    if (typeof(index) !== 'number') {
        res.end(JSON.stringify({error: 'Must be valid shortened URL.'}));
        return;
    }
    
    mongo.connect(dbUrl, (err, db) => {
        if (err) throw err;

        let coll = db.collection('url');
        coll.find({index}).toArray((e, data) => {
            if (e) throw e;
            if (!data) {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'URL does not exist!'}));
                return;
            }

            res.redirect(data[0].url);
        });

        db.close();
    })
})

app.listen(9000);