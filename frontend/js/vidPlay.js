const baseRoute = `http://${window.location.host}`;

import { id } from "./common.js";
import { listId } from "./common.js";
console.log(id, listId);


//***************** importing modules in case of error while fetching data ***************

import { commentsByVideoId } from "../ApiData/commentsData.js";
import { suggestedDataRapidApi } from "../ApiData/suggestedDataRapidApi.js";
import { changeFormate } from "./common.js";
import { changeTimeFormate } from "./common.js";
import { changeVidDurationFormat } from "./common.js";

export const body = document.querySelector("body");
const leftPanel = document.querySelector(".left-panel");
const rightPanel = document.querySelector(".right-panel");


// updating urls after getting video id    // if id is not present in searchbar (in case of playlist)
id ? searchApiData(id) : setTimeout(() => searchApiData(sessionStorage.id), 1400);

function searchApiData(id) {
  searchAndDisplayCommentDataUsingGoogleApis();
  searchAndDisplaySuggestedVideoDataUsingRapidApi();
}

// showing more description

document
  .querySelector(".show-more-description")
  .addEventListener("click", () => {
    const isSmallDescription = document
      .querySelector(".video-description")
      .classList.toggle("small-video-description");
    if (isSmallDescription)
      document.querySelector(".show-more-description").innerText =
        "Show More ...";
    else
      document.querySelector(".show-more-description").innerText = "Show Less";
  });

// -------------------collapse left panel when click on body ----------------------

body.addEventListener("click", (e) => {
  leftPanel.classList.add("narrow-panel");
});

leftPanel.addEventListener("click", (e) => {
  e.stopPropagation();
});


// ***********************  searching and displaying suggested video data realated to currently playing video using RapidApi ***********************

function searchAndDisplaySuggestedVideoDataUsingRapidApi() {
  getSuggestedVideoData();

  // -------searching data ------

  async function getSuggestedVideoData() {
    console.log("getting suggested Data");
    await fetch(`${baseRoute}/api/getSuggestedVideoData?videoId=${id}`)
      .then((response) => response.json())
      .then((data) => {
        //if search data is successfully fetched
        console.log("\nSuggested Data successfully fetched", data);
        displaySuggestedVideoData(data);
      })
      // handeling error
      .catch((error) => {
        displaySuggestedVideoData(suggestedDataRapidApi);
        console.log("\nAAAAAA error occurred in suggestedData ", error);
      });
  }

  // ------displaying Data-------

  function displaySuggestedVideoData(data) {
    data.contents.forEach((items, idx) => {
      const vidBox = document.createElement("a");
      vidBox.classList.add("vid-box", "video");
      vidBox.id = "id" + items.video.videoId || items.id;
      vidBox.href = `vidPlay.html?id=${items.video.videoId} `;
      vidBox.innerHTML = `
    <div class="thumbnail-container" id = "${items.video.videoId || items.id
        } "  style="background-image: url(${items.video.thumbnails[1].url})" >
  <p class="vid-duration" > ${changeVidDurationFormat(
          items.video.lengthSeconds
        )
        }</ ></div >

  <div class="vid-details flex-box">
    <img class="channel-thumbnail" src="${items.video.author.avatar[0].url
        }"/>
    <div>
      <div class="vid-title">
        <h4>${items.video.title}</h4>
      </div>
      <h4 class="channel-title">${items.video.author.title}</h4>
      <p><span class='views'>${changeFormate(
          items.video.stats.views || Math.floor(Math.random() * 9999999)
        )}</span> views. <span class="published-duration"> ${items.video.publishedTimeText
        }</span></p>
    </div> <span class="three-dots">&#8942;</span>
  </div>`;
      rightPanel.append(vidBox);
    });
  }
}

//*********************************************  searching and displaying comments of Playing Video  *********************************************

let commentDataNextPageToken = '';

function searchAndDisplayCommentDataUsingGoogleApis(pageToken = '') {
  searchCommentData();

  //------searching comments of playing video-----

  function searchCommentData() {
    try {
      fetch(`${baseRoute}/api/getCommentData?videoId=${id}&pageToken=${pageToken}`)
        .then((response) => response.json())
        .then((data) => {
          // if search data is not fetched successfully < in case of quota full >
          if (data.error?.errors[0].message) {
            displayCommentData(commentsByVideoId);
            console.log(
              data.error?.errors[0].message,
              "\nfetched Comment Data is ",
              data
            );
          }
          //if search data is successfully fetched
          else {
            console.log("Comment Data successfully fetched", data);
            commentDataNextPageToken = data.nextPageToken;
            displayCommentData(data);
          }
        })
        // handeling error
        .catch((error) => {
          console.log("\nAAAAAA comment error occurred ", error);
          displayCommentData(commentsByVideoId);
        });
    }
    catch (err) {
      console.log(err)
    }
  }

  // -------displaying comments----------------
  function displayCommentData(commentData) {
    commentData.items.forEach((data) => {
      const comment = document.createElement("div");
      comment.className = "comment1";
      comment.innerHTML = `<img src = "${data.snippet.topLevelComment.snippet.authorProfileImageUrl
        }" />
      <div class="comment-content" >
        <div class="comment-head flex-comment">
          <h4 class="comment-author-name">${data.snippet.topLevelComment.snippet.authorDisplayName}</h4>
          <h5>${changeTimeFormate(data.snippet.topLevelComment.snippet.publishedAt)}</h5>
        </div>
        <p>
          ${data.snippet.topLevelComment.snippet.textDisplay}
        </p>
        <div class="comment-action flex-comment">
          <img src="./images/like.png" />
          <p>754</p>
          <img src="./images/dislike.png" />
          <p>20</p>
          <p>reply</p>
        </div>
        <p class="all-reply flex-comment">
          <img src="./images/more-reply.png" />
          142 Replies
        </p>
      </div> `;
      document.querySelector(".comment-container").append(comment);
    });
  }
}

// more comments
document.querySelector(".more-comments").addEventListener("click", () => {
  searchAndDisplayCommentDataUsingGoogleApis(commentDataNextPageToken);
});



// *************************************** fetching video info from server **********************************

// *********** fetching videoDetails from server ************
//
let url = id
  ? `https://youtu.be/${id}`
  : `https://youtu.be/${sessionStorage.getItem("id")}?list=${listId}`;

console.log("url is :", url);



fetchAndDisplayvideoDetails(url);
function fetchAndDisplayvideoDetails(url) {
  fetch(`${baseRoute}/api/videoDetails?videoUrl=${url}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("video Details : ", data);
      displayPlayingVideoinfo(data);
    })
    .catch((err) => console.log("Fetch error:", err));

  function displayPlayingVideoinfo(videoDetails) {
    document.querySelector(".video-title").innerText = videoDetails.title;
    document.querySelector(".view-count").innerText = changeFormate(
      videoDetails.viewCount
    );
    document.querySelector(".time").innerText = changeTimeFormate(
      videoDetails.uploadDate
    );
    document.querySelector(".like-count").innerText = changeFormate(
      videoDetails.likeCount
    );
    document.querySelector(".channel-name").innerText =
      videoDetails.ownerChannelName;

    document.querySelector(".channel-author").src =
      videoDetails.author.thumbnails.at(-1).url;

    document.querySelector(".subscriber-count").innerText = changeFormate(
      videoDetails.author.subscriber_count
    );

    document.querySelector(".video-description").innerHTML =
      getVideoDescription(videoDetails.description);
  }

  function getVideoDescription(description) {
    const descriptionElement = document.querySelector(".video-description");
    description = description.split("\n").map((eachLineText) => {
      if (eachLineText.includes("http")) {
        let [text, link] = eachLineText.split("http");
        link = "http" + link;
        eachLineText =
          text +
          `<a href=${link
            .replace("https://www.youtube.com/watch?v=", "vidPlay.html?id=")
            .replace("https://youtu.be/", "vidPlay.html?id=")}>${link}</a>`;
      }
      if (eachLineText == "") {
        eachLineText = "<br>";
      }
      return eachLineText;
    });
    return description.join("<br>");
  }
}

//******* fetching related Video Data from server ************
//
// fetchAndDisplayRelatedVideoData(url);
function fetchAndDisplayRelatedVideoData(url) {
  console.log("id is", id);

  fetch(`${baseRoute}/api/relatedVideosData?videoUrl=${url}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("related Videos Data from SERVER is :", data);

      data.length != 0 ?
        displayRelatedVideosData(data) : searchAndDisplaySuggestedVideoDataUsingRapidApi(); //ternary operator

    })
    .catch((err) => console.log("Fetch error:", err));

  function displayRelatedVideosData(relatedVideoData) {
    console.log("displaying realated Video from server");
    relatedVideoData.forEach((item, idx) => {
      // console.log("displaying", item);
      const vidBox = document.createElement("a");
      vidBox.classList.add("vid-box", "video");
      vidBox.id = "id" + item.id;
      vidBox.href = `vidPlay.html?id=${item.id}`;
      vidBox.innerHTML = `
         <div class="thumbnail-container" id="${item.id
        }"style="background-image: url(${item.thumbnails.at(-1).url
        })">
      <p class="vid-duration">${changeVidDurationFormat(
          item.length_seconds
        )}</p></div>

          <div class="vid-details flex-box">
            <img class="channel-thumbnail" src="${item.author.thumbnails[0].url
        }"/>
            <div>
            <div class="vid-title">
              <h4>${item.title}</h4>
               </div>
              <h4 class="channel-title">${item.author.name}</h4>
              <p><span class='views'>${changeFormate(
          item.view_count
        )}</span> views. <span class="published-duration"> ${item.published
        }</span></p>
            </div> <span class="three-dots">&#8942;</span>
          </div>`;
      rightPanel.append(vidBox);
    });
  }
}
