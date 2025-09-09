// NOTE **  ||__iframe Api does not work in modules__||

const urlParams = new URLSearchParams(window.location.search); // gives the object(urlParams) of paramenters passing in url
let id = urlParams.get("id");
let listId = urlParams.get("listId");

//*************************  playing video using Iframe API  ************************************  */

// loading the IFrame Player API code asynchronously
try {
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/player_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // creting an <iframe> (and YouTube player) after the API code downloads.
  var player;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
      height: "390",
      width: "640",
      videoId: id || "dQw4w9WgXcQ",

      // customizing the player
      playerVars: {
        rel: 0,
        modesbranding: 1,
        playsinline: 1,
        // list: "PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ",
        autoplay: 1,
        iv_load_policy: 3,   // Hide video annotations
        loop: 1,
        // mute: 1,
        controls: 1,
        enablejsapi: 1,
        disablekb: 0,

        // playlist: "frZkjz9MaWg,UNuBKZoinDI,LhRfkaMp7g0",
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onPlaybackRateChange: onPlayerPlaybackRateChange,
      },
    });
  }
  function onPlayerReady(event) {
    if (listId) {
      player.loadPlaylist({
        listType: "playlist",
        list: listId,
      });
    }

    const seekTimes = JSON.parse(sessionStorage.getItem("seekTimes"));
    if (seekTimes[id]) {
      player.seekTo(seekTimes[id], true);
    }

    // maintaining playback speed as it was in previous video
    player.setPlaybackRate(+sessionStorage.playbackSpeed);
  }

  function onPlayerStateChange(event) {
    console.log(event.data)
    //getting playing video url parameters when state is unstarted(-1)
    if (event.data == -1) {
      params = new URLSearchParams(player.getVideoUrl().split("?")[1]);
      id = params.get("v");
      // console.log(id, " ", listId);
      sessionStorage.id = id;
    }
    else if (event.data == 1) {
      document.querySelector(".video-title").innerText = player.videoTitle;
      document.querySelector(".channel-name").innerText =
        player.getVideoData().author;
    }

    player.unMute();
  }
  function onPlayerPlaybackRateChange() {
    sessionStorage.playbackSpeed = player.getPlaybackRate();
  }
}
catch (err) {
  console.log(err);
}

// saving player state before refresh

window.addEventListener('beforeunload', (e) => {
  console.log('Page is about to be refreshed or closed');

  let seekTimes = JSON.parse(sessionStorage.getItem('seekTimes')) || {};
  seekTimes[id] = player.getCurrentTime()
  sessionStorage.setItem('seekTimes', JSON.stringify(seekTimes));
});