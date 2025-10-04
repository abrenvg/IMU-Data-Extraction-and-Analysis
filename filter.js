// Variables for 1A
var F = 0;
var FOld = 0;
var yFirst = 0;
var oldYFirst = 0;
var ySecond = 0;
var oldYSecond = 0;

// Variabels for measuring the cadence
var seq = 0;
var NumberOfSamples = 0;
var date = new Date();
var timestamp = date.getTime();
var oldTimestamp = timestamp;
 
var cadenceOld = 0;



  //to find shake
const shakingThreshold = 2;  // Shaking threshold?

  // Variables for shaking detection
  let shakingStartTime = null;
  let shaking = false;

//to find load
var XAccprev = 0;
var YAccprev = 0;
var ZAccprev= 0;

// Variables for 1B
var accRoll = 0;
var gyroRoll = 0;
var comRoll = 0;
 



// ===== Kalman filter state (roll only) =====
// State x = [angle_deg, bias_dps], Covariance P (2x2)
var KF = {
  roll: { x: [0, 0], P: [[1, 0], [0, 1]] }
};

// Tuning (adjust for your sensor)
const Q_ANGLE = 0.02;   // process noise (angle)
const Q_BIAS  = 0.001;  // process noise (gyro bias)
const R_MEAS  = 5.0;    // measurement noise (acc tilt), in deg^2

// Set true if your gyro rates are in rad/s (otherwise assume deg/s)
const GYRO_IS_RAD_PER_SEC = false;

// ---- Kalman step: angle + bias filter (deg, deg/s) ----
function kalmanAngleBiasStep(kf, dT, rate_dps, meas_deg) {
  // Unpack
  let a  = kf.x[0], b  = kf.x[1];
  let P00 = kf.P[0][0], P01 = kf.P[0][1], P10 = kf.P[1][0], P11 = kf.P[1][1];

  // Predict
  const rate_unb = rate_dps - b;
  const a_pred = a + dT * rate_unb;
  const b_pred = b;

  // P' = A P A^T + Q, with A=[[1,-dT],[0,1]], Q=diag(Q_ANGLE,Q_BIAS)
  const P00p = P00 + dT * (-P01 - P10) + dT*dT * P11 + Q_ANGLE;
  const P01p = P01 - dT * P11;
  const P10p = P10 - dT * P11;
  const P11p = P11 + Q_BIAS;

  // Update with z = a + v, H=[1 0]
  const S  = P00p + R_MEAS;
  const K0 = P00p / S;
  const K1 = P10p / S;
  const y  = meas_deg - a_pred;     // innovation

  const a_new = a_pred + K0 * y;
  const b_new = b_pred + K1 * y;

  const P00n = (1 - K0) * P00p;
  const P01n = (1 - K0) * P01p;
  const P10n = P10p - K1 * P00p;
  const P11n = P11p - K1 * P01p;

  // Store
  kf.x[0] = a_new;  kf.x[1] = b_new;
  kf.P[0][0] = P00n; kf.P[0][1] = P01n;
  kf.P[1][0] = P10n; kf.P[1][1] = P11n;

  return kf.x[0];   // filtered angle (deg)
}


function filter(accDataPoint, gyroDataPoint) {
  // Raw data
  let xAccNew = accDataPoint.data.x;
  let yAccNew = accDataPoint.data.y;
  let zAccNew = accDataPoint.data.z;
  let xGyroNew = gyroDataPoint.data.x;
  let yGyroNew = gyroDataPoint.data.y;
  let zGyroNew = gyroDataPoint.data.z;

  // The sampling time is set under the function findPeriodCharacteristic to 52Hz
  let dT = 1 / 52

 
//  var alfa3 = 0.9
//  F = alfa3 * F + (1-alfa3)*yAccNew
//  console.log(F)


  // Start writing your code below this line 
  // 1A Cadence


  // 1A.1 - Calculate the combinde Acceleration 
  // The function to use is Math.sqrt() and Math.pow(g, 2) 
  let g =1; 
 const f1 = Math.sqrt(
  Math.pow(xAccNew,2)+ Math.pow(yAccNew,2) + Math.pow(zAccNew ,2));

F = f1-g ;

// Plot and check values
plotOnRedLine(F);
console.log("mag:", f1.toFixed(3),"Combined Acceleration (F): ", F.toFixed(3));


                //Fill in the blank with your code


  
  // 1A.2  - EWMA Exponential Weighted Moving Average

     // let alfa = 0.5; // try different alfa values and observe the result

              //  //Fill in the blank with your code

                let alfa = 0.99;
               yFirst = alfa * oldYFirst + (1 - alfa) * F;
               const y1_prev = oldYFirst;
               oldYFirst = yFirst;
              //  plotOnGreenLine(yFirst); 
               console.log("EWMA yFirst: ", yFirst.toFixed(2));


  // 1A.3 - Add an additional EWMA filter with both an alfa and beta value

    // alfa = 0.1
    // let beta = 0.01 // try different alfa and beta values


              //Fill in the blank with your code


let alfa2 = 0.5;
let beta = 0.9;

if (F > FOld) {
    
    ySecond = alfa2 * oldYSecond + (1 - alfa2) * F;
  } else if (F < FOld) {
    ySecond = beta * oldYSecond + (1 - beta) * F;
  } else {
    ySecond =  oldYSecond;
  }

 const y2_prev =oldYSecond;  
  oldYSecond = ySecond;
  FOld = F;
  NumberOfSamples++;

  // plotOnBlueLine(ySecond);
  console.log("Double EWMA ySecond:", ySecond.toFixed(2));

  // 1A.4 Calculate the cadence frequency
  // There is a variable cadence that you can use to make a EWMA filter of the cadence

    // NumberOfSamples = NumberOfSamples + 1;
    // if(1>2){
    // console.log(           +'sec between cadence');
    // NumberOfSamples = 0;
 // }


// 1A.4 - Calculate cadence from crossings (y1 crosses above y2), then EWMA

  // Up-crossing condition: y1(n) > y2(n) AND y1(n-1) <= y2(n-1)
  // (using the prev copies we saved right before updates)
  

  var cadAlpha = 0.3; 

  if (yFirst > ySecond && y1_prev <= y2_prev) {
    // Timestamp now and compute interval from previous crossing
    let now = Date.now()
    let deltaSec = (now - oldTimestamp) / 1000.0;

     if(deltaSec>0){
      // Cadence as steps per minute (spm) from period
      let  cadence  = 60.0 / deltaSec;

     
      // EWMA smoothing of cadence
      let cadenceEWMA = cadAlpha * cadenceOld + (1 - cadAlpha) * cadence;
      cadenceOld=cadenceEWMA
      console.log(
        "Cadence :", cadence.toFixed(3),
        "Cadence EWMA:", cadenceEWMA.toFixed(3), "spm",
        "seconds between cadence | Δt:", deltaSec.toFixed(4), "s"
      );
    }
    // Prepare for next interval
    oldTimestamp = now;
    NumberOfSamples = 0;
  }
  

  // 1A In depth assignment(optional)
  // Detect if Polar verity sensor is continually shaken for more than 1 second


 

  // Detect if the sensor is being shaken
  Shake(F);

function Shake(acc) {
  const currentTime = Date.now();  // Current time in milliseconds

  // Check if acceleration exceeds the threshold
  if (acc > shakingThreshold) {
    if (!shaking) {
      // If shaking just started, record the start time
      shakingStartTime = currentTime;
      shaking = true;
    } else {
      // If shaking is ongoing, check the duration
      const shakingDuration = (currentTime - shakingStartTime) / 1000;  // Convert to seconds
      if (shakingDuration > 1) {
        console.log("Sensor has been shaken for more than 1 second.");
      }
    }
  } else {
    // If the acceleration is below the threshold, reset shaking status
    shaking = false;
    shakingStartTime = null;
  }
}


//finding load
let load = Math.sqrt(
    Math.pow(xAccNew - XAccprev, 2) +
    Math.pow(yAccNew - YAccprev, 2) +
    Math.pow(zAccNew - ZAccprev, 2)
  );

  console.log("Load",load)

  XAccprev = xAccNew;
 YAccprev = yAccNew;
 ZAccprev= zAccNew;


//   // 1B Rotation
//   // 1B.1 Calculate the roll from the Accelerometer on the Polar verity and display the result


//   //Fill in the blank with your code
  
const denominator = Math.sqrt(yAccNew*yAccNew + zAccNew*zAccNew);
accRoll = Math.atan2(xAccNew, denominator) * (180 / Math.PI);
plotOnBlueLine(accRoll);
  console.log("Accelerometer roll (deg):", accRoll.toFixed(3));


// //   // 1B.2 Calculate the roll from the Gyroscope on the Polar verity and display the result 

// //   //Fill in the blank with your code
  
// //   // Integrate gyro Y over time to estimate roll angle
let yGyroOld = 0;
  let gyroRoll = yGyroOld+(dT*yGyroNew);
  console.log("Gyrometer Roll: ",gyroRoll.toFixed(2));
  plotOnRedLine(gyroRoll);

  yGyroOld = gyroRoll;





// //   // 1B.3 Apply a Complimenter filter that fuses the Acceleromter and Gyro data, display and compare the result.


// //   //Fill in the blank with your code
  

  const comalpha = 0.8;    
  comRoll = comalpha * (comRoll + dT * gyroRoll) + (1 - comalpha) * accRoll;
  plotOnGreenLine(comRoll);     
  console.log("complementary filter roll",comRoll.toFixed(3))


// //   // 1B In depth assignment(optional)
// //   // Write a code that calculates pitch and yaw that also takes the magnetometer for the yaw into account 
// //   // Or change the complementary filter to a kalman filter


 const toDeg = GYRO_IS_RAD_PER_SEC ? (180/Math.PI) : 1;
const gyroRollRate_dps = xGyroNew * toDeg;   // <-- use X gyro for roll

// Accel roll (deg) is already computed as `accRoll` above
// Run Kalman update
const rollKF_deg = kalmanAngleBiasStep(KF.roll, dT, gyroRollRate_dps, accRoll);

// // Use Kalman output as your fused roll (keeps your existing variable name)
comRoll = rollKF_deg;

// // Plot / log
plotOnGreenLine(comRoll);
console.log(
  "Kalman Roll (deg):", rollKF_deg.toFixed(3),
);
 }

