const AccGyro_SERVICE = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
const AccGyro_PERIOD = "fb005c81-02e7-f387-1cad-8acd2d8df0c8";
const AccGyro_DATA = "fb005c82-02e7-f387-1cad-8acd2d8df0c8";
let targetDevice = null;
let heartRate = 0;
let globalServer = null;
let globalAccGyroService = null;
let globalHeartRateService = null;


function onDataChanged(event) {
    //console.log("Data received");
    let value = event.target.value;
    prepareDataForServer(value);
}

async function startBluetoothAndHRMonitoring() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [AccGyro_SERVICE, 'heart_rate'] },
                { namePrefix: "Polar Sense" }
            ]
        });

        targetDevice = device;

        const server = await device.gatt.connect();
        console.log('Conncted to GATT server');
        document.getElementById("status").textContent = 'Conncted to GATT server';

        const accGyroService = await server.getPrimaryService(AccGyro_SERVICE);
        console.log('Got Acc/Gyro Service');
        document.getElementById("accGyroService").textContent = 'Got Acc/Gyro Service';

        const heartRateService = await server.getPrimaryService('heart_rate');
        console.log(("Got HR Service"));
        document.getElementById("heartRateService").textContent = "Got HR Service";

        findDataCharacteristic(accGyroService);
        findPeriodCharacteristic(accGyroService);

        const heartRateCharacteristic = await heartRateService.getCharacteristic('heart_rate_measurement');
        console.log('Got HR Measurement Characteristic');

        await heartRateCharacteristic.startNotifications();
        console.log("Started HR notifications");
        document.getElementById("HRNotifications").textContent = "Started HR notifications";

        heartRateCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateNotification);
    
    } catch (error) {
        console.error('Error: ' + error);
        targetDevice = null;
    }
}

function handleHeartRateNotification(event) {
    const value = event.target.value;
    heartRate = value.getUint8(1);
    document.getElementById("heartRate").textContent = heartRate;
}

function findDataCharacteristic(service) {
    service.getCharacteristic(AccGyro_DATA)
        .then(characteristic => {
            return characteristic.startNotifications();
        })
        .then(characteristic => {
            characteristic.addEventListener('characteristicvaluechanged', onDataChanged);
            console.log("Notifications started");
            document.getElementById("DataNotifications").textContent = "Notifications started";
        })
        .catch(error => {
            console.log(error);
        });
}

function findPeriodCharacteristic(service) {
    console.log("setData");
    service.getCharacteristic(AccGyro_PERIOD)
      .then(characteristic => {
        const valAcc = new Uint8Array([2, 2, 0, 1, 52, 0, 1, 1, 16, 0, 2, 1, 8, 0, 4, 1, 3]);
        return characteristic.writeValueWithResponse(valAcc).then(() => {
          const valGyro = new Uint8Array([2, 5, 0, 1, 52, 0, 1, 1, 16, 0, 2, 1, 208, 7, 4, 1, 3]);
          return characteristic.writeValueWithResponse(valGyro);
        });
  
      })
      .catch(error => {
        console.log(error);
      });
  }


async function prepareDataForServer(value) {
    if (!(value instanceof DataView)) {
        throw new Error("Expected value to be an instance of DataView");
    }

    const hrBuffer = new ArrayBuffer(4);
    const hrView = new DataView(hrBuffer);
    hrView.setInt32(0, heartRate, true);

    const arrayBuffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);

    const combinedBuffer = new Uint8Array(hrBuffer.byteLength + arrayBuffer.byteLength);
    combinedBuffer.set(new Uint8Array(hrBuffer), 0);
    combinedBuffer.set(new Uint8Array(arrayBuffer), hrBuffer.byteLength);

    //console.log("Sending combined data to server:", combinedBuffer);

    await sendDataToServer(combinedBuffer.buffer);
}


async function sendDataToServer(arrayBuffer) {
    try {

        const response = await fetch('http://localhost:3000/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: arrayBuffer
        });

        if (response.ok) {
            console.log("Data sent successfully");
            document.getElementById("DataToServer").textContent = "Data sent successfully"; 
        } else {
            console.error("Error sending data");
            document.getElementById("DataToServer").textContent = "Error sending data";
        }
    } catch (error) {
        console.error("Error sending data:", error);
    }
}

function start() {
    startBluetoothAndHRMonitoring();
}
  
function stop() {
if (targetDevice == null) {
    console.log('The target device is null.');
    return;
}

targetDevice.gatt.disconnect();
console.log('Disconnected');
document.getElementById("status").textContent = 'Disconnected';
document.getElementById("heartRate").textContent = '--';
document.getElementById("accGyroService").textContent = '--';
document.getElementById("heartRateService").textContent = '--';
document.getElementById("HRNotifications").textContent = '--';
document.getElementById("DataNotifications").textContent = '--';
document.getElementById("DataToServer").textContent = '--'; 
}