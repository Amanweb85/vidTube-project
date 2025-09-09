const baseRoute = `http://${window.location.host}`;
// const apikey = "AIzaSyAIi8VgLmgWhKlLLLRkRAGWCco6Nj2nY_I";
const apikey = "AIzaSyACOJzmnMgEAGc_tyZdcOBPS_sJUduK8cM";

import { popularVideoData } from "../ApiData/popularvideo.js";
import {
  changeFormate,
  changeTimeFormate,
  categoryQuery,
  searchKeyword,
  changeVidDurationFormat,
} from "./common.js";



const banner = document.querySelector(".banner");
const videoArea = document.querySelector(".video-area");
const vidCategory = document.querySelector(".vid-category");


//remove banner
document
  .querySelector(".banner .remove-banner")
  .addEventListener("click", () => {
    banner.style.display = "none";
  });

// *************************************************    auto writing effect      ************************************************ //

const elm = document.querySelector(".banner span");
const words = [
  "Movies.",
  "TV shows.",
  "Lectures.",
  "Songs.",
  "Live Streams.",
  "and more.",
];

function autoTyping(elm, wordList) {
  let reverseMode = true;
  let delay = 2;
  let wordIndex = -1;
  const timerId = setInterval(() => {
    // until delay not complete
    if (delay) {
      delay--;
      return;
    }

    // OFF the reverseMode and move to next word ,when innerText is removed completely
    if (elm.innerText.length === 0 && reverseMode) {
      reverseMode = false;
      wordIndex = (wordIndex + 1) % wordList.length;
      delay = 2;
      return;
    }

    // start reverseMode when word is written completely and wait for some time
    if (elm.innerText.length === wordList[wordIndex].length && !reverseMode) {
      reverseMode = true;
      delay = 6;
      return;
    }

    // writing the word, when reverseMode is off
    if (!reverseMode) {
      //space chracter is ignored in innerText of html element ,when space is the end character of the word (ex - "sports " will be considered as "sports") . that's why we write the space ,and next character at same time
      if (wordList[wordIndex][elm.innerText.length] === " ") {
        elm.innerText = wordList[wordIndex].slice(0, elm.innerText.length + 2);
        delay = 2;
      } else {
        elm.innerText = wordList[wordIndex].slice(0, elm.innerText.length + 1);
        // console.log( wordList[wordIndex].slice(0, elm.innerText.length + 1),elm.innerText.length + 1)
        delay = 2;
      }
    }
    if (reverseMode) {
      elm.innerText = elm.innerText.slice(0, elm.innerText.length - 1);
    }
  }, 60);
}
if (elm) {
  autoTyping(elm, words);
}

//
if (!categoryQuery) searchAndDisplayDataUsingGoogleApis();

//               ****************************  searching and displaying data using fetch Api [googleapis]  ****************************

function searchAndDisplayDataUsingGoogleApis() {
  getSearchData();

  // ---------------searching Data---------------

  async function getSearchData() {
    await fetch(`${baseRoute}/api/getSearchData?searchQuery=${searchKeyword}`)
      .then((response) => response.json())
      .then((data) => {
        // if search data is not fetched successfully < in case of quota full >
        if (data.error?.errors[0].message) {
          displayData(popularVideoData);
          console.log(
            data.error?.errors[0].message,
            "\nfetchedSearchData is ",
            data
          );
        }
        //if search data is successfully fetched
        else {
          console.log("Data successfully fetched :", data);
          displayData(data);
        }
      })
      // handeling error
      .catch((error) => {
        displayData(popularVideoData);
        console.log("error occurred in searching Data :", error);
      });
  }

  // -------------------displaying data ---------------------
  videoArea.innerHTML = "";
  function displayData(data) {
    videoArea.innerHTML = "";
    videoArea.append(banner);

    data.items.forEach((item, idx) => {
      if (
        item.kind === "youtube#channel" ||
        item.id.kind === "youtube#channel"
      ) {
        displayChannel(item, idx);
      } else if (
        item.kind === "youtube#playlist" ||
        item.id.kind === "youtube#playlist"
      ) {
        displayPlaylist(item, idx);
      } else {
        displayVideo(item, idx);
      }
    });
  }

  //-----displaying channel------

  function displayChannel(item, idx) {
    const channelBox = document.createElement("div");
    channelBox.classList.add("channel-box", "flex-box");
    channelBox.setAttribute("channelId", `${item.id.channelId}`);
    channelBox.innerHTML = `<a class="channel-image-box flex-box">
          <img class="channel-image" src="${item.snippet.thumbnails.high.url}">
          </a>
          <a class="channel-details flex-box">
          <h2 class="channel-title">${item.snippet.title || item.snippet.channelTitle
      }</h2>
          <p>@procodrr•117K subscribers</p>
          <p> ${item.snippet.description} </p></a>
          <a class="subscribe-button">Subscribe</a>`;

    banner.after(channelBox);
  }

  //-----displaying Playlist-----

  function displayPlaylist(item, idx) {
    const vidBox = document.createElement("a");
    vidBox.classList.add("vid-box", "playlist");
    vidBox.id = "id" + item.id.playlistId;
    vidBox.href = `vidPlay.html?listId=${item.id.playlistId}`;
    vidBox.innerHTML = `
         <div class="thumbnail-container" style="background-image: url(${item.snippet.thumbnails.maxres?.url ||
      // item.snippet.thumbnails.standard?.url ||
      // item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium.url ||
      item.snippet.thumbnails.default.url
      // item.id.videoId || item.id
      })"
          listId="${item.id.playlistId
      }"><p class="vid-duration"><img src="https://cdn-icons-png.flaticon.com/128/4043/4043804.png" width="12px">  Playlist</p></div>
          <div class="vid-details">
            <img class="channel-thumbnail" src="./images/procodrr.jpg" />
            <div>
              <div class="vid-title"><h4>${item.snippet.title}</h4></div>
              <h4 class="channel-title">${item.snippet.channelTitle}</h4>
              <p><span class="views">${changeFormate(
        item.statistics?.viewCount || 89
      )}</span> 
              views. <span class="published-duration">${changeTimeFormate(
        item.snippet.publishedAt
      )}</span> </p>
            </div>
            <span class="three-dots"> &#8942;</span>
          </div>`;

    videoArea.append(vidBox);
  }
  //-----displaying video-----

  function displayVideo(item, idx) {
    const vidBox = document.createElement("a");
    vidBox.classList.add("vid-box", "video");
    vidBox.href = `vidPlay.html?id=${item.id.videoId || item.id}`;
    vidBox.id = "id" + (item.id.videoId || item.id);

    vidBox.innerHTML = `
    <div class="thumbnail-container" style="background-image: url(${item.snippet.thumbnails.maxres?.url ||
      // item.snippet.thumbnails.standard?.url ||
      // item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium.url ||
      item.snippet.thumbnails.default.url
      // item.id.videoId || item.id
      })"
     id="${item.id.videoId || item.id}"
    ><p class="vid-duration">${item.contentDetails
        ? changeVidDurationFormat(
          item.contentDetails?.duration
            .replace("PT", "")
            .replace("S", "")
            .split("M")
            .reduce((a, val) => parseInt(a) * 60 + parseInt(val), 0)
        )
        : ""
      }</p></div> 
          <div class="vid-details">
            <img class="channel-thumbnail" src="./images/procodrr.jpg" />
            <div>
              <div class="vid-title"><h4>${item.snippet.title}</h4></div>
              <h4 class="channel-title">${item.snippet.channelTitle}</h4>
              <p><span class="views">${changeFormate(
        item.statistics?.viewCount || 89
      )} views.</span> <span class="published-duration"> ${changeTimeFormate(
        item.snippet.publishedAt
      )} </span></p>
            </div>
            <span class="three-dots"> &#8942;</span>
          </div>`;

    videoArea.append(vidBox);
  }
}

//

// -------------------------- vid-category shortcut active------------------------------

document.querySelectorAll(".vid-category div").forEach((elem, ind, arr) =>
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

//              ************************* display video-category data  ******************************

import {
  chessData,
  cricketData,
  dataScienceData,
  dataStructureData,
  gamingData,
  comedyData,
  moviesData,
  newsData,
  AIData,
  podcastsData,
  politicsData,
  stocksData,
  wealthData,
  webDevelopmentData,
} from "../ApiData/videoCategoryData.js";

// -------vidCategoriesData object --------

let vidCategoriesData = {
  ai: AIData,
  chess: chessData,
  comedy: comedyData,
  cricket: cricketData,
  dataScience: dataScienceData,
  dataStructure: dataStructureData,
  gaming: gamingData,
  movies: moviesData,
  news: newsData,
  podcasts: podcastsData,
  politics: politicsData,
  stocks: stocksData,
  wealth: wealthData,
  webDevelopment: webDevelopmentData,
};

// console.log("categoryQueryis :", categoryQuery);
if (categoryQuery) {
  document.querySelector(`.${categoryQuery}`).classList.add("active");
  searchAndDisplayVideoCategoryData();
}

function searchAndDisplayVideoCategoryData() {
  videoArea.innerHTML = "";
  videoArea.append(banner);
  displayVideoCategoryData(
    vidCategoriesData[categoryQuery] || vidCategoriesData["webDevelopment"]
  );
  console.log("categoryData =", vidCategoriesData[categoryQuery]);
}

vidCategory.addEventListener("click", (e) => {
  if (e.target !== document.querySelector(".vid-category")) {
    window.location.href = `vid.html?q=${e.target.classList[0]}`; //redirecting to vid.html
  }
});

function displayVideoCategoryData(categoryVideoData) {
  displayData(categoryVideoData);
  // -------------------displaying data ---------------------

  function displayData(categoryVideoData) {
    categoryVideoData.data.forEach((item, idx) => {
      if (item.type === "channel") {
        displayChannel(item, idx);
      } else if (item.type === "playlist") {
        displayPlaylist(item, idx);
      } else if (item.type === "video_listing") {
        displayData(item, idx);
      } else {
        displayVideo(item, idx);
      }
      // console.log(idx, item.thumbnail);
    });
  }

  //-----displaying channel------

  function displayChannel(item, idx) {
    const channelBox = document.createElement("div");
    channelBox.classList.add("channel-box", "flex-box");
    channelBox.setAttribute("channelId", `${item.channelId}`);
    channelBox.innerHTML = `<a class="channel-image-box flex-box">
        <img class="channel-image" src="${item.thumbnail[1].url || item.thumbnail[0].url
      }" /></a>
    <a class="channel-details flex-box">
          <h2 class="channel-title">${item.channelTitle}</h2>
           <p>@procodrr•117K subscribers</p>
           <p> ${item.description} </p></a>

    <a class="subscribe-button">Subscribe</a>`;
    banner.after(channelBox);
  }

  //-----displaying Playlist-----

  function displayPlaylist(item, idx) {
    const vidBox = document.createElement("a");
    vidBox.classList.add("vid-box", "playlist");
    vidBox.href = `vidPlay.html?listId=${item.playlistId}`;
    vidBox.id = "id" + item.playlistId;
    vidBox.innerHTML = `
         <div class="thumbnail-container" style="background-image: url(${
      //  item.thumbnail[2]?.url ||
      //  item.thumbnail[1]?.url ||
      //  item.thumbnail[0].url
      item.thumbnail.at(-1).url
      })"
          listId="${item.playlistId
      }"><p class="vid-duration"><img src="https://cdn-icons-png.flaticon.com/128/4043/4043804.png" width="12px"> ${item.videoCount
      } videos</p></div>

          <div class="vid-details">
            <img class="channel-thumbnail" src="./images/procodrr.jpg" />
          <div>
            <div class="vid-title"><h4>${item.title}</h4></div>
              <h4 class="channel-title">Hello India</h4>
              <p><span class="views"> 89 views.</span> <span class="published-duration">${Math.floor(
        Math.random(0.5, 1) * 5
      )}</span> Years ago </p>
            </div>
                          <span class="three-dots"> &#8942;</span>

          </div>`;
    videoArea.append(vidBox);
  }

  //-----displaying video-----

  function displayVideo(item, idx) {
    console.dir(item, item.thumbnail);
    const vidBox = document.createElement("a");
    vidBox.classList.add("vid-box", "video");
    vidBox.href = `vidPlay.html?id=${item.videoId}`;
    vidBox.id = "id" + item.videoId;
    vidBox.innerHTML = `
    <div class="thumbnail-container" id="${item.videoId
      }"  style="background-image: url(${
      // item.thumbnail[2]?.url || item.thumbnail[1]?.url || item.thumbnail[0].url
      item.thumbnail.at(-1).url
      })" >
      <p class="vid-duration">${item.lengthText}</p></div>
      <div class="vid-details">
        <img class="channel-thumbnail" src="${item.channelThumbnail?.[0].url || "./images/procodrr.jpg"
      }" />
            <div>
                <div class="vid-title"><h4>${item.description}</h4></div>
                <h4 class="channel-title">${item.channelTitle}</h4>
                <p><span class="views">${changeFormate(
        item.viewCount || 89
      )}</span> views.   
                   <span class="published-duration"> ${item.publishedTimeText
      } </span>
                </p>
            </div>
            <span class="three-dots"> &#8942;</span>

      </div>`;
    videoArea.append(vidBox);
  }
}
