const fetch = require('node-fetch');
const loadCandles = async (coin, baseM) => {
    const url = `https://api.upbit.com/v1/candles/minutes/${baseM}?market=KRW-${coin}&count=56`;
    const options = {method: 'GET'};
    const candles = [];

    await fetch(url, options)
      .then(res => res.json())
      .then(json => {
          for (var f=0;f<json.length;f++) {
            candles.push(json[f].trade_price);
          }
        })
      .catch(err => console.error('error:' + err));
    return candles;
}

module.exports = loadCandles;
