const testButton = document.getElementById("testButton");
const testMessage = document.getElementById("testMessage");

testButton.addEventListener("click", () => {
  testMessage.textContent = "버튼이 정상적으로 작동합니다.";
});
