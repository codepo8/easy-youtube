(function(){
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
            var content = request.responseText;
            var script = content.match(/<script>([^<]+)<\/script>/gmi);
            script = script[0].replace(/<\/?script>/g,'');
            script = script.replace(/\/\*/g,'<strong>/*');
            script = script.replace(/\*\//g,'*/<\/strong>');
            document.getElementById('configexample').innerHTML = script;
            var html = content.replace(/\n/g,'*br*');
            html = html.replace(/.*<!-- start player -->/g,'');
            html = html.replace(/<!-- end player -->.*/g,'');
            html = html.replace(/</g,'&lt;');
            html = html.replace(/>/g,'&gt;');
            html = html.replace(/"/g,'&quot;');
            html = html.replace(/\*br\*/g,'\n');
            document.getElementById('playerexample').innerHTML = html;
          }
        }else{
          alert('Error: Could not find template...');
        }
      }
    };
    request.setRequestHeader('If-Modified-Since','Wed, 05 Apr 2006 00:00:00 GMT');
    request.send(null);
  };
  ajax('../template.html');
})();  