const fetch = require('node-fetch');

const load = async (coin, baseM) => {
  const url = `https://api.upbit.com/v1/candles/minutes/${baseM}?market=KRW-${coin}&count=1`;
  
  const options = {method: 'GET'};

  let price;
  let kstTime;

  await fetch(url, options)
  .then(res => res.json())
  .then(json => {
    price = json[0].trade_price;
    kstTime = json[0].candle_date_time_kst;
  })
  .catch(err => console.error('error:' + err));

  return {price ,kstTime}
}

module.exports = load;