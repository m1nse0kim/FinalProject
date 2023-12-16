$(document).ready(function () {
  $("#user_name, #password").on("input", function () {
    if ($("#user_name").val().length > 0 && $("#password").val().length > 0) {
      $(".loginButton").css({
        "background-color": "#423630",
        color: "white",
      });
    } else {
      $(".loginButton").css({
        "background-color": "#f6f6f6",
        color: "#acacac",
      });
    }
  });

  $("#password").on("input", function () {
    if ($(this).val().length > 0) {
      $(".password-toggle").show();
    } else {
      $(".password-toggle").hide();
    }
  });
  $(".password-toggle").hide();

  $("#togglePassword").change(function () {
    if ($(this).is(":checked")) {
      $("#password").attr("type", "text");
    } else {
      $("#password").attr("type", "password");
    }
  });

  $(".loginButton").on("click", function () {
    var user_name = $("#user_name").val();
    var password = $("#password").val();

    $.ajax({
      url: "/login",
      type: "POST",
      contentType: "application/json", // 서버에 JSON 형식으로 데이터를 전송하도록 설정
      data: JSON.stringify({ user_name: user_name, password: password }),
      success: function (data) {
        window.location.href = data.url; // 리다이렉트 URL로 이동
      },
      error: function (response) {
        var errorMessage =
          response.responseJSON && response.responseJSON.detail
            ? response.responseJSON.detail
            : "An error occurred";
        alert("Login failed: " + errorMessage);
      },
    });
  });

  $(".signupButton").on("click", function () {
    var user_name = $("#user_name").val();
    var password = $("#password").val();

    $.ajax({
      url: "/signup",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        user_name: user_name,
        password: password,
      }),
      success: function (data) {
        alert(data.message);
        // window.location.href = "/";
      },
      error: function (response) {
        alert("Signup failed: " + response.responseText);
      },
    });
  });
});
