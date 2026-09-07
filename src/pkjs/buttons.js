'use strict';
var defaults=[0,0,0,4,5,1,0,0,0,4,2,6,5,5];
function normalize(value){return defaults.map(function(fallback,i){if(i<12&&(i%6===0||i%6===2))return 0;var n=value&&value[i];return typeof n==='number'&&n>=(i<12?0:1)&&n<=12&&n%1===0?n:fallback;});}
function setup(saved){
  var names=['Up press','Select press','Down press','Up long press','Select long press','Down long press'];
  var actions=['Normal navigation','Quick Dictate (new note)','Quick Dictate (append)','Delete note','Pin / unpin','Actions menu','No action','Refresh','Dictate to search','Stitch (new note)','Stitch (append)','Return to top','Sort notes'];
  var box=document.getElementById('buttons');
  var html='<p>Up and Down always navigate or scroll. Customize Select, long presses, and Double Back separately for each view. Press Back twice quickly to use its shortcut; Actions is the default. A single Back still returns.</p>';
  var order=[0,1,2,3,4,5,12,6,7,8,9,10,11,13];
  order.forEach(function(i){if(i===0||i===6)html+='<h3>'+(i===0?'Main / folder view':'Note view')+'</h3>';if(i<12&&(i%6===0||i%6===2))return;html+='<label>'+(i>=12?'Double Back':names[i%6])+'<select id="button-'+i+'">';for(var a=i>=12?1:0;a<actions.length;a++)html+='<option value="'+a+'"'+(saved[i]===a?' selected':'')+'>'+actions[a]+'</option>';html+='</select></label>';});
  box.innerHTML=html;
  return function(){var values=[];for(var i=0;i<14;i++)values.push(i<12&&(i%6===0||i%6===2)?0:Number(document.getElementById('button-'+i).value));return values;};
}
module.exports={normalize:normalize,setup:setup};
