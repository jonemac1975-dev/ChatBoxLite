// UI helper functions
const toast = (t) => {
const el = document.getElementById('toast');
el.textContent = t; el.style.display = 'block';
setTimeout(()=>el.style.display='none',2500);
}


// small helper to create message nodes
function createMsgNode(role, text){
const d = document.createElement('div');
d.className = 'msg ' + (role==='user'?'user':'bot');
d.innerText = text;
return d;
}


// format streaming chunks
function appendStreamText(node, chunk){
node.innerText = (node.innerText || '') + chunk;
}