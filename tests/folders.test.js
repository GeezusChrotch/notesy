const {test}=require('node:test'),assert=require('node:assert/strict'),{setup}=require('../src/pkjs/folders');
test('folder picker uses exact paths, expands lazily and applies all selected choices without moving files',()=>{
 const nodes={},requests=[];function element(){return {value:'',textContent:'',style:{},children:[],appendChild(n){this.children.push(n);},setAttribute(k,v){this[k]=v;}};}
 for(const id of ['folder-filter','folder-tree','folder-status','folders-load','folders-apply'])nodes[id]=element();
 const oldDocument=global.document,oldXHR=global.XMLHttpRequest;global.document={getElementById:id=>nodes[id],createElement:element,createTextNode:text=>({textContent:text}),querySelectorAll:()=>[]};global.XMLHttpRequest=function(){this.open=(method,url)=>{this.method=method;this.url=url;};this.setRequestHeader=()=>{};this.send=body=>{this.body=body;requests.push(this);};};
 try{
  setup(()=>({gatewayURL:'https://unit.example.ts.net',gatewayToken:'t'.repeat(40)}));nodes['folders-load'].onclick();assert.match(requests[0].url,/v3\/folders/);
  function reply(req,folders,hidden=[]){req.status=200;req.responseText=JSON.stringify({vaultId:'v',folders,hidden});req.onload();}
  reply(requests[0],[{name:'Work',path:'Work'},{name:'Home',path:'Home'}]);const row=nodes['folder-tree'].children[0],check=row.children[0].children[0];check.checked=true;check.onchange();row.children[1].onclick();assert.match(requests[1].url,/parent=Work/);reply(requests[1],[{name:'Archive',path:'Work/Archive'}]);
  const child=row.children[2].children[0].children[0].children[0];child.checked=true;child.onchange();nodes['folders-apply'].onclick();assert.deepEqual(JSON.parse(requests[2].body),{vaultId:'v',hidden:['Work','Work/Archive']});reply(requests[2],[]);assert.match(nodes['folder-status'].textContent,/Saved/);
 }finally{global.document=oldDocument;global.XMLHttpRequest=oldXHR;}
});
