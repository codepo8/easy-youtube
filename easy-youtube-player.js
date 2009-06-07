/*
  Easy YouTube Player by Christian Heilmann
  Version: 2.0
  Homepage: http://icant.co.uk/sandbox/easy-youtube/
  Copyright (c) 2008, Christian Heilmann
  Code licensed under the BSD License:
  http://wait-till-i.com/license.txt
*/
var eYTp = function(){
  var youtubematch = /(http:\/\/[a-z]*\.?youtube\.com\/.*\?v=)/;
  var searchmatch = /search=([^&|#|$]+)/;
  var tagmatch = /tag=([^&|#|$]+)/;
  var idmatch = /v=([^&|#|$]+)/;
  var scriptmatch = /<script>([^<]+)<\/script>/;
  var playerblock = {
    start:/.*?<!-- start player -->/,
    end:/<!-- end player -->.*?$/g
  };
  var configErrorMessage = 'Error in configuration object!';
  var ytplayer,id,state = null;
  var config = null,maincontainer,canvas,containerwidth,url;
  var output,searchfield,volumeControls = {};
  var playercontainer = document.getElementById('easyyoutubeplayer');
  if(playercontainer){
    ajax('template.html');
  }; 
  function setupPlayer(data){
    var html = data.replace(/\n/g,'');
    var script = html.match(scriptmatch);
    if(script && typeof script[1] === 'string'){
      try {
        eval(script[1]);
      } catch(error) {
        alert(configErrorMessage);
      }
      var playerHTML = html.replace(playerblock.start,'');
      playerHTML = playerHTML.replace(playerblock.end,'');
      playercontainer.innerHTML = playerHTML;
      maincontainer = getById('container');
      canvas = getById('canvas');
      containerwidth = maincontainer.offsetWidth;
      containerheight = canvas.offsetHeight;
      var params = { 
        allowScriptAccess:'always', 
        bgcolor:'#cccccc'
      };
      var atts = {
        id:'eytp-generated'
      };
      swfobject.embedSWF(config.application.youtubeAPI + '?key=' + 
                         config.application.devkey + '&enablejsapi=1& ' +      
                         'playerapiid=ytplayer',
                         config.CSS.IDs.player,  
                         config.application.movieWidth, 
                         config.application.movieHeight, '8', null, null,
                         params, atts);
      var controls = getById('controls');
      if(controls){
        volumeControls = {
         input:getById('volumeField'), 
         display:getById('volumeBar')
        };
        addEvent(controls,'click',playerAction);
      }
      var playerform = getById('playerForm');
      if(playerform){
        addEvent(playerform,'submit',cueLocation);
      }
      var search = getById('searchForm');
      var input = getById('searchField');
      if(search && input){
        searchfield = input;
        addEvent(search,'submit',doSearch);
      }
      var playlist = getById('searchOutput');
      if(playlist){
        output = playlist;
        addEvent(playlist,'click',playListAction);
      }
      var sizecontrol = getById('sizeControl');
      if(sizecontrol){
        addEvent(sizecontrol,'click',sizeControlAction);
      }
      var location = getById('urlField');
      if(location){
        url = location;
      }
    }
  };
  function analyzeLocation(){
    var loc = window.location.href.toString().split('#')[0];
    loc = loc.replace(/%3A/g,':');
    loc = loc.replace(/%2F/g,'/');
    loc = loc.replace(/%3F/g,'?');
    var urlid = loc.match(idmatch);
    var urlsearch = loc.match(searchmatch);
    var tagsearch = loc.match(tagmatch);
    if(tagsearch && typeof tagsearch[1] === 'string'){
      searchfield.value = '';
      getDeliciousList(tagsearch[1]);
    } 
    if(urlsearch && typeof urlsearch[1] === 'string'){
      searchfield.value = urlsearch[1];
      doSearch();
    } 
    if(urlid && typeof urlid[1] === 'string'){
      id = urlid[1];
      if(loc.match(youtubematch)){
        var yturl = loc.match(youtubematch)[0] + id;
        url.value = yturl;
        cueLocation();
      }
    }
  };

/* Player actions */
var actions = {
  play:function(){
    if(ytplayer){
      var state = ytplayer.getPlayerState();
      if(state === -1 || state === 0){
        cueLocation();
      } else {
        ytplayer.playVideo();
      };
    }
  },
  pause:function(){
    if(ytplayer){
      var state = ytplayer.getPlayerState();
      if(state === 2){
        ytplayer.playVideo();
      } else {
        ytplayer.pauseVideo();
      }
    }
  },
  stop:function(){
    if(ytplayer){
      ytplayer.stopVideo();
    }
  },
  louder:function(){
    if(ytplayer){
      changeVolume(config.application.volumeChange);
    }
  },
  quieter:function(){
    if(ytplayer){
      changeVolume(-config.application.volumeChange);
    }
  },
  mute:function(){
    if(ytplayer){
      if(ytplayer.isMuted()){
        ytplayer.unMute();
        volumeControls.display.className = '';
      } else {
        ytplayer.mute();
        volumeControls.display.className = config.CSS.classes.disabled;
      }    
    }
  },
  zoom:function(){
    zoom();
  },
  repeat:function(){
    if(ytplayer){
      var now = ytplayer.getCurrentTime();
      var s = config.secondsToRepeat;
      var then = (now - s) > 0 ? (now-s) : 0;
      ytplayer.seekTo(then,false);
    }
  }
};

/* Event listeners */

  function onPlayerReady(){
    ytplayer = document.getElementById('eytp-generated');
    ytplayer.addEventListener('onStateChange', 'eYTp.stateChange');                   
  };
  function stateChange(s){
    if(s === -1){
      changeVolume(0);
      analyzeLocation();
    }
  };
  function playerAction(e){
    if(ytplayer){
      if(e.type === 'click'){
        var action = getButtonAction(e);
        if(actions[action]){
          actions[action]();
        }
      }
    }    
    cancelClick(e);
  };
  function getButtonAction(e){
    var action = null;
    var o = window.event ? window.event.srcElement : e ? e.target : null;
    if(o.nodeName.toLowerCase() === 'input'){
      var action = o.id.replace('eytp-','');
    }
    return action;
  };
  function playListAction(e){
    cancelClick(e);
    if(e.type === 'click'){
      var o = window.event ? window.event.srcElement : e ? e.target : null;
      if(o.nodeName.toLowerCase() === 'a'){
        var action = o.getAttribute('href');
        if(typeof action === 'string'){
          if(action.indexOf('youtube.com') !== -1){
            url.value = action;
            cueLocation();
          }
        }    
      }
    }
  };
  function sizeControlAction(e){
    var action = getButtonAction(e);
    var by = 1;
    if(action){
      switch (action){
        case 'zoom100':
          by = 1;
        break;
        case 'zoom150':
          by = 1.5;
        break;
        case 'zoom200':
          by = 2;
        break;
      }
      zoom(by);
    }
    cancelClick(e);
  };

/* Player functionality listeners */

  function changeVolume(change) {
    if(ytplayer){
      if(ytplayer.isMuted()){
        ytplayer.unMute();          
      }
      var current = ytplayer.getVolume();
      var newVolume = +current + change;
      if(newVolume > 100){ 
        volumeControls.display.className = config.CSS.classes.maxvolume;
        newVolume = 100; 
      }else{
        volumeControls.display.className = '';
      }
      if(newVolume <= 0){ 
        newVolume = 0; 
      };
      var msg = config.application.volumeMessage.replace('$x',newVolume);
      volumeControls.input.value = msg; 
      volumeControls.display.style.height = 300*newVolume/100 +'px';
      ytplayer.setVolume(newVolume);
    }
  };
  function zoom(by){
    var xy = [config.application.movieWidth,config.application.movieHeight];
    ytplayer.style.width = (xy[0]*by)+'px';
    ytplayer.style.height = (xy[1]*by)+'px';
    ytplayer.setSize(xy[0]*by,xy[1]*by);
    var width = containerwidth;
    var height = containerheight;
    switch(by){
      case 1.5:
        width += config.application.movieWidth/2;
        height += config.application.movieHeight/2;
      break;
      case 2:
        width += config.application.movieWidth;
        height += config.application.movieHeight;
      break;
    }
    maincontainer.style.width = width + 'px';
    canvas.style.height = height + 'px';
  };
  function cueLocation(e){
    cancelClick(e);
    if(ytplayer && typeof ytplayer.getPlayerState() === 'number'){
      ytplayer.stopVideo();
      ytplayer.clearVideo();
      var v = url.value;
      var id = v.match(idmatch);
      if(typeof id[1]==='string'){
        id = id[1];
        ytplayer.cueVideoById(id,0);
      }
    }
  };

/* Del.icio.us Feed */

  function getDeliciousFeed(data){
  if(output){
    var all = data.length;
    if(all>0){
      var out = [];
      var l = all > 10 ? 10 : all;
      for(var i=0;i<l;i++){
        out.push('<li><a href="' + data[i].u + 
                '">' + data[i].d + '</a></li>');
      }
      output.innerHTML = out.join('');
    } else {
      output.innerHTML = config.application.noVideosFoundMessage;
    }
  }
  searchfield.value = '';
};
  function getDeliciousList(data){
    var c = data.split('-');
    jsonCall('http://feeds.delicious.com/feeds/json/' + c[0] + '/' + 
            c[1] + '?callback=eYTp.getDeliciousFeed&count=' +
            config.application.searchResults);
  };

/* Search */

  function doSearch(e){
    /* thank the flying spaghetti monster for pipes.yahoo.com! */
    var url = 'http://pipes.yahoo.com/pipes/pipe.run?' + 
              '_id=26ca074a13d28a8ad64e154a76244d43&_callback=' +   
              'eYTp.getFeed&_render=json&s=' + 
              searchfield.value.replace(' ','+');
    output.innerHTML = '<li>' + config.application.loadingMessage + '</li>' ;
    jsonCall(url);
    searchfield.value += ' ';
    cancelClick(e);
  }
  function getFeed(data){
    var s = searchfield;
    var o = output;
    if(o){
      var all = data.value.items[0].channel.item.length;
      if(all>0){
        var out = [];
        var l = all > config.application.searchResults ? config.application.searchResults : all;
        var results =  data.value.items[0].channel.item;
        for(var i=0;i<l;i++){
          out.push('<li><a href="' + results[i].link + 
                  '"><img src="' + results[i]['media:thumbnail'].url + 
                  '" alt="">' + results[i].title + '</a></li>');
        }
        o.innerHTML = out.join('');
      } else {
        o. innerHTML = config.application.noVideosFoundMessage;
      }
    }
    s.value = s.value.replace(/\s$/,'');
  };

/* Helper methods */

  function jsonCall(src){
    var n = document.createElement('script');
    n.setAttribute('type','text/javascript');
    n.setAttribute('src',src);
    document.getElementsByTagName('head')[0].appendChild(n);
  };
  function getById(id){
    return document.getElementById(config.CSS.IDs[id]);
  }
  function ajax(url){
    var request;
    try{
      request = new XMLHttpRequest();
    }catch(error){
      try{
        request = new ActiveXObject("Microsoft.XMLHTTP");
      }catch(error){
        return true;
      }
    }
    request.open('get',url,true);
    request.onreadystatechange = function(){
      if(request.readyState == 4){
        if(request.status){ 
          if(request.status === 200 || request.status === 304){
            if(url === 'template.html'){
              setupPlayer(request.responseText);
            }
          }
        }else{
          alert('Error: Could not find template...');
        }
      }
    };
    request.setRequestHeader('If-Modified-Since','Wed, 05 Apr 2006 00:00:00 GMT');
    request.send(null);
  };
  function addEvent(elm, evType, fn, useCapture){
    if (elm.addEventListener){
      elm.addEventListener(evType, fn, useCapture);
      return true;
    } else if (elm.attachEvent) {
      var r = elm.attachEvent('on' + evType, fn);
      return r;
    } else {
      elm['on' + evType] = fn;
    }
  };
  function cancelClick(e){
    if (window.event){
      window.event.cancelBubble = true;
      window.event.returnValue = false;
    }
    if (e && e.stopPropagation && e.preventDefault){
      e.stopPropagation();
      e.preventDefault();
    }
  };

/* public method pointers */

  return{
    ready:onPlayerReady,
    getFeed:getFeed,
    stateChange:stateChange,
    getDeliciousFeed:getDeliciousFeed
  };
}();

/* callback from YouTube API */
function onYouTubePlayerReady(playerId) {
  eYTp.ready(playerId);
};