// 모달에 대한 전역 참조
let modal;

$(document).ready(function () {
  displayUsernameFromCookie();
  loadFriendList(); // 페이지 로드 시 친구 목록 로드 함수 호출
  setupModal(); // 모달 설정 함수 호출

  $("#profileButton").on("click", function () {
    const currentUsername = getCookie("username");
    if (currentUsername) {
      window.location.href = `/profile/${currentUsername}`; // 현재 로그인한 사용자의 프로필 페이지로 이동
    } else {
      console.error("No username found in cookies.");
    }
  });

  if (window.location.pathname === "/friends") {
    $("#friendButton").addClass("selected");
  }

  $("#friendButton").on("click", function () {
    if (!$(this).hasClass("selected")) {
      window.location.href = `/friends`;
    }
  });

  $("#chatButton").on("click", function () {
    window.location.href = `/chatlist`;
  });
});

function displayUsernameFromCookie() {
  const username = getCookie("username");
  if (username) {
    console.log("username: " + username);
    document.querySelector(
      ".list-title h2"
    ).textContent = `${username}'s Friend List`;
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

function loadFriendList() {
  // 현재 로그인한 사용자의 친구 목록을 가져옵니다.
  const currentUsername = getCookie("username");
  fetch(`/friends/${currentUsername}`)
    .then((response) => response.json())
    .then((friends) => {
      const friendList = document.getElementById("friendList");
      friendList.innerHTML = ""; // 친구 목록을 초기화합니다.
      friends.forEach((friend) => {
        const listItem = document.createElement("div");
        listItem.textContent = friend;
        listItem.classList.add("friend-item");
        listItem.onclick = function () {
          openChatWithUser(friend); // 친구 이름을 클릭하면 채팅방을 엽니다.
        };
        friendList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Error loading friend list:", error);
    });
}

// 모달 설정 함수
function setupModal() {
  modal = document.getElementById("userModal");
  const btn = document.getElementById("addFriend");
  const span = document.getElementsByClassName("close")[0];

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
  loadUserList();
}

// 모달을 숨기는 함수
function hideModal(modalElement) {
  modalElement.style.display = "none";
}

function addFriend(userToAdd) {
  const currentUsername = getCookie("username");
  console.log(userToAdd + " added as a friend.");

  fetch(`/addFriend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentUsername: currentUsername,
      friendName: userToAdd,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        hideModal(modal); // 친구를 추가한 후에 모달을 숨깁니다.
        loadFriendList(); // 친구 목록을 새로고침합니다.
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Error adding friend:", error);
    });
}

function loadUserList() {
  const currentUsername = getCookie("username");

  // 현재 로그인한 사용자를 제외한 사용자 목록을 가져옵니다.
  fetch(`/users/except-friends/${currentUsername}`)
    .then((response) => response.json())
    .then((users) => {
      const modalUserList = document.getElementById("modalUserList");
      if (modalUserList) {
        modalUserList.innerHTML = "";
        users.forEach((user) => {
          const listItem = document.createElement("div");
          listItem.textContent = user;
          listItem.classList.add("friend-item");

          const addButton = document.createElement("button");
          addButton.textContent = "ADD +";
          addButton.classList.add("addButton2");
          addButton.onclick = function () {
            addFriend(user);
          };

          listItem.appendChild(addButton);
          modalUserList.appendChild(listItem);
        });
      } else {
        console.error("Modal user list element not found");
      }
    })
    .catch((error) => console.error("Error loading user list:", error));
}

document.addEventListener("DOMContentLoaded", function () {
  const addFriendButton = document.getElementById("addFriend");
  if (addFriendButton) {
    addFriendButton.addEventListener("click", function () {
      const userListForm = document.getElementById("userListForm");
      if (userListForm) {
        userListForm.classList.add("show");
        loadUserList();
      }
    });
  } else {
    console.error("The 'addFriend' button was not found.");
  }
});

// 친구 이름을 클릭했을 때 프로필 페이지로 이동하고 프로필 정보를 로드하는 로직 추가
function openChatWithUser(friendName) {
  window.location.href = `/profile/${friendName}`; // 프로필 페이지로 이동
}
