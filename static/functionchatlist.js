// 모달에 대한 전역 참조
let modal;
let selectedFriends = [];

$(document).ready(function () {
  displayUsernameFromCookie();
  loadChatList(); // 페이지 로드 시 채팅 목록 로드 함수 호출
  setupModal();

  $("#createChatButton").on("click", function (event) {
    event.preventDefault();
    createChatWithSelectedFriends();
  });

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
        const lastMessage = room.last_message || "No messages";
        const listItem = document.createElement("div");
        listItem.innerHTML = `
          <div class="chat-item">${room.room_name}</div>
          <div class="chat-message">${lastMessage}</div>
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

// 모달 설정 함수
function setupModal() {
  modal = document.getElementById("chatModal");
  const btn = document.getElementById("addChat");
  const span = modal.querySelector(".close");

  // 'ADD +' 버튼을 클릭했을 때 모달을 표시
  btn.onclick = function () {
    showModal(modal);
  };

  // 'X' 버튼을 클릭했을 때 모달을 숨김
  span.onclick = function () {
    hideModal(modal);
  };

  // 모달 밖의 영역을 클릭했을 때 모달을 숨김
  window.onclick = function (event) {
    if (event.target == modal) {
      hideModal(modal);
    }
  };
}

// 모달을 표시하는 함수
function showModal(modalElement) {
  modalElement.style.display = "block";
  loadFriendforList();
}

// 모달을 숨기는 함수
function hideModal(modalElement) {
  modalElement.style.display = "none";
}

function loadFriendforList() {
  const currentUsername = getCookie("username");

  fetch(`/friends/${currentUsername}`)
    .then((response) => response.json())
    .then((friends) => {
      const modalFriendList = document.getElementById("modalFriendList");
      if (modalFriendList) {
        modalFriendList.innerHTML = "";
        friends.forEach((friend) => {
          const listItem = document.createElement("div");
          // listItem.textContent = friend;
          listItem.classList.add("friend-item");

          const label = document.createElement("label");
          label.textContent = friend;
          label.htmlFor = "friend_" + friend;

          // Create the checkbox
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = "friend_" + friend;
          checkbox.value = friend;
          checkbox.classList.add("checkbox-float-right");

          // Append checkbox and label to the list item
          listItem.appendChild(label);
          listItem.appendChild(checkbox);

          modalFriendList.appendChild(listItem);
        });
        const addButton = document.createElement("button");
        addButton.textContent = "Make New Chat";
        addButton.classList.add(".button-newchat");
        addButton.type = "button";
        addButton.onclick = function () {
          createChatWithSelectedFriends();
        };
        modalFriendList.append(addButton);
      }
    })
    .catch((error) => {
      console.error("Error loading friend list:", error);
    });
}

function createChatWithSelectedFriends() {
  const selectedFriends = $('#modalFriendList input[type="checkbox"]:checked')
    .map(function () {
      return this.value;
    })
    .get();

  if (selectedFriends.length === 0) {
    alert("Please select friends to chat with.");
    return;
  }

  const requestData = {
    room_name: "New Room Name", // 새 채팅방의 이름
    usernames: selectedFriends, // 참가자의 사용자 이름 목록
  };

  fetch("/api/chat/create-multiple", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        hideModal(modal);
        window.location.href = `/chat/${data.room_id}`;
      } else {
        // 중복된 채팅방이 있을 경우의 처리
        alert(data.message || "An error occurred.");
      }
    })
    .catch((error) => console.error("Error creating chat:", error));
}
