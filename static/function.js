$(document).ready(function () {
  $("#user_id").on("keyup", function (e) {
    if (e.key === "Enter") {
      startChat();
    }
  });

  $("#enterButton").on("click", function () {
    startChat();
  });

  $("#message_input").on("keyup", function (e) {
    var message = $(this).val();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      message = message.trim();
      if (message !== "") {
        sendMessage();
      }
    }
  });

  $(".sendButton").on("click", function () {
    sendMessage();
  });
});

var userId;
var ws;

function startChat() {
  userId = $("#user_id").val();
  if (userId.trim() !== "") {
    ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
    console.log("UserId", userId);
    ws.onmessage = function (event) {
      var data = JSON.parse(event.data);
      appendMessage(data);
    };
  }
}

function sendMessage() {
  var message = $("#message_input").val();
  if (message && message.trim() !== "") {
    if (ws && ws.readyState === WebSocket.OPEN) {
      var messageData = { user_id: userId, content: message, type: "send" };
      ws.send(JSON.stringify(messageData));
      $("#message_input").val("");
    } else {
      console.error("WebSocket is not connected.");
    }
  }
}

function appendMessage(messageData) {
  var messageContainerClass, messageClass, messageTime;
  var messageElement;
  var time = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  var chatMessage = messageData.content.replace(/\n/g, "<br>");

  if (messageData.type === "send" && messageData.user_id === userId) {
    messageContainerClass = "send-message-container";
    messageClass = "send";
    messageTime = "send-time";
    messageElement =
      `<div class="${messageContainerClass}">` +
      `<div class="${messageTime}">${time}</div>` +
      `<div class="${messageClass}">${chatMessage}</div>` +
      `</div>`;
  } else {
    messageContainerClass = "receive-message-container";
    messageClass = "receive";
    messageTime = "receive-time";
    messageElement =
      `<div class="receive-message">` +
      `<div class="message-user-id">${messageData.user_id}</div>` +
      `<div class="${messageContainerClass}">` +
      `<div class="${messageClass}">${chatMessage}</div>` +
      `<div class="${messageTime}">${time}</div>` +
      `</div></div>`;
  }

  $("#messages").append(messageElement);
  $("#messages").scrollTop($("#messages")[0].scrollHeight);
}
