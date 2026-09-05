var BUILT_IN_THEMES = [
  {
    name: "Classic",
    text: "#000000",
    background: "#ffffff",
    selection: "#000000",
    font: "gothic",
    size: 24,
    icons: true,
    builtIn: true
  },
  {
    name: "Pome Amber",
    text: "#550000",
    background: "#ffffaa",
    selection: "#ffaa00",
    font: "gothic-bold",
    size: 24,
    icons: true,
    builtIn: true
  },
  {
    name: "Midnight",
    text: "#ffffff",
    background: "#000055",
    selection: "#00aaff",
    font: "roboto-condensed",
    size: 21,
    icons: true,
    builtIn: true
  },
  {
    name: "Forest",
    text: "#ffffff",
    background: "#005500",
    selection: "#aaff00",
    font: "droid-serif",
    size: 28,
    icons: true,
    builtIn: true
  },
  {
    name: "Berry",
    text: "#ffffff",
    background: "#550055",
    selection: "#ff55aa",
    font: "bitham-black",
    size: 30,
    icons: false,
    builtIn: true
  }
];

var TIME2_BUILT_IN_THEMES = [
  {name: "Classic", text: "#000000", background: "#ffffff", selection: "#000000",
   font: "inter", size: 22, icons: true, builtIn: true},
  {name: "Pome Amber", text: "#550000", background: "#ffffaa", selection: "#ffaa00",
   font: "montserrat", size: 22, icons: true, builtIn: true},
  {name: "Midnight", text: "#ffffff", background: "#000055", selection: "#00aaff",
   font: "roboto", size: 22, icons: true, builtIn: true},
  {name: "Forest", text: "#ffffff", background: "#005500", selection: "#aaff00",
   font: "open-sans", size: 26, icons: true, builtIn: true},
  {name: "Berry", text: "#ffffff", background: "#550055", selection: "#ff55aa",
   font: "poppins", size: 30, icons: false, builtIn: true}
];

var THEME_FONTS = {
  gothic: 0,
  "gothic-bold": 1,
  "roboto-condensed": 2,
  "droid-serif": 3,
  "bitham-black": 4,
  inter: 5,
  roboto: 6,
  "open-sans": 7,
  montserrat: 8,
  poppins: 9
};
var THEME_FONT_SIZES = {
  gothic: [14, 18, 24, 28],
  "gothic-bold": [14, 18, 24, 28],
  "roboto-condensed": [21],
  "droid-serif": [28],
  "bitham-black": [30],
  inter: [14, 18, 22, 26, 30],
  roboto: [14, 18, 22, 26, 30],
  "open-sans": [14, 18, 22, 26, 30],
  montserrat: [14, 18, 22, 26, 30],
  poppins: [14, 18, 22, 26, 30]
};


function presets(enhanced){return enhanced?TIME2_BUILT_IN_THEMES:BUILT_IN_THEMES;}
function normalize(c,enhanced){
 var list=presets(enhanced),t=c&&c.appearance;
 if(!t)t=list[c&&c.theme===1?3:c&&c.theme===2?2:0];
 var fallback=list[0],font=Object.prototype.hasOwnProperty.call(THEME_FONTS,t.font)?t.font:fallback.font;
 if(enhanced&&THEME_FONTS[font]<5)font={gothic:'inter','gothic-bold':'montserrat','roboto-condensed':'roboto','droid-serif':'open-sans','bitham-black':'poppins'}[font];
 if(!enhanced&&THEME_FONTS[font]>=5)font='gothic';
 var sizes=THEME_FONT_SIZES[font],size=sizes.reduce(function(a,b){return Math.abs(b-Number(t.size))<Math.abs(a-Number(t.size))?b:a;},sizes[0]);
 function color(v,d){return /^#[a-f0-9]{6}$/i.test(v)?v:d;}
 return {font:font,size:size,background:color(t.background,fallback.background),text:color(t.text,fallback.text),selection:color(t.selection,fallback.selection)};
}
function rgb(hex){return parseInt(hex.slice(1),16);}
function pebbleColor(hex){var n=rgb(hex);return 192|(Math.round(((n>>16)&255)/85)<<4)|(Math.round(((n>>8)&255)/85)<<2)|Math.round((n&255)/85);}
function message(c,enhanced){var t=normalize(c,enhanced),n=rgb(t.selection),light=(((n>>16)&255)*299+((n>>8)&255)*587+(n&255)*114)/1000>=150;
 return {TYPE:6,AUTO:c&&c.autoDictate?1:0,THEME_BACKGROUND:pebbleColor(t.background),THEME_TEXT:pebbleColor(t.text),THEME_SELECTION:pebbleColor(t.selection),THEME_SELECTION_TEXT:light?192:255,THEME_FONT:THEME_FONTS[t.font],THEME_SIZE:t.size};}
module.exports={presets:presets,normalize:normalize,message:message,sizes:THEME_FONT_SIZES};
function setup(initial,presets,sizes){
 var ids=['preset','font','size','background','text','selection'],el={};ids.forEach(function(id){el[id]=document.getElementById('appearance-'+id);});
 function options(items){return items.map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>';}).join('');}
 el.preset.innerHTML='<option value="">Custom</option>'+options(presets.map(function(t,i){return [i,t.name];}));
 var labels={'inter':'Inter','roboto':'Roboto','open-sans':'Open Sans','montserrat':'Montserrat','poppins':'Poppins','gothic':'Gothic','gothic-bold':'Gothic Bold','roboto-condensed':'Roboto Condensed','droid-serif':'Droid Serif Bold','bitham-black':'Bitham Black'};
 var fonts=[];presets.forEach(function(t){if(fonts.indexOf(t.font)<0)fonts.push(t.font);});el.font.innerHTML=options(fonts.map(function(f){return [f,labels[f]];}));
 function updateSizes(size){var list=sizes[el.font.value];el.size.innerHTML=options(list.map(function(n){return [n,n+' px'];}));el.size.value=list.indexOf(Number(size))>=0?size:list[0];}
 function apply(t){el.font.value=t.font;updateSizes(t.size);['background','text','selection'].forEach(function(k){el[k].value=t[k];});}
 apply(initial);el.preset.value='';
 el.preset.onchange=function(){if(el.preset.value!=='')apply(presets[Number(el.preset.value)]);};
 el.font.onchange=function(){updateSizes(el.size.value);el.preset.value='';};
 return function(){return {font:el.font.value,size:Number(el.size.value),background:el.background.value,text:el.text.value,selection:el.selection.value};};
}
module.exports.setup=setup;
