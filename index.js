const express = require('express')
const bodyParser = require('body-parser')
const { json } = require('body-parser')
const app = express()
const port = 3000

const jsonParser = bodyParser.json()

let transactions = [];

app.get('/', (req, res) => {
    res.send('Hello Fetch Rewards!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

// making a transaction via post request
// expected request body format: { "payer": string, "points": int, "timestamp": date }
// example: { "payer": "DANNON", "points": 1000, "timestamp": "2020-11-02T14:00:00Z" }
// can only take in one transaction at a time
app.post('/transaction', jsonParser, (req, res) => {
    const { payer, points, timestamp } = req.body;
    transactions.push({ 'payer': payer, 'points': points, 'timestamp': timestamp });
    console.log(transactions);
    res.sendStatus(200);
})

// spending an amount of points via post request
// expected request body format: { "points": int }
// example: { "points": 5000 }
app.post('/spend', jsonParser, (req, res) => {
    if(transactions.length === 0) {
        res.sendStatus(400);
    }
    let { points } = req.body;
    transactions.sort((a, b) =>  new Date(a.timestamp) - new Date(b.timestamp));
    let transactionsCopy = JSON.parse(JSON.stringify(transactions));
    console.log(transactionsCopy);
    const totals = {};
    let index = 0;
    let difference;
    while(points > 0 && index < transactions.length) {
        if(transactions.length > 0) {
            if(transactions[index]['points'] < points && transactions[index]['points'] > 0) {
                newPoints = points - transactions[index]['points'];
                difference = transactions[index]['points'];
                transactions[index]['points'] = 0
                points = newPoints;
                if(totals[transactions[index]['payer']]) {
                    totals[transactions[index]['payer']] -= difference;
                } else {
                    totals[transactions[index]['payer']] = - difference;  
                }
            } else if(transactions[index]['points'] >= points) {
                transactions[index]['points'] -= points;
                if(totals[transactions[index]['payer']]) {
                    totals[transactions[index]['payer']] -= points;
                } else {
                    totals[transactions[index]['payer']] = - points;  
                }
                points = 0;
            } else if(transactions[index]['points'] < 0){
                if(totals[transactions[index]['payer']]) {
                    difference = transactions[index]['points'];
                    if(points - difference < 0) {
                        break;
                    } else {
                        points -= transactions[index]['points'];
                        transactions[index]['points'] = 0;
                        totals[transactions[index]['payer']] -= difference;
                    }
                } else {
                        break;
                }
            }
            index++;
        }
    }
    if(points > 0) {
        console.log(transactionsCopy);
        transactions = transactionsCopy;
        res.sendStatus(400);
    } else {
        if(points === 0) {
            let result = Object.keys(totals)    
                .map(key => {
                return { 'payer': key, 'points': totals[key] };
            });
            res.send(result);
        }
    }
})

// returning the balance of all the payers in the system
app.get('/balance', (req, res) => {
    let totals = {};
    for(let i = 0; i < transactions.length; i++) {
        if(transactions[i]['payer']) {
            if(totals[transactions[i]['payer']]) {
                totals[transactions[i]['payer']] += transactions[i]['points'];
            } else {
                totals[transactions[i]['payer']] = transactions[i]['points'];
            }
        }
    }
    res.send(totals)
})