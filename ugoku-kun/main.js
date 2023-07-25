"use strict";

const mqttBrokerUrl = "wss://mqtt.devwarp.work";

const mqttClient = mqtt.connect(mqttBrokerUrl);

const topic = "/move_base/status";

let enableToSendMessage = false;

function handleMessage(topic, message) {
  const moveBaseStatus = JSON.parse(message.toString())
  const sequenceTextElement = document.getElementById("sequence")
  sequenceTextElement.innerText = moveBaseStatus.header.seq
}

// liner: 前後　angular: 右回転、左回転
function sendVelocity(linear, angular) {
  const cmdVelMsg = JSON.stringify({
      linear: {
          x: linear,
          y: 0,
          z: 0
      },
      angular: {
          x: 0,
          y: 0,
          z: angular
      }
  });

  if(enableToSendMessage) {
    mqttClient.publish("/cmd_vel", cmdVelMsg);
  }
}

// リフト上下
function sendJointTrajectoryPoint(positions) {
  const data = {
    joint_names: ["ankle_joint", "knee_joint"],
    points: [{
      positions: positions,
      velocities: [],
      accelerations: [],
      time_from_start: {
        secs: 1,
        nsecs: 500000000
      }
    }]
  }

  if(enableToSendMessage) {
    mqttClient.publish("/lifter_controller/command", JSON.stringify(data));
  }
}

mqttClient.on("connect", function () {
  console.log("Connected to MQTT broker");
  // topicをsubscribe
  mqttClient.subscribe(topic, function (err) {
      if (err) {
          console.error("Error while subscribing:", err);
      } else {
          console.log("Subscribed to topic:", topic);
      }
  });
});

// mqttClientがメッセージを受け取った時にfireするコールバック
mqttClient.on('message', function (topic, message) {
  handleMessage(topic, message);
});

// Element周り

// 操作ON/OFFボタン
const controlOnButtonElement = document.getElementById("control-on");
controlOnButtonElement.addEventListener("click", () => {
  enableToSendMessage = true;
  controlOffButtonElement.style.backgroundColor = "white";
  controlOnButtonElement.style.backgroundColor = "#FFB6C1"
})

const controlOffButtonElement = document.getElementById("control-off");
controlOffButtonElement.addEventListener("click", () => {
  enableToSendMessage = false;
  controlOffButtonElement.style.backgroundColor = "#BAD3FF";
  controlOnButtonElement.style.backgroundColor = "white"
})

// 操作ボタン
const upArrowButtonElement = document.getElementById("up-arrow");
upArrowButtonElement.addEventListener("click", () => sendJointTrajectoryPoint([0.0, 0.0]));

const downArrowButtonElement = document.getElementById("down-arrow");
downArrowButtonElement.addEventListener("click", () => sendJointTrajectoryPoint([0.5, 0.0]));

const rightArrowButtonElement = document.getElementById("right-arrow");
rightArrowButtonElement.addEventListener("click", () => sendVelocity(0, -0.1));

const leftArrowButtonElement = document.getElementById("left-arrow");
leftArrowButtonElement.addEventListener("click", () => sendVelocity(0, 0.1));

