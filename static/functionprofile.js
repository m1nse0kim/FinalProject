$(document).ready(function () {
  displayUsernameFromCookie();
  const username = window.location.pathname.split("/")[2]; // URL 경로가 '/profile/a' 형태라고 가정
  const currentUsername = getCookie("username");

  loadUserProfile(username);

  // 현재 로그인한 사용자의 프로필인지 확인합니다.
  if (username === currentUsername) {
    $(".editButton").show(); // 편집 버튼을 표시합니다.
  } else {
    $(".editButton").hide(); // 다른 사용자의 프로필이면 편집 버튼을 숨깁니다.
  }

  $(".closeButton").on("click", function () {
    window.location.href = `/friends`;
  });

  $(".editButton").on("click", function () {
    // 버튼의 상태에 따라 다른 동작 수행
    if ($(this).text() === "EDIT") {
      // 설명 텍스트를 input으로 변경
      const desc = $("#user_desc").text();
      $("#user_desc").html(
        `<input type="text" id="desc_edit" value="${desc}">`
      );

      $("#img_upload").show(); // 이미지 변경 버튼 활성화

      $(this).text("SAVE"); // 버튼 텍스트를 'SAVE'로 변경
    } else {
      // 'SAVE' 상태일 때, 서버에 업데이트 요청을 보냄
      $(".profile").removeClass("edit-mode"); // 클래스 제거
      const newDesc = $("#desc_edit").val();
      const newImage = $("#img_upload")[0].files[0]; // 파일을 가져옴

      const formData = new FormData();
      formData.append("description", newDesc);
      formData.append("image", newImage);

      fetch(`/api/profile/update/${username}`, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // 프로필 업데이트 성공 시 UI 업데이트
            $("#user_desc").text(newDesc);
            $("#user_img").attr("src", URL.createObjectURL(newImage));
            $("#img_upload").hide();
            $(this).text("EDIT");
          } else {
            console.error("Failed to update profile");
          }
        })
        .catch((error) => console.error("Error:", error));
    }
  });

  $(".addButton").on("click", function () {
    // 채팅방 생성 요청
    fetch(`/api/chat/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_name: username,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // 생성된 채팅방의 ID로 채팅 페이지로 이동
          window.location.href = `/chat/${data.room_id}`;
        } else {
          console.error("Failed to create chat room");
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  // 이미지 미리보기 기능
  $("#img_upload").on("change", function () {
    if (this.files && this.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        $("#user_img").attr("src", e.target.result);
      };
      reader.readAsDataURL(this.files[0]);
    }
  });
});

function displayUsernameFromCookie() {
  const username = getCookie("username");
  if (username) {
    console.log("username: " + username);
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

function loadUserProfile(username) {
  console.log("profileusername: " + username);
  fetch(`/api/profile/${username}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Profile not found");
      }
      return response.json();
    })
    .then((profile) => {
      document.getElementById("user_name").textContent = profile.username;
      document.getElementById("user_desc").textContent = profile.description;
      document.getElementById("user_img").src =
        profile.image || "/static/default_profile.jpg";
    })
    .catch((error) => {
      console.error("Error loading profile:", error);
    });
}
