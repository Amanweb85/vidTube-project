let speak = false; // flag to indicate whether the speaker allow to speak
let spokenText; // variable to store the spoken text
let reply; // variable to store the speech

//*********************************** text to voice*****************************************
// setTimeout(() => {
//   textToVoice("hello how are you");
// }, 2000);

var utterance = new SpeechSynthesisUtterance();
function textToVoice(spokenText) {
  let voices = speechSynthesis.getVoices();
  utterance.text = spokenText;
  console.log("speaking ", spokenText);
  // var utterance = new SpeechSynthesisUtterance(spokenText);
  const selectedVoiceName = "Google हिन्दी";

  for (let voice of voices) {
    if (voice.name === selectedVoiceName) {
      utterance.voice = voice;
      console.log(voice);
      break;
    }
  }
  window.speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

//*********************************** voice to text*****************************************
window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true; // now recognition engine will return results that are not yet final, but are still under processing

recognition.addEventListener("result", (e) => {
  spokenText = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("");
  // spokenText=event.results[0][0].transcript
  console.log("*  ", spokenText);

  // when the user completes his speech
  if (e.results[0].isFinal) {
    // say 'hello' or 'hey' start speak feature
    if (spokenText.includes("hello") || spokenText.includes("hey")) {
      reply = spokenText.replace("hello", "");
      reply = reply.replace("hey", "");
      speak = true;
    }
    if (spokenText.includes("how are you") || spokenText.includes("how r u")) {
      reply = "I am fine";
      speak = true;
    }
    if (spokenText.includes("search ")) {
      let searchQuery = spokenText.replace("search", "");
      console.log(`searching${searchQuery}`);
      searchOnVidTube(searchQuery);
    }
    if (
      spokenText.includes("what's your name") ||
      spokenText.includes("what is your name")
    ) {
      reply = "My Name is Cifar";
      speak = true;
      console.log(reply);
    }
  }
});

// when the speech recognition service has stopped listening
recognition.addEventListener("end", () => {
  if (speak) {
    textToVoice(reply);
    speak = false;
  }

  console.log("end and restarting .....");
  recognition.start();
});

recognition.start();

// ****** stoping voice commands ******
if (spokenText?.includes("stop")) {
  console.log("stoping voice command");
  recognition.stop();
}

////    additional functionalities of vidTube

function searchOnVidTube(searchQuery) {
  const searchBox = document.querySelector(".search-box");
  searchBox.value = searchQuery;
  speak = true;
  // textToVoice(`searching ${searchQuery}`);
  reply = `searching ${searchQuery}`;

  console.log("opening youtube");
  setTimeout(() => {
    window.location.href = `vid.html?sq=${searchBox.value}`; //redirecting to vid.html
  }, 2000);
}

if (!sessionStorage.welcomeFlag) {
  setTimeout(() => {
    console.log("welcome message");
    textToVoice("welcome Aman . How can i help you today");
    sessionStorage.welcomeFlag = true;
  }, 2000);
}
