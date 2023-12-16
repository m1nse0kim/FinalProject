// 모달에 대한 전역 참조
let modal;

$(document).ready(function () {
  displayUsernameFromCookie();
  loadChatList(); // 페이지 로드 시 채팅 목록 로드 함수 호출

  if (window.location.pathname === "/chatlist") {
    $("#chatButton").addClass("selected");
  }

  $("#profileButton").on("click", function () {
    const currentUsername = getCookie("username");
    if (currentUsername) {
      window.location.href = `/profile/${currentUsername}`; // 현재 로그인한 사용자의 프로필 페이지로 이동
    } else {
      console.error("No username found in cookies.");
    }
  });

  $("#friendButton").on("click", function () {
    window.location.href = `/friends`;
  });

  $("#chatButton").on("click", function () {
    if (!$(this).hasClass("selected")) {
      window.location.href = `/chatlist`;
    }
  });
});

function displayUsernameFromCookie() {
  const username = getCookie("username");
  if (username) {
    console.log("username: " + username);
    document.querySelector(
      ".list-title h2"
    ).textContent = `${username}'s Chat List`;
  }
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function loadChatList() {
  const username = getCookie("username");
  fetch(`/api/chat/rooms/${username}`)
    .then((response) => response.json())
    .then((data) => {
      const chatList = document.getElementById("ChatList");
      chatList.innerHTML = "";

      data.rooms.forEach((room) => {
        // 새로운 Date 객체를 생성하고 로케일에 맞는 문자열로 변환합니다.
        const lastMessageDate = room.last_message_time
          ? new Date(room.last_message_time).toLocaleDateString()
          : "No messages";
        const lastMessageDateString = lastMessageDate.toLocaleString();

        const listItem = document.createElement("div");
        listItem.innerHTML = `
          <div class="chat-item">${room.room_name}</div>
          <div class="chat-message">${room.last_message}</div>
        `;
        listItem.onclick = function () {
          window.location.href = `/chat/${room.room_id}`; // 해당 채팅방으로 이동
        };
        chatList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Error loading chat list:", error);
    });
}
