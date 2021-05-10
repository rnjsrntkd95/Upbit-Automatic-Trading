const priceBot = require('./priceBot.js');
const buyingBot = require('./buyingBot.js');
const sellingBot = require('./sellingBot.js');


const m15AvgLine = [];
const m50AvgLine = [];
let m15Avg = 0, m50Avg = 0;
let m15Sum = 0, m50Sum = 0;
let goldenCross = false;
let K = 1; // 배수
let baseM = 5; // 분봉
let coin = 'DOGE' // 종목명

const trading = async () => {

    let loadingData;

    try {
        // 시세 조회
        loadingData = await priceBot(coin, baseM);
        //console.log(loadingData)

        // 시세 저장 및 이동평균선
        if (m15AvgLine.length >= 15) {
            m15AvgLine.shift();
            m15Sum -= loadingData.price;
        }
        if (m50AvgLine.length >= 50) {
            m50AvgLine.shift();
            m50Sum -= loadingData.price;
        }
        
        m15AvgLine.push(loadingData.price);
        m50AvgLine.push(loadingData.price);
        m15Sum += loadingData.price; 
        m50Sum += loadingData.price;
        m15Avg = m15Sum / m15AvgLine.length;
        m50Avg = m50Sum / m50AvgLine.length;
        
        console.log(`${coin} 시세(${loadingData.price}), 15M(${m15Avg}), 50M(${m50Avg}), GC(${goldenCross})`);

        if (m50AvgLine.length < 50) return;

        if (!goldenCross && m15Avg > m50Avg) goldenCross = true;
        if (goldenCross && m15Avg < m50Avg) goldenCross = false;


        // 이평선 분석
        // 매수 조건 1: 골든 크로스 발생 , 현재가가 15일선보다 위에 위치 시,
        if (goldenCross) {
            if (loadingData.price > m15Avg) {
                buyingBot();
            }
        }

        // 매도 조건 1: 골든크로스 발생 이후, 15일선-50일선 차이*K 보다 하락 시
        if (goldenCross && (m15Avg - m50Avg)*K > loadingData.price) {
            sellingBot();
        }
    } catch (err) {
        console.log(err);
    }
}

const tradingBtn = setInterval(()=> {
    trading();
}, baseM*60000);
