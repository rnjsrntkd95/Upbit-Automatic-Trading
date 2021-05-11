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

const selling = () => {
    
    // 잔고 보유 수량 확인
    const payload = {
        access_key: access_key,
        nonce: uuidv4(),
    }
    
    const token = sign(payload, secret_key)
    
    const options = {
        method: "GET",
        url: server_url + "/v1/accounts",
        headers: {Authorization: `Bearer ${token}`},
    }
    
    request(options, (error, response, body) => {
        if (error) throw new Error(error)
        if (JSON.parse(body).length == 1) return;
        
        const currency = JSON.parse(body)[1].currency;
        const balance = JSON.parse(body)[1].balance;

        // 매도
        const newReqBody = {
            market: `KRW-${currency}`,
            side: 'ask',
            volume: balance,
            ord_type: 'market',
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
            console.log(newBody);
            console.log('Selling');
        })
    })
}

module.exports = selling;