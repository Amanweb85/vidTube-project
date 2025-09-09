const baseRoute = `http://${window.location.host}`;
const urlParams = new URLSearchParams(window.location.search); // gives the object(urlParams) of paramenters passing in url
export let id = urlParams.get("id");
console.log(id);
export let listId = urlParams.get("listId");
export let searchKeyword = urlParams.get("sq") || '';
export let categoryQuery = urlParams.get("q");

import { locations, languages } from "../ApiData/locationsAndLanguages.js";

const body = document.querySelector("body");
const menuIcon = document.querySelector("#menu-icon");
const accPopup = document.querySelector(".acc-popup");
const appearancePopup = document.querySelector(".appearance-popup");
const languagePopup = document.querySelector(".language-popup");
const locationPopup = document.querySelector(".location-popup");
const leftPanel = document.querySelector(".left-panel");
let selectedVideoData;


// ---------------theme ----------------
let theme = localStorage.theme || "image-backed"
console.log(theme)
body.classList.add(theme)

if (theme === "dark") {
  body.className = "dark";
} else if (theme === "light") {
  body.className == "";
} else if (theme === "dark-image-backed") {
  body.className = "image-backed dark";
} else {
  body.className = "image-backed";
}

// ------- left panel Menu Bar--------

menuIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  leftPanel.classList.toggle("narrow-panel");
});

// -------------------------- left-panel shortcut active------------------------------

document.querySelectorAll(".shortcuts a").forEach((elem, ind, arr) =>
  elem.addEventListener("click", () => {
    arr.forEach((elm) => {
      if (
        [...elm.classList].some((className) => {
          return className === "active";
        })
      )
        elm.classList.remove("active");
    });
    elem.classList.add("active");
  })
);

//

//            ************************************************  Popups ***********************************************************

function showAccPopup() {
  accPopup.classList.add("show-popup");
}
function hideAccPopup() {
  accPopup.classList.remove("show-popup");
}
function showAppearancePopup() {
  appearancePopup.classList.add("show-popup");
}
function hideAppearancePopup() {
  appearancePopup.classList.remove("show-popup");
}
function showLocationPopup() {
  locationPopup.classList.add("show-popup");
}
function hideLocationPopup() {
  locationPopup.classList.remove("show-popup");
}
function showLanguagePopup() {
  languagePopup.classList.add("show-popup");
}
function hideLanguagePopup() {
  languagePopup.classList.remove("show-popup");
}

// --------------------  remove popups when click on body  ----------------------

const optionListBox = document.querySelector(".option-listbox");

body.addEventListener("click", (e) => {
  hideAccPopup();
  hideLocationPopup();
  hideLanguagePopup();
  hideAppearancePopup();
  optionListBox?.classList.remove("show-option-listbox");
});

//-------- getting video details of selected video--------------

body.addEventListener("click", (e) => {
  if (e.target.className == "three-dots") {
    e.preventDefault();

    showoptionListbox();
    function showoptionListbox() {
      var mouseX = e.pageX;
      var mouseY = e.pageY;
      optionListBox.style.left = mouseX + "px";
      optionListBox.style.top = mouseY + "px";
      optionListBox.classList.add("show-option-listbox");
    }

    // execute loop until we not reached to the parent element (vid-box)
    let elem = e.target;
    do {
      elem = elem.parentElement;
    } while (elem.classList[0] !== "vid-box");

    // getting elements of selected vid-box by their className
    let selectedVidBoxId = elem.id;
    function getElement(className) {
      return document.querySelector(`#${selectedVidBoxId} .${className}`);
    }

    // storing details of selected vid-box in 'selectedVideoData' object
    selectedVideoData = {
      type: elem.classList[1],
      videoId: elem.children[0].id,
      listId: elem.children[0].getAttribute("listId"),
      channelTitle: getElement("channel-title").innerText,
      channelThumbnail: [
        {
          url: getElement("channel-thumbnail").src,
        },
      ],
      description: getElement("vid-title").innerText,
      viewCount: getElement("views").innerText,
      publishedTimeText: getElement("published-duration").innerText,
      thumbnail: [
        {
          url: elem.children[0].style.backgroundImage.slice(5, -2),
        },
      ],
    };
    console.dir(selectedVideoData);
  }
});

// hide optionsListBox on scroll
(
  document.querySelector(".main") || document.querySelector(".main-container")
).addEventListener("scroll", (e) => {
  optionListBox.classList.remove("show-option-listbox");
  document.querySelector(".download-metadata-container").classList.remove('show-download-metadata-container')
});

//----- get Selected vid-box data ------------

const saveToPlaylist_Data = JSON.parse(
  localStorage.getItem("saveToPlaylist_Data")
) || { data: [] };

function checkDuplicates(selectedVideoData) {
  // check duplicate video
  if (selectedVideoData.videoId) {
    return saveToPlaylist_Data.data.some(
      (item) => selectedVideoData.videoId === item.videoId
    );
  }
  // check duplicate playlists
  else {
    return saveToPlaylist_Data.data.some(
      (item) => selectedVideoData.listId === item.listId
    );
  }
}

optionListBox?.addEventListener("click", (e) => {
  console.log(e.target)
  if (e.target.className == "save-to-playlist") {
    if (checkDuplicates(selectedVideoData)) {
      console.log("this video is already exist");
    } else {
      saveToPlaylist_Data.data.push(selectedVideoData);
      localStorage.setItem(
        "saveToPlaylist_Data",
        JSON.stringify(saveToPlaylist_Data)
      );
    }
  }
  else if (e.target.className == "download") {
    // download video
    let videoId = selectedVideoData.videoId
    // let playlistId = selectedVideoData.listId
    let playlistId = "PLnNP_riwKLX5WRrjWr-qkuxP3nNJexw3D"

    const url = videoId
      ? `https://youtu.be/${videoId}`
      : `https://www.youtube.com/watch?list=${playlistId}`;

    document.querySelector(".download-metadata-container").classList.add('show-download-metadata-container');
    document.querySelector(".video-formats").innerHTML = '';
    const thumbnail = selectedVideoData.thumbnail[0].url
    const title = selectedVideoData.description
    showMetadata(url, thumbnail, title)
    fetchFormatData(url);
    console.log("url is :", url)
  }
});

// ---------------------------------  account popup  ----------------------------

document.querySelector("#photo").addEventListener("click", (e) => {
  e.stopPropagation();
  accPopup.classList.toggle("show-popup");
});

accPopup.addEventListener("click", (e) => {
  e.stopPropagation(); //stops event propagation when it reach to popup container
});

document.querySelectorAll(".acc-popup a").forEach((elem) => {
  elem.addEventListener("click", (e) => {
    // console.log(elem.classList[0]);
    if (elem.classList[0] === "appearance") showAppearancePopup();
    else if (elem.classList[0] === "language") showLanguagePopup();
    else if (elem.classList[0] === "location") showLocationPopup();
    // e.stopPropagation();
    hideAccPopup();
  });
});

// --------------------------  appearance popup  ---------------------

appearancePopup.addEventListener("click", (e) => {
  body.style.transition =
    "background-color 0.7s ease-in,color 0.7s ease-in-out"; // changing the theme of body slowly

  if (
    e.target.parentElement.className === "dark-theme" ||
    e.target.className === "dark-theme"
  ) {
    // hideAppearancePopup();
    hideAccPopup();
    // localStorage.theme = "dark";
    theme = "dark";
    body.className = "dark";
  } else if (
    e.target.parentElement.className === "light-theme" ||
    e.target.className === "light-theme"
  ) {
    body.className = "";
    // console.log(e.target);
    // hideAppearancePopup();
    hideAccPopup();
    // localStorage.theme = "light";
    theme = "light";
  } else if (
    e.target.parentElement.className === "dark-image-backed" ||
    e.target.className === "dark-image-backed"
  ) {
    body.className = "";
    // hideAppearancePopup();
    hideAccPopup();
    // localStorage.theme = "dark-image-backed";
    theme = "dark-image-backed";
    body.className = "image-backed dark";
  } else if (
    e.target.parentElement.className === "light-image-backed" ||
    e.target.className === "light-image-backed"
    // theme = "dark-image-backed";
  ) {
    // hideAppearancePopup();
    hideAccPopup();
    // localStorage.theme = "light-image-backed";
    theme = "light-image-backed";
    body.className = "image-backed";
  } else if (e.target.className === "go-back") {
    hideAppearancePopup();
    showAccPopup();
  }
  localStorage.theme = theme;
  document.querySelector(
    ".acc-popup .appearance p"
  ).innerText = `Appearance: ${theme}`;

  e.stopPropagation();
});
document.querySelector(
  ".acc-popup .appearance p"
).innerText = `Appearance: ${theme}`;

// --------------------------language popup-----------------------------

//-----displaying available languages------
const languagePopupLine = document.querySelector(".language-popup hr");
languages.reverse().forEach((lang) => {
  const elem = document.createElement("a");
  elem.innerText = lang;
  languagePopupLine.after(elem);
});

languagePopup.addEventListener("click", (e) => {
  if (e.target.className === "go-back") {
    hideLanguagePopup();
    showAccPopup();
  }

  e.stopPropagation();
});

// --------------------------location popup-----------------------------

//----- displaying available locations-------
const locationPopupLine = document.querySelector(".location-popup hr");
locations.reverse().forEach((location) => {
  const elem = document.createElement("a");
  elem.innerText = location;
  locationPopupLine.after(elem);
});

locationPopup.addEventListener("click", (e) => {
  if (e.target.className === "go-back") {
    hideLocationPopup();
    showAccPopup();
  }
  e.stopPropagation();
});

// //

// //                *********************************  search Video data functionality  ***********************************
const searchBox = document.querySelector(".search-box");
const searchIcon = document.querySelector("#search-icon");

setTimeout(() => {
  searchBox.value = searchKeyword || "";
}, 1);

// searching when we click on the search Icon
searchIcon.addEventListener("click", () => {
  if (searchBox.value) {
    window.location.href = `./vid.html?sq=${searchBox.value}`; //redirecting to vid.html
  }
});
// searching when we presses enter key on the keyboard
searchBox.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    searchIcon.click();
  }
});

// ----------------------------converting views,likes counts in 1.2K and 2.1M formate  ----------------------

export function changeFormate(num) {
  let n = +num;
  if (n <= 999) {
    return `${n}`;
  } else if (n < 999999) {
    return `${parseInt((100 * n) / 1000) / 100}K`;
  } else if (n < 99999999) {
    return `${parseInt((100 * n) / 1000000) / 100}M`;
  } else {
    return `${parseInt((100 * n) / 10000000) / 100}cr`;
  }
}

//------------------------converting video_published_date in 2 days ago , 3 years ago... formate----------------

export function changeTimeFormate(time) {
  const timePassedObj = new Date(
    new Date().getTime() - new Date(time).getTime()
  );
  const passedYears = timePassedObj.getFullYear() - 1970;
  const passedMonths = timePassedObj.getMonth();
  const passedDays = Math.floor(timePassedObj.getTime() / 1000 / 60 / 60 / 24);
  const passedHours = timePassedObj.getHours();
  if (passedYears) {
    return `${passedYears} years ago`;
  } else if (passedMonths) {
    return `${passedMonths} Month ago`;
  } else if (passedDays) {
    return `${passedDays} Days ago`;
  } else {
    return `${passedHours} hours ago`;
  }
}

//-------------------------------converting seconds in min:sec formate (23:03)--------------------------------------

export function changeVidDurationFormat(seconds) {
  function formatData(data) {
    if (data < 10) return `0${data}`;
    else return data;
  }

  const date = new Date(seconds * 1000);
  if (date.getUTCHours()) {
    return `${date.getUTCHours()}:${formatData(
      date.getUTCMinutes()
    )}:${formatData(date.getUTCSeconds())}`;
  } else if (date.getUTCMinutes()) {
    return `${formatData(date.getUTCMinutes())}:${formatData(
      date.getUTCSeconds()
    )}`;
  } else {
    return `00:${formatData(date.getUTCSeconds())}`;
  }
}




// ------------------- getting metadata of video  ------------------------

// copy video url when click on copy-btn
document.querySelector(".url-copy-btn").addEventListener("click", async (e) => {
  const url = document.querySelector('#download-form .download-url-input').value;
  try {
    await navigator.clipboard.writeText(url);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  e.target.innerText = "Copied!";
  e.target.classList.add('download-url-copied');

  setTimeout(() => {
    e.target.innerText = "Copy";
    e.target.classList.remove('download-url-copied');
  }, 10000)

})

//fetching available video formats from server
function fetchFormatData(url) {
  fetch(`${baseRoute}/api/getVideoFormats?videoUrl=${url}`)
    .then(res => res.json())
    .then(formats => showFormats(formats))
    .catch(err => {
      console.dir(err);
    })
}
function showFormats(formats) {
  document.querySelector(".video-formats").innerHTML = '';
  formats.forEach((format, idx) => {
    const label = document.createElement("label")
    label.classList.add('container', 'format')
    label.innerHTML = `<p class="quality"><span style="font-size: 10px;">${format.containerType}</span><br> ${format.quality}p</p>
                      <p class="size">${format.size}</p>
                      <input type="radio" ${idx == 0 ? "checked" : ''} name="qualityLabel" value="${format.quality},${format.containerType}">
                      <span class="checkmark"></span>`;
    document.querySelector(".video-formats").append(label)
  })
}

function showMetadata(url, thumbnail, title) {
  document.querySelector('#download-form .download-url-input').value = url;
  document.querySelector('.metadata-container .video-title p').innerText = title;
  document.querySelector('.metadata-container .thumbnail').src = thumbnail;
}

// ******************* downloading video ************************


let ws;
let sessionId;

// connecting to WebSocket server 

function connectWebSocket() {
  // sessionId = crypto.randomUUID();
  sessionId = Math.random().toString(36).substring(2, 12)

  ws = new WebSocket(`ws://${window.location.host}?sessionId=${sessionId}`);

  ws.onopen = () => {
    console.log('Connected to server.');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const progressCard = document.getElementById(`progressCard-/${data.url}/`);

    if (!progressCard) {
      // Create a new  progressCard if it doesn't exist
      createProgressCard(data.url);
      return;
    }

    if (data.type === 'progress') {
      const progressBar = progressCard.querySelector('.progress-bar');
      const progressText = progressCard.querySelector('.progress-text');
      const statusMessage = progressCard.querySelector('.status-message');

      progressBar.style.width = `${data.progress}%`;
      progressText.textContent = `${data.progress.toFixed(2)}% of /${data.size} at /${data.speed}/`;
      statusMessage.textContent = 'Downloading...';

    } else if (data.type === 'complete') {
      console.log('downloading complete')

      const downloadLink = document.createElement("a");
      downloadLink.href = data.downloadUrl;     // "/api/downloads/:sessionId/:fileName"
      downloadLink.download = data.title;
      body.append(downloadLink);
      downloadLink.click();
      URL.revokeObjectURL(downloadLink);
      body.removeChild(downloadLink)

      progressCard.querySelector('.status-message').textContent = 'Download Complete!';
      setTimeout(() => {
        progressCard.style.display = "none";
      }, 1000);

    }
    else if (data.type === 'error') {
      const statusMessage = progressCard.querySelector('.status-message');
      statusMessage.textContent = `Error: /${data.message}/`;
      statusMessage.style.color = "red";
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from server.');
  };

  ws.onerror = error => {
    console.dir('WebSocket error: ' + error);
  };
}
connectWebSocket();

function createProgressCard(videoUrl) {
  const card = document.createElement('div');
  card.id = `progressCard-/${videoUrl}/`;
  card.className = "card";
  card.innerHTML = `
                  <p class="status-message">Getting video information...</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: 0%;"></div>
                        </div>
                        <div class="flex ">
                        <p class="progress-text">0%</p>
                        <div class="download-link-area hidden">
                            <a href="#" class="download-link bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-md hover:bg-green-700 transition-colors" download>Download</a>
                        </div>
                    </div>
               `;
  document.querySelector("#download-area").appendChild(card);
}

document.querySelector("#download-form").addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  // Convert all entries to a plain object
  const allFormValues = Object.fromEntries(formData.entries());
  const { videoUrl, qualityLabel } = allFormValues
  const [quality, extention] = qualityLabel.split(",")

  console.log(allFormValues);
  console.log(videoUrl, quality, extention, sessionId);

  try {
    const response = fetch(`${baseRoute}/api/downloadVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, quality, extention, sessionId }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Data received:', data);
        // Now you can update your page with the data.
      });

  } catch (err) {
    console.log('Download request failed: ', err.message)
  }
})
