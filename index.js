const express = require('express')
const bodyParser = require('body-parser')
const { json } = require('body-parser')
const app = express()
const port = 3000

const jsonParser = bodyParser.json()

const urlencodedParser = bodyParser.urlencoded({ extended: false })

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
app.post('/', jsonParser, (req, res) => {
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
    let transactionsCopy = transactions.slice();
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
                if(points - transactions[index]['points'] < 0) {
                    break;
                }
                points -= transactions[index]['points'];
                difference = transactions[index]['points'];
                transactions[index]['points'] = 0;
                if(totals[transactions[index]['payer']]) {
                    if(totals[transactions[index]['payer']] - difference < 0) {
                        break;
                    }
                    totals[transactions[index]['payer']] -= difference;
                } else {
                        break;
                }
            }
            index++;
        }
    }
    if(points > 0) {
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

// Some considerations to take note of:
// 1. Transactions can only be made one at a time
// 2. I made it so that whenever a payer's balance would go negative as a result of spending points, the spending action is not made
//    An alternative would be to make it skip the transaction and subtract from the next transaction
//    I did not do this because I believe that would result in retroactively changing which transactions the spending subtracted from, depending on order
// 3. Currently, since I am mutating the transactions array when hitting the spend endpoint, this will result in errors if a 400 response is returned.
//    This is because part of the transactions array might get before until the error is sent back, so when making a spend in subsequent requests,
//    the transactions array will already be mutated (therefore incorrect). (fixed by making a copy of the transactions before processing the spend request)