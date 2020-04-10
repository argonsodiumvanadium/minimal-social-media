const daph_home = 'daphne_home.html' //https://daphne_test_1440.imfast.io/daphne_home.html

const PORT = 8080;
window.WebSocket = window.WebSocket||window.MozWebSocket;

var passable,registered,pass;
var dataIsNotHere = true,data = [];
var user,prevData = [];
var dom_elems = [];
var followers = [],rooms = [];
var user_data;
var background,posts;
var new_msgs=false;
var msg_update;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

retainData = () => {
	registered = 'not null'
	user = sessionStorage.getItem('user');
}

init = () =>{
	document.getElementById('body').onunload = function(event){
		I_exist(false);
	}
}

connect = order => {
	var socket = new WebSocket('ws://localhost:'+PORT);

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline")
	};

	socket.onmessage = async function(event) {
		//alert('got something '+event.data)
		data.push(event.data);
		dataIsNotHere = event.data != 'FIN';
	}

	socket.onopen = async function () {
		console.log('and today my job is to...'+order.job)
		if (order['job'] == 'register') {
			obj = order['json_able'];

			socket.send(JSON.stringify(obj));
			while (dataIsNotHere){
				await sleep(100);
			}
			pass = data[0]
			if (pass == 'ERR') {
				if (order.json_able.request == 'signup'){
					alert('the username is taken')
					registered = null;
					pass = null;
				} else {
					alert('either the username or password entered by you is incorrect')
				}
			} else {
				localStorage.setItem('user',pass)
				localStorage.setItem('registered','not null')
				registered = true;
				loadAJAX(daph_home);
			}
		} else if (order['job'] == 'feed') {
			obj = {
				request: order['request'],
				user     : user
			}

			socket.send(JSON.stringify(obj));

			while(dataIsNotHere) {
				await sleep(250)
			}

			data =[];
			dataIsNotHere = true;
		} else if (order['job'] == 'search') {
			obj = {
				request : 'search',
				query   : order['query'],
				user      : user
			}
			socket.send(JSON.stringify(obj));

			while(dataIsNotHere) {
				await sleep(10);
			}
			
			render_rightnav(); 

			data =[];
			dataIsNotHere = true;
		} else if (order['job'] == 'get_profile_data') {
			console.log('hey i am in get'+order.job)
			var req;
			req = {
				request : 'GET',
				user    : order.user,
				me      : user
			};

			socket.send(JSON.stringify(req));

			while (dataIsNotHere) {
				await sleep(200);
				console.log('sleep')
			}

			Data = JSON.parse(data[0])

			render_profile(Data)

			data =[];
			dataIsNotHere = true;
		} else if (order['job'] == 'get_base_profile_data') {
			console.log('hey i am in get'+order.job)
			var req;
			req = {
				request : 'GET',
				user    : order.user,
				me      : user
			};

			socket.send(JSON.stringify(req));

			while (dataIsNotHere) {
				await sleep(200);
				console.log('sleep')
			}

			Data = JSON.parse(data[0])

			user_data = Data
			I_exist(true);
			sessionStorage.setItem('followers',user_data.followers);
			background = user_data.backdrop
			document.getElementById('body').style.background = 'url(data:image/jpg;base64,'+background+')';
			document.getElementById('body').style.backgroundSize = '75% 100%';
			document.getElementById('body').style.backgroundRepeat = 'no-repeat';
			document.getElementById('body').style.backgroundAttachment = 'fixed';

			data =[];
			dataIsNotHere = true;
			get_rooms();
		} else if (order['job'] == 'follow') {
			var request = {
				request : 'follow',
				recv    : order.reciever,
				send    : user
			}

			socket.send(JSON.stringify(request));
		} else if (order['job'] == 'unfollow') {
			var request = {
				request : 'unfollow',
				recv    : order.reciever,
				me      : user
			}

			socket.send(JSON.stringify(request));
		}
	} //socket on open bracket
}

//call renderProfile .... JS SUCKS
render_profile = Data => {
	document.body.scrollTop = 0;
	document.documentElement.scrollTop = 0;
	if (Data.bio == '') {
		Data.bio = 'no bio given';
	} if (Data.username == user_data.username) {
		Data.status = 'this is you'
	} if (Data.status == '') {
		Data.status = 'not connected to you';
	} 

	var temp = document.createElement('div');
	temp.className = 'post';
	temp.id = 't';
	document.getElementById('canvas').appendChild(temp);


	backgrndImg = document.createElement('img');
	profImg  = document.createElement('img');
	abtMe1 = document.createElement('pre');
	abtMe2 = document.createElement('p');
	btn = document.createElement('button');

	backgrndImg.src = "data:image/jpg;base64,"+Data.backdrop;
	backgrndImg.alt = 'fail';
	
	document.getElementById('body').style.background = "url(data:image/jpg;base64,"+Data.backdrop+')';
	document.getElementById('body').style.backgroundSize = '75% 100%'
	document.getElementById('body').style.backgroundRepeat = 'no-repeat';
	document.getElementById('body').style.backgroundAttachment = 'fixed';


	profImg.src = "data:image/jpg;base64,"+Data.profile_pic;
	profImg.alt = 'fail';

	backgrndImg.style.borderRadius = '2vw';

	profImg.style.maxWidth = '35%';
	profImg.style.float = 'left';
	profImg.style.maxHeight = '35%';
	profImg.style.margin = '3vw';

	abtMe1.innerHTML = '<b>'+Data.username+'</b><br>'+Data.name+'';
	abtMe1.style.fontFamily = 'Oxanium';
	abtMe1.style.wordWrap = 'break-word';
	abtMe1.style.fontSize = '3vw';
	abtMe1.style.marginBottom = '0px';

	var btn = document.createElement('button');
	
	if (Data.username == user) {
		btn.textContent = 'edit profile';
		btn.style.width = '40%';
		btn.style.backgroundColor = '#444444';
		btn.style.color = '#eeeeee';
		btn.onclick = function() {
			edit_profile();
		}
		//hover_rev_func(btn)
	} else if (!Data.friend) {
		generate_gud_btn(btn,Data);

	} else {
		generate_bad_btn(btn,Data);
	}

	abtMe2.style.fontSize = '1vw';
	abtMe2.style.wordWrap = 'break-word';
	abtMe2.innerHTML = Data.bio +'<br><b>Connection</b>: '+Data.status;
	abtMe2.style.padding = '0vw 0.5vw 3vw 0vw';	

	//document.getElementById('t').appendChild(backgrndImg);
	document.getElementById('t').appendChild(profImg);
	document.getElementById('t').appendChild(abtMe1);
	document.getElementById('t').appendChild(btn);
	document.getElementById('t').appendChild(abtMe2);
	//the main thing is done

	postPart = document.createElement('div');
	postPart.className = 'post';
	postPart.style.borderColor = 'transparent';

	if (Data.posts.length == 0) {
		postPart.style.textAlign = 'center';
		h1 = document.createElement('h1');
		h1.innerHTML = '<b>nothing to see over here</b>';
		h1.style.display = 'block'
		h1.style.margin = '5vw auto 5vw auto';
		dom_elems.push(h1);
		postPart.appendChild(h1);
	}

	for (var i = 0; i < Data.posts.length; i++) {
		image = document.createElement('img');
		console.log(Data);
		image.src = 'data:image/png;base64,'+ Data.posts[i].src;
		image.style.display = 'block';
		image.style.margin = '1vw auto 1vw auto';
		image.style.size = '50%';
		posts = Data.posts[i];

		image.onclick = function () {
			displayPopup(posts,this);
		};
		postPart.appendChild(image);
		dom_elems.push(image);
	}

	document.getElementById('canvas').appendChild(postPart);

	dom_elems.push(profImg,abtMe1,abtMe2,btn,temp);
}

displayPopup = (post_data,arg) => {
	if (arg.caption == ''||arg.caption == undefined) {
		arg.caption = "-- NO CAPTION --"
	}

	var modal = document.getElementById('m');
	var obj = document.createElement('img');
	var para = document.createElement('p');
	var cont = document.createElement('div');
	var dash = document.createElement('div');

	cont.className = 'content';
	para.innerHTML = '<h5>'+post_data.username+'<b></h5>'+post_data.name+'</b><br><br>'+post_data.caption+'<br><br><br>';

	modal.style.display = 'block';
	// When the user clicks on <span> (x), close the modal
	document.getElementById('close').onclick = function() {
		modal.style.display = "none";
		cont.remove();
		document.getElementById('content').innerHTML = '';
		modal.innerHTML = '<div class="modal-content" id="content"><span class="close" id="close">&times;</span></div>';
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
			cont.remove();
			document.getElementById('content').innerHTML = '';
			modal.innerHTML = '<div class="modal-content" id="content"><span class="close" id="close">&times;</span></div>';
		}
	}

	obj.style.margin = '5%';
	obj.src = arg.src;
	obj.align= 'left';

	lbtn = document.createElement('button');
	lbtn.style.backgroundColor = '#ff0033';
	lbtn.style.color = 'white';
	lbtn.textContent = 'Lovely !';
	lbtn.style.width = '30%';
	lbtn.style.height = '3vw';
	lbtn.style.borderColor = 'transparent';
	lbtn.style.margin = '2.5%';
	lbtn.style.marginLeft = '-1vw';

	nbtn = document.createElement('button');
	nbtn.style.backgroundColor = '#00ee33';
	nbtn.style.color = 'white';
	nbtn.textContent = 'Nice';
	nbtn.style.width = '30%';
	nbtn.style.height = '3vw';
	nbtn.style.borderColor = 'transparent';
	nbtn.style.margin = '2.5%';

	mbtn = document.createElement('button');
	mbtn.style.backgroundColor = '#aaaaaa';
	mbtn.style.color = 'white';
	mbtn.textContent = 'meh';
	mbtn.style.width = '30%';
	mbtn.style.height = '3vw';
	mbtn.style.borderColor = 'transparent';
	mbtn.style.margin = '2.5%';


	comment = document.createElement('textarea');
	comment.setAttribute('style', 'height:' + (comment.scrollHeight) + 'px;overflow-y:hidden;');
	comment.addEventListener("input", OnInput, false);

	function OnInput() {
	  this.style.height = 'auto';
	  this.style.height = (this.scrollHeight) + 'px';
	}
	comment.style.height = '1vw';
	comment.style.minWidth = '90%';
	comment.style.backgroundColor = '#ffffff';
	comment.style.color = '#000000';
	comment.style.height = '3vw';
	comment.style.borderColor = 'transparent';
	comment.style.borderBottomColor = '#000000';
	comment.style.margin = '2.5%';
	comment.placeholder = 'comment ...'
	comment.addEventListener('keyup',function(event){
		if (event.keyCode === 13) {
			event.preventDefault();
			//submit comment to-do code............................
		}
	});
	
	dash.appendChild(lbtn);
	dash.appendChild(nbtn);
	dash.appendChild(mbtn);
	dash.appendChild(comment);

	obj.style.maxWidth = '60%';
	obj.style.marginLeft = '10%';
	obj.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 6px 20px 0 rgba(0, 0, 0, 0.3)'

	cont.appendChild(para);
	cont.appendChild(dash);

	document.getElementById('content').appendChild(cont);
	document.getElementById('content').appendChild(obj);
}

function loadAJAX(name) {
	window.open(name,'_self');

	/*var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			document.getElementsByTagName("body")[0].innerHTML = this.responseText;
		}
	};

	xhttp.open("GET",name, true);
	xhttp.send();*/
}

edit_profile = () => {

}

render_rightnav = () => {
	if (data[0] != 'FIN') {
		object = JSON.parse(data[0]);

		Data = object.result;

		for (var i = 0; i < prevData.length; i++) {
			prevData[i].remove();
		}

		for(var i=0;i<Data.length;i++) {
			var div = document.getElementById('rightnav');
			var btn = document.createElement('button');

			btn.innerHTML = "<b>"+Data[i].username+"</b> <br>"+Data[i].name;
			btn.onclick = function() {
				renderProfile(this.textContent.split(' ')[0])
			}

			div.appendChild(btn);
			prevData.push(btn);
			document.getElementById('search query').focus();
		}

		if (Data.length == 0) {
			get_rooms();
		}
	}
}

function restore_default_view ()  {
	console.log(followers)
	var followers = sessionStorage.getItem('followers');
	var div = document.getElementById('rightnav');

	var add_msg = document.createElement('button');
	add_msg.innerHTML = '+';
	add_msg.style.backgroundColor = '#00ff55';
	add_msg.style.color = 'white';
	add_msg.style.margin = '0px';
	add_msg.style.paddingLeft = '45%';
	hover_rev_func(add_msg);

	add_msg.onclick = function(){
		create_room();
	}

	var para = document.createElement('h4');
	para.textContent = 'Your Messages';
	div.appendChild(para);
	div.appendChild(add_msg);
	prevData.push(para,add_msg);

	if (rooms == undefined||rooms.length == 0) {
		var para = document.createElement('p');
		para.innerHTML = '<b>No messages AT ALL</b><br>go talk to someone, it is good for your heart';
		div.appendChild(para);
		prevData.push(para);
	} else {
		for (var i = 0; i < rooms.length; i++) {
			var btn = document.createElement('button');
			btn.id = i;

			btn.innerHTML = "<b>"+rooms[i]+"</b><br>";
			btn.onclick = function() {
				render_chat(this.textContent);
			}
			
			btn.oncontextmenu = function(){
				open_room_editor(this)
			}

			div.appendChild(btn);
			prevData.push(btn);
		}
	}

	var para = document.createElement('h4');
	para.textContent = 'Your Followers';
	div.appendChild(para);
	prevData.push(para);

	if (followers == undefined||followers.length == 0) {
		var para = document.createElement('p');
		para.innerHTML = '<b>You have no followers as of now</b>';
		div.appendChild(para)
		prevData.push(para);
	}

	followers = followers.split(',');

	for (var i=0;i<followers.length;i++){
		var btn = document.createElement('button');

		btn.innerHTML = "<b>"+followers[i]+"</b><br>";
		btn.onclick = function() {
			renderProfile(this.textContent)
		}
		div.appendChild(btn);
		prevData.push(btn);
	}
}

get_rooms = () => {
	var socket = new WebSocket('ws://localhost:'+PORT);

	var req = {
		request : 'GET_RD',
		user    : user_data.username
	}

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline")
	};

	socket.onmessage = async function(event) {
		rooms = JSON.parse(event.data);
		console.log(rooms)
		restore_default_view()
	}

	socket.onopen = async function () {
		socket.send(JSON.stringify(req));
	}
}


generate_gud_btn = (btn,Data) => {
	btn.textContent = 'follow';
	btn.style.width = '40%';
	btn.style.backgroundColor = '#0088dd';
	btn.style.color = '#eeeeee';
	btn.onclick = function() {
		var req = {
			job : 'follow',
			reciever : Data.username
		}

		connect(req);

		btn = generate_bad_btn(btn,Data);
	}

	//hover_rev_func(btn);
	return btn;
}

generate_bad_btn = (btn,Data) => {
	btn.textContent = 'unfollow';
	btn.style.width = '40%';
	btn.style.backgroundColor = '#ff0000';
	btn.style.color = '#eeeeee';
	btn.onclick = function() {
		var req = {
			job : 'unfollow',
			reciever : Data.username
		}
		connect(req);

		btn = generate_gud_btn(btn,Data);
	}

	//hover_rev_func(btn)
}
create_room = () => {
	var group_list = [];
	var modal = document.getElementById('m');
	modal.style.display = 'block';
	// When the user clicks on <span> (x), close the modal
	document.getElementById('close').onclick = function() {
		modal.style.display = "none";
		document.getElementById('content').innerHTML = '';
		modal.innerHTML = '<div class="modal-content" id="content"><span class="close" id="close">&times;</span></div>';
	}


	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
			document.getElementById('content').innerHTML = '';
			modal.innerHTML = '<div class="modal-content" id="content"><span class="close" id="close">&times;</span></div>';
		}
	}

	var content = document.getElementById('content');
	var close_btn = document.getElementById('close');
	var h1 = document.createElement('p');
	var name = document.createElement('input');

	content.style.backgroundColor = '#ffffff';
	content.style.padding = '1vw';

	name.placeholder = 'group name';
	name.type = 'text';
	name.id = 'name';


	h1.innerHTML = '<h1>Make your Group</h1><br>';

	document.getElementById('content').appendChild(h1);
	document.getElementById('content').appendChild(name);

	var t_div = document.createElement('div');
	t_div.style.overflow = 'auto';
	t_div.style.maxHeight = '25vw';
	t_div.id = 't_div';

	for (var i = 0; i <user_data.followers.length; i++) {
		btn = document.createElement('button');
		btn.textContent = user_data.followers[i];
		btn.onclick = function() {
			if (this.style.color != 'rgb(0, 221, 0)') {
				this.style.color = '#00dd00';
				this.style.borderLeftColor = '#00dd66';
				group_list.push(this.textContent);
			} else {
				this.style.color = '#000000';
				this.style.borderColor = 'transparent';
				var i = group_list.indexOf(this.textContent);
				if (i>-1){
					group_list.splice(i);
				}
			}
		}

		t_div.appendChild(btn);
	}
	content.appendChild(t_div)

	btn = document.createElement('button');
	btn.textContent = 'form group';
	btn.style.width = '40%';
	btn.style.color = 'white';
	btn.style.backgroundColor = '#0077ff';
	btn.style.float = 'right';
	btn.onclick = function() {
		if (document.getElementById('name').value != '' && group_list.length != 0){
			var req = {
				data    : group_list,
				owner   : user_data.username,
				request : 'gen_room',
				name    : document.getElementById('name').value
			}
			this.textContent = '...';
			this.style.textAlign = 'center';
			gen_room(JSON.stringify(req));
			document.getElementById('close').click();
			rightnav.innerHTML = '';
			get_rooms();
		} else if (document.getElementById('name').value == ''){
			document.getElementById('name').borderBottomColor = '#ff0000';
			alert('no name provided\nhow will you identify the group !');
		} else {
			alert('you have chosen no one');
		}
	}
	content.appendChild(btn);

	close_btn.style.margin = '0vw';
}

gen_room = args => {
	var done = false;
	var socket = new WebSocket('ws://localhost:'+PORT);

	socket.onopen = async function () {
		socket.send(args);
		console.log('sent');
		rooms.push(args.name)
	}

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline")
	};

}


hover_rev_func = btn => {
	btn.onmouseenter = function() {
		col = btn.style.color;
		btn.style.color = btn.style.backgroundColor;
		btn.style.backgroundColor = col;
	}

	btn.onmouseleave = function() {
		col = btn.style.color;
		btn.style.color = btn.style.backgroundColor;
		btn.style.backgroundColor = col;
	}
}

function getSGNUPInput(action) {
	var name = document.getElementById("name").value;
	var username = document.getElementById("u_name").value;
	var passwd = document.getElementById("passwd").value;
	var re_passwd = document.getElementById("re_passwd").value;

	passable = checkSIGN_UPData(name,username,passwd,re_passwd);


	if (passable) {
		order = {
			request   : action,
			job       : 'register',
			json_able : {
				request   : action,
				username : username,
				password : passwd,
				name : name
			}
		}
		connect(order);
	}
}


function checkSIGN_UPData (n,un,passwd,repasswd) {
	var ret = true
	if (n == "") {
		document.getElementById("name").style.borderBottomColor = "red";
		ret = false;
	} else {
		document.getElementById("name").style.borderBottomColor = "#c5c6c7";
	}
	if (un == "") {
		document.getElementById("u_name").style.borderBottomColor = "red";
		ret =  false;
	} else {
		document.getElementById("u_name").style.borderBottomColor = "#c5c6c7";
	}

	if (un.includes(" ")) {
		document.getElementById("u_name").style.borderBottomColor = "red";
		ret =  false;
		alert('usernames cannot have spaces\nuse snakecase or camelcase');
	} else {
		document.getElementById("u_name").style.borderBottomColor = "#c5c6c7";
	}

	if (passwd == "") {
		document.getElementById("passwd").style.borderBottomColor = "red";
		ret =  false;
	} else {
		document.getElementById("passwd").style.borderBottomColor = "#c5c6c7";
	}
	if (repasswd == "") {
		document.getElementById("re_passwd").style.borderBottomColor = "red";
		ret =  false;
	} else {
		document.getElementById("re_passwd").style.borderBottomColor = "#c5c6c7";
	}

	if (passwd != repasswd) {
		document.getElementById("re_passwd").style.borderBottomColor = "red";
		document.getElementById("passwd").style.borderBottomColor = "red";
		alert("The passwords do not match");
		ret =  false;
	} else {
		document.getElementById("re_passwd").style.borderBottomColor = "#c5c6c7";
		document.getElementById("passwd").style.borderBottomColor = "#c5c6c7";
	}
	if (passwd.length < 8) {
		document.getElementById("passwd").style.borderBottomColor = "red";
		alert("The password is too short (min 8 characters)")
		ret = false;
	}

	return ret;
}
function getInput () {
	var username = document.getElementById("u_name").value;
	var passwd = document.getElementById("passwd").value;

	passable = checkLOG_INData(username,passwd);

	if (passable) {
		order = {
			request   : 'login',
			job       : 'register',
			json_able : {
				request  : 'login',
				username : username,
				password : passwd,
			}
		}

		connect(order);
	}	
}

checkLOG_INData = (u_name,passwd) => {
	ret = true;
	if (u_name == "") {
		document.getElementById("u_name").style.borderBottomColor = "red";
		ret =  false;
	} else {
		document.getElementById("u_name").style.borderBottomColor = "#c5c6c7";
	}

	if (passwd.length < 8) {
		document.getElementById("passwd").style.borderBottomColor = "red";
		alert("The password can not exist")
		ret = false;
	}
	return ret;
}

loadChat = () => {
	base = document.getElementById("rightnav");
	//request()
} 

setButtonListener = (obj) => {
	obj.style.color = 'white';
	var front = obj.style.color;
	var back = obj.style.background;


	obj.onmouseenter = function() {
		obj.style.color = back;
		obj.style.background = ""+front;
	}

	obj.onmouseleave = function() {
		obj.style.color = front;
		obj.style.background = back;
	}

	obj.onclick = function() {
		t = back;
		back = front;
		front = t;
	}
}

setOnClick = obj => {
	obj.onclick = function function_name(argument) {
		obj.style.borderBottomColor = 'black';
	}
}

render_share_pane = () => {
	var div = document.createElement('div');
	div.className = 'post';
	var done_btn = document.createElement('button');
	var file_btn = document.createElement('input');
	
	file_btn.type = 'file';
	file_btn.accept = 'image/*, .txt';
	file_btn.id = 'file_btn';
	div.style.backgroundColor = 'white';
	var sendable_data;

	file_btn.onchange = function() {
		var file = document.getElementById('file_btn').files[0];
		var reader = new FileReader();
		reader.onloadend = function() {
			sendable_data = reader.result;

			var modal = document.getElementById('m');
			var obj = document.createElement('img');
			var para = document.createElement('p');
			var cont = document.createElement('div');
			var dash = document.createElement('div');

			cont.className = 'content';
			para.innerHTML = '<h5>'+user_data.username+'</h5><br><b>'+user_data.name+'</b>';

			modal.style.display = 'block';
			// When the user clicks on <span> (x), close the modal
			document.getElementById('close').onclick = function() {
				modal.style.display = "none";
				cont.remove();
				document.getElementById('content').innerHTML = '';
				modal.innerHTML = '<div class="modal-content" id="content"><span class="close" id="close">&times;</span></div>';
			}

			// When the user clicks anywhere outside of the modal, close it
			window.onclick = function(event) {
				if (event.target == modal) {
					modal.style.display = "none";
					cont.remove();
					document.getElementById('content').innerHTML = '';
					modal.innerHTML = '<div class="modal-content" id="content"><span class="close" id="close">&times;</span></div>';
				}
			}

			var caption = document.createElement('textarea');
			var done_btn = document.createElement('btn');

			caption.setAttribute('style', 'height:' + (caption.scrollHeight) + 'px;overflow-y:hidden;');
			caption.addEventListener("input", OnInput, false);

			function OnInput() {
			  this.style.height = 'auto';
			  this.style.height = (this.scrollHeight) + 'px';
			}
			caption.style.height = '1vw';

			caption.type = 'text';
			caption.style.width = '80%';
			caption.style.wordWrap = 'break-word'
			caption.placeholder = 'caption ? you can use html too'
			caption.style.borderColor = 'transparent';
			caption.style.borderRadius = '0vw';
			caption.style.borderBottomColor = '#000000';
			caption.style.margin = '1vw 1vw 3vw 1vw';

			generate_gud_btn(done_btn);
			done_btn.style.backgroundColor = '#22ff55'
			done_btn.textContent = 'Done !';
			done_btn.style.padding = '1vw 40% 1vw 40%';
			done_btn.onclick = function () {
				console.log(caption.value);

				var data = {
					request  : 'post',
					caption  : caption.value,
					photo    : sendable_data,
					username : user_data.username
				};

				transfer_data(JSON.stringify(data));
			}

			obj.style.margin = '5%';
			obj.src = sendable_data;
			obj.align= 'left';

			obj.style.maxWidth = '60%';
			obj.style.marginLeft = '10%';
			obj.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.3), 0 6px 20px 0 rgba(0, 0, 0, 0.3)'

			cont.appendChild(para);
			cont.appendChild(dash);
			cont.appendChild(caption);
			cont.appendChild(done_btn);

			document.getElementById('content').appendChild(obj);
			document.getElementById('content').appendChild(cont);
		}

		reader.readAsDataURL(file);
	}
	div.appendChild(file_btn);
	document.getElementById('canvas').appendChild(div);

	dom_elems.push(div);
}

transfer_data = data => {
	var socket = new WebSocket('ws://localhost:'+PORT);

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline")
	};

	socket.onmessage = async function(event) {}

	socket.onopen = async function () {
		socket.send(data);
	}
}

renderHome = () => {
	var u_name,cap_tion,image,imagePresent;

	var image_rqst = {
		job    :'feed',
		request:'feed'
	}

	connect(image_rqst);

	for (var i = 0; i < 10; i++) {
		const canvas = document.getElementById('canvas');

		var post = document.createElement('div');
		var image = document.createElement('img');
		
		var prof = document.createElement('div');
		var pic = document.createElement('img');
		var username = document.createElement('p');
		
		var foot = document.createElement('div');
		var caption = document.createElement('p');

		var lButton = document.createElement('button');
		var mButton = document.createElement('button');
		var nButton = document.createElement('button');

		var text = document.createElement('input');
		var sendButton = document.createElement('button');

		post.className = "post";

		prof.className = 'profile'

		pic.src = "test.jpeg";//"DEFAULTS/DEF_PROFILE.jpeg";
		pic.style.verticalAlign ='middle';
		pic.style.borderRadius = "50%";
		pic.style.borderRadius = '50%';


		username.style.padding = '0vw 0vw 0vw 1vw';
		username.innerHTML = "<b>Username</b> shared a post<br>";

		foot.className = 'extension';
		caption.style.padding = '1vw';
		caption.style.paddingLeft = '2vw';
		caption.innerHTML = '<b>'+u_name+'</b> says ..<br>'+cap_tion+'';
		//"caption";

		image.src = 'test.jpeg';//"DEFAULTS/nyan.gif";
		image.style.marginBottom = '0vw';

		lButton.textContent = "Lovely !";
		lButton.style.background = '#f50237';
		setButtonListener(lButton);

		nButton.textContent = "Nice";
		nButton.style.background = '#74db07';
		setButtonListener(nButton);

		mButton.textContent = "Meh..";
		mButton.style.background= 'gray';
		setButtonListener(mButton);

		text.setAttribute('type','text');
		text.placeholder = "comment over here [press enter to actually comment]";
		setOnClick(text);

		sendButton.textContent = "->";
		sendButton.style.background = "#00aadd";
		sendButton.style.color = "white";
		setButtonListener(sendButton);

		foot.appendChild(caption);

		post.appendChild(username);
		post.appendChild(image);
		post.appendChild(foot);
		post.appendChild(lButton);
		post.appendChild(nButton);
		post.appendChild(mButton);
		post.appendChild(text);
		post.appendChild(sendButton);

		dom_elems.push(post,btn);
		canvas.appendChild(post);
	}
}

I_exist = exist => {
	var socket = new WebSocket('ws://localhost:'+PORT);

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline")
	};

	socket.onopen = async function () {
		var d = {
			username : user_data.username,
			leaving  : !exist
		}
		socket.send(JSON.stringify(d));
	}
}

submitQuery = obj => {
	if (obj.value == '') {
		for (var i = 0; i < prevData.length; i++) {
			prevData[i].remove();
		}
		get_rooms()
	}
	text = obj.value;

	var query = {
		job   : 'search',
		query : obj.value
	};
			
	connect(query);

}

	
loadDOM = (args) => {
	document.getElementById('canvas').innerHTML = '';

	switch(args) {
	case 'home':

	case 'rooms':
		renderMessages();
		break;

	case 'share':
		render_share_pane();
		break;

	case 'events':
		render_events();
		break;
	}
}

renderProfile = (name) => {
	document.getElementById('body').style.background = 'none';
	document.getElementById('canvas').innerHTML = '';

	var request;
	if (name != null){
		request = {
			job   : 'get_profile_data',
			user  :  name
		}
	} else {
		request = {
			job   : 'get_profile_data',
			user    : user
		}
	}

	connect(request);
}

render_chat = chat_name => {
	var pure_room = null
	var text_data = null

	var req = {
		request : 'GET_M',
		user    : user_data.username,
		room    : chat_name
	}

	var socket = new WebSocket('ws://localhost:'+PORT);

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline")
	};

	socket.onmessage = async function(event) {
		obj = JSON.parse(event.data);
		pure_room = obj.room;
		text_data = obj.msg_data;
		socket.close()
		GET_MSGS(pure_room,text_data);
	}

	socket.onopen = async function () {
		socket.send(JSON.stringify(req));
	}
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

sendMessage = (socket,msg,room) => {
	console.log(msg)

}

GET_MSGS = (room,msgs) => {
	loadDOM('');
	var color_obj = {}
	room = JSON.parse(room);
	var container;
	var canvas = document.getElementById('canvas');
	var inner_canvas = document.createElement('div');
	var text_input = document.createElement('input');

	console.log(msgs)
	var color_obj = {}
	
	inner_canvas.id = 'inner_canvas';
	inner_canvas.className = 'msg_pane';
	inner_canvas.style.maxHeight = '50vw';
	canvas.appendChild(inner_canvas)

	var socket = new WebSocket('ws://localhost:'+PORT);

	if (msgs.length != 0) {
		for (var i = 0; i < msgs.length; i++) {
			var key = Object.keys(msgs[i])[0]
			var this_msg = msgs[i][Object.keys(msgs[i])[0]];
			console.log(this_msg)
			inner_canvas = document.getElementById('inner_canvas');
			msg = document.createElement('div');
			msg.className = 'msg';
			msg.innerHTML = this_msg;
			if (key != user_data.username) {
				msg.style.float = 'left';
				msg.style.borderColor = 'transparent';
				//msg.style.borderRadius = '3vw 3vw 3vw 0vw';
				msg.style.marginRight = '40%';
				if (Object.keys(color_obj).indexOf(key)==-1){
					msg.style.borderBottomColor = getRandomColor();
					color_obj[key] = msg.style.borderBottomColor;
				} else {
					msg.style.borderBottomColor = color_obj[key];
				}
			} else {
				msg.style.float = 'right';
				//msg.style.borderRadius = '3vw 3vw 0vw 3vw';
				msg.style.marginLeft = '40%';
				if (Object.keys(color_obj).indexOf(key)==-1){
					msg.style.borderBottomColor = getRandomColor();
					//msg.style.borderColor = getRandomColor();
					color_obj[key] = msg.style.borderBottomColor;
				} else {
					msg.style.borderBottomColor = color_obj[key];
				}
			}

			inner_canvas.appendChild(msg)
		}
	} else {
		inner_canvas.innerHTML = ''
	}

	if (!window.WebSocket) {
		alert("Your browser does not support web sockets");
	}

	socket.onerror = function(error) {
		alert("Connection error either the server or you are offline");
	};

	socket.onmessage = async function(event) {
		msg_inner_html = JSON.parse(event.data)

		var key = msg_inner_html.split('</b>')[0]
		key = key.substring(3)
		console.log('substring:'+key)
		
		inner_canvas = document.getElementById('inner_canvas');
		msg = document.createElement('div');
		msg.className = 'msg';
		msg.innerHTML = msg_inner_html;
		msg.style.float = 'left';
		//msg.style.borderRadius = '3vw 3vw 0vw 3vw';
		msg.style.marginRight = '40%';
		if (Object.keys(color_obj).indexOf(key)== -1){
			msg.style.borderBottomColor = getRandomColor();
			//msg.style.borderColor = getRandomColor();
			color_obj[key] = msg.style.borderBottomColor;
		} else {
			msg.style.borderBottomColor = color_obj[key];
		}
		window.scrollTo(0,document.body.scrollHeight);
		inner_canvas.scrollTo(0,inner_canvas.scrollHeight);
		inner_canvas.appendChild(msg)
	}

	socket.onopen = async function () {
		socket.send(JSON.stringify({
			request : 'msg',
			me      :  user_data.username,
			room    : room['id']

		}))
		text_input.placeholder = 'type something ...';
		text_input.type = 'text';
		document.getElementById('inner_canvas').socket = socket;

		inner_canvas.onunload = function() {
			alert('unload')
			this.socket.close()
		}

		text_input.addEventListener('keypress', function (e) {
		if (e.key === 'Enter') {
			if (this.value.length != 0){
				this.value = this.value.replace('\n','<br>')
				inner_canvas = document.getElementById('inner_canvas');
				msg = document.createElement('div');
				msg.className = 'msg';
				msg.innerHTML = '<b>'+user_data.username+'</b><br>'+this.value;
				msg.style.float = 'right'
				//msg.style.borderRadius = '3vw 3vw 0vw 3vw';
				if (Object.keys(color_obj).indexOf(user_data.username)==-1){
					msg.style.borderBottomColor = getRandomColor();
					//msg.style.borderColor = getRandomColor();
					color_obj[key] = msg.style.borderColor;
				} else {
					msg.style.borderBottomColor = color_obj[key];
				}

				msg.style.marginLeft = '40%';

				inner_canvas.appendChild(msg);

				send_msg = document.createElement('div');
				send_msg.className = 'msg';
				send_msg.style.borderRadius = '0px';
				send_msg.innerHTML = '<b>'+user_data.username+'</b><br>'+this.value;
				var data = {
					msg     :  send_msg.innerHTML
				}
				console.log(data)
				socket.send(JSON.stringify(data))

				window.scrollTo(0,document.body.scrollHeight);
				inner_canvas.scrollTo(0,inner_canvas.scrollHeight);

				this.value = '';
			}
		}

		});

		window.scrollTo(0,document.body.scrollHeight);
		inner_canvas.scrollTo(0,inner_canvas.scrollHeight);
		
		canvas.appendChild(text_input)
		text_input.focus();
	}

	socket.onclose = function() {
	}
}




render_events = () => {}

/**

true_render_msgs = (room,msgs) => {
	//GET_MSGS(room,msgs)
	loadDOM('');
	room = JSON.parse(room);
	var container;
	var canvas = document.getElementById('canvas');
	var inner_canvas = document.createElement('div');
	var text_input = document.createElement('input');

	console.log(msgs)
	var color_obj = {}
	
	inner_canvas.id = 'inner_canvas';
	inner_canvas.className = 'msg_pane';
	inner_canvas.style.maxHeight = '50vw';
	canvas.appendChild(inner_canvas)

	if (msgs.length != 0) {
		for (var i = 0; i < msgs.length; i++) {
			var key = Object.keys(msgs[i])[0]
			var this_msg = msgs[i][Object.keys(msgs[i])[0]];
			console.log(this_msg)
			inner_canvas = document.getElementById('inner_canvas');
			msg = document.createElement('div');
			msg.className = 'msg';
			msg.innerHTML = this_msg;
			if (key != user_data.username) {
				msg.style.float = 'left';
				msg.style.borderColor = 'transparent';
				//msg.style.borderRadius = '3vw 3vw 3vw 0vw';
				msg.style.marginRight = '40%';
				if (Object.keys(color_obj).indexOf(key)==-1){
					msg.style.borderBottomColor = getRandomColor();
					color_obj[key] = msg.style.borderBottomColor;
				} else {
					msg.style.borderBottomColor = color_obj[key];
				}
			} else {
				msg.style.float = 'right';
				//msg.style.borderRadius = '3vw 3vw 0vw 3vw';
				msg.style.marginLeft = '40%';
				if (Object.keys(color_obj).indexOf(key)==-1){
					msg.style.borderBottomColor = getRandomColor();
					//msg.style.borderColor = getRandomColor();
					color_obj[key] = msg.style.borderBottomColor;
				} else {
					msg.style.borderBottomColor = color_obj[key];
				}
			}

			inner_canvas.appendChild(msg)
		}
	} else {
		inner_canvas.innerHTML = ''
	}

	text_input.placeholder = 'type something ...';
	text_input.type = 'text';
	text_input.addEventListener('keypress', function (e) {
	
	if (e.key === 'Enter') {
		this.value = this.value.replace('\n','<br>')
		inner_canvas = document.getElementById('inner_canvas');
		msg = document.createElement('div');
		msg.className = 'msg';
		msg.innerHTML = '<b>'+user_data.username+'</b><br>'+this.value;
		msg.style.float = 'right'
		//msg.style.borderRadius = '3vw 3vw 0vw 3vw';
		if (Object.keys(color_obj).indexOf(user_data.username)==-1){
			msg.style.borderBottomColor = getRandomColor();
			//msg.style.borderColor = getRandomColor();
			color_obj[key] = msg.style.borderColor;
		} else {
			msg.style.borderBottomColor = color_obj[key];
		}

		msg.style.marginLeft = '40%';

		inner_canvas.appendChild(msg);

		send_msg = document.createElement('div');
		send_msg.className = 'msg';
		send_msg.style.borderRadius = '0px';
		send_msg.innerHTML = '<b>'+user_data.username+'</b><br>'+this.value;
		sendMessage(send_msg,room);

		window.scrollTo(0,document.body.scrollHeight);
		inner_canvas.scrollTo(0,inner_canvas.scrollHeight);

		this.value = '';
	}
	});

	window.scrollTo(0,document.body.scrollHeight);
	inner_canvas.scrollTo(0,inner_canvas.scrollHeight);
	
	canvas.appendChild(text_input)
	text_input.focus();

}
*/