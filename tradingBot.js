const priceBot = require('./priceBot.js');
const buyingBot = require('./buyingBot.js');
const sellingBot = require('./sellingBot.js');
const buying = require('./buyingBot.js');


const m15AvgLine = [];
const m50AvgLine = [];
let m15Avg = 0, m50Avg = 0;
let m15Sum = 0, m50Sum = 0;
let goldenCross = false;
const K = 1; // 배수
const baseM = 1; // 분봉
const coin = 'XRP' // 종목명

const UsePredict = true; // 예측 매수 사용 여부 
const exM = 3; // 예측 기준 (1분봉 3exM, 10분봉 5exM)
let exGC = false; // 예측 기준 이후 예상 GC 
let dday;
const ex5m15Avg = [];
const ex5m50Avg = [];



const trading = async () => {

    let loadingData;

    try {
        // 시세 조회
        loadingData = 0;
        loadingData = await priceBot(coin, baseM);

        // 시세 저장 및 이동평균선
        if (m15AvgLine.length >= 15) m15Sum -= m15AvgLine.shift();
        if (m50AvgLine.length >= 50) m50Sum -= m50AvgLine.shift();
    
        m15AvgLine.push(loadingData.price);
        m50AvgLine.push(loadingData.price);
        m15Sum += loadingData.price; 
        m50Sum += loadingData.price;
        m15Avg = m15Sum / m15AvgLine.length;
        m50Avg = m50Sum / m50AvgLine.length;

        // 예측기준(exM)일전 이동평균선 
        if (ex5m15Avg.length >= exM) ex5m15Avg.shift();
        if (ex5m50Avg.length >= exM) ex5m50Avg.shift();
        ex5m15Avg.push(m15Avg);
        ex5m50Avg.push(m50Avg);



        console.log(`${coin} Price(${loadingData.price}), 15M(${m15Avg}), 50M(${m50Avg}), GC(${goldenCross})`);
        if (m50AvgLine.length < 50) return;

        if (!goldenCross && m15Avg > m50Avg) goldenCross = true;
        if (goldenCross && m15Avg < m50Avg) goldenCross = false;
        
        // 15,50 이평선 기울기 관통 예측
        if (!goldenCross && !exGC) {
            let slopeDiff = (ex5m50Avg[0] - ex5m15Avg[0]) / ((m15Avg - ex5m15Avg[0]) - (m50Avg - ex5m50Avg[0]));
            // 예측 매수
            if (UsePredict && slopeDiff < 1 && slopeDiff > 0) {
                exGC = true;
                dday = Math.round(exM *slopeDiff*1.7);
                buyingBot();
                console.log(`Predict buying D-day(${dday})`)
                return;
            }
        }

        // 이평선 분석
        // 매수 조건 1: 골든 크로스 발생 , 현재가가 15일선보다 위에 위치 시,
        if (!UsePredict &&goldenCross) {
            if (loadingData.price > m15Avg) {
                buyingBot();
                return;
            }
        }
        // 예측 매도
        if (UsePredict && exGC) {
            dday--;
            if (goldenCross) {
                console.log("Success Predict buying")
                exGC = false;
            } else if (dday <= 0) {
                console.log("Selling : Failure Predict");
                exGC = false;
                return;
            }
        }

        // 매도 조건 1: 골든크로스 발생 이후, 15일선-50일선 차이*K 보다 하락 시
        if (!exGC && (m15Avg - m50Avg)*K > loadingData.price - m15Avg) {
            sellingBot();
        }

    } catch (err) {
        console.log(err);
    }
}

 const tradingBtn = setInterval(()=> {
     trading();
 }, baseM*60000);

