To start, navigate to the root then run
```
npm install
```

Then start the server by running
```
node index.js
```

You can then test the api endpoints by using commands such as
1. Adding transactions `POST` to `/transaction`
```
curl --header "Content-Type: application/json" --request POST --data '{ "payer": "DANNON", "points": 1000, "timestamp": "2020-11-02T14:00:00Z" }' http://localhost:3000/transaction
curl --header "Content-Type: application/json" --request POST --data '{ "payer": "UNILEVER", "points": 200, "timestamp": "2020-10-31T11:00:00Z" }' http://localhost:3000/transaction
curl --header "Content-Type: application/json" --request POST --data '{ "payer": "DANNON", "points": -200, "timestamp": "2020-10-31T15:00:00Z" }' http://localhost:3000/transaction
curl --header "Content-Type: application/json" --request POST --data '{ "payer": "MILLER COORS", "points": 10000, "timestamp": "2020-11-01T14:00:00Z" }' http://localhost:3000/transaction
curl --header "Content-Type: application/json" --request POST --data '{ "payer": "DANNON", "points": 300, "timestamp": "2020-10-31T10:00:00Z" }' http://localhost:3000/transaction
```
2. Spending points `POST` to `/spend`
```
curl --header "Content-Type: application/json" --request POST --data '{ "points": 5000 }' http://localhost:3000/spend
```
3. Getting the balance `GET` to `/balance`
```
curl --header "Content-Type: application/json" --request GET http://localhost:3000/balance
```

Some considerations to take note of:
1. Transactions can only be made one at a time
2. I made it so that whenever a payer's balance would go negative as a result of spending points, the spending action is not made
   An alternative would be to make it skip the transaction and subtract from the next transaction
   I did not do this because I believe that would result in retroactively changing which transactions the spending subtracted from, depending on order
3. Currently, since I am mutating the transactions array when hitting the spend endpoint, this will result in errors if a 400 response is returned.
   This is because part of the transactions array might get before until the error is sent back, so when making a spend in subsequent requests,
   the transactions array will already be mutated (therefore incorrect). (fixed by making a copy of the transactions before processing the spend request)