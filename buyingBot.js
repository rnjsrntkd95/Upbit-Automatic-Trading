const request = require('request')
const uuidv4 = require("uuid/v4")
const crypto = require('crypto')
const sign = require('jsonwebtoken').sign
const queryEncode = require("querystring").encode
const fs = require('fs');

const jsonFile =fs.readFileSync('./key.json', 'utf8');
const keyData = JSON.parse(jsonFile);

const access_key = keyData.access_key;
const secret_key = keyData.secret_key;
const server_url = "https://api.upbit.com"

const buying = () => {

    // 잔고 확인
    const profilePayload = {
        access_key: access_key,
        nonce: uuidv4(),
    }

    const token = sign(profilePayload, secret_key)

    const options = {
        method: "GET",
        url: server_url + "/v1/accounts",
        headers: {Authorization: `Bearer ${token}`},
    }

    request(options, (error, response, body) => {
        if (error) throw new Error(error)

        const currency = JSON.parse(body)[0].currency;
        const balance = JSON.parse(body)[0].balance;
        
        // 최소 거래금액 5000
        if (balance < 5000) return;

        const newReqBody = {
            market: `KRW-${currency}`,
            side: 'bid',
            price: parseInt(balance*0.9995), // 수수료 0.05%
            ord_type: 'price',
        }

        const query = queryEncode(newReqBody)
        
        const hash = crypto.createHash('sha512')
        const queryHash = hash.update(query, 'utf-8').digest('hex')
        
        const newReqPayload = {
            access_key: access_key,
            nonce: uuidv4(),
            query_hash: queryHash,
            query_hash_alg: 'SHA512',
        }
        
        const newReqToken = sign(newReqPayload, secret_key)
        
        const options = {
            method: "POST",
            url: server_url + "/v1/orders",
            headers: {Authorization: `Bearer ${newReqToken}`},
            json: newReqBody
        }
        
        request(options, (error, response, newBody) => {
            if (error) throw new Error(error)
            console.log('Buying');
        })
    })
}

module.exports = buying;