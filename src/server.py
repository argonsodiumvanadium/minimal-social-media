import asyncio
import websockets
import json
import os
import base64
from pathlib import Path
from PIL import Image
import base64
import copy

# const
DEF_IMG_LOC = 'DEFAULTS/DEF_PROFILE.jpg'
DEF_PROF_LOC = 'DEFAULTS/def_user.png'
ESSAY_LOC = 'essays'
USER_DIR = 'user_data'
FEED_FILE = 'feed.txt'
SRC_FILE = 'src.txt'
FRNDS_FILE = 'friends.txt'
POSTS_DIR = 'posts'
MESSAGE_DIR = 'messages'

SGN_UP = 'signup'
LOG_IN = 'login'
PST = 'post'
RQST_FEED = 'feed'
FIN = 'FIN'
SRCH = 'search'
GET = 'GET'
GET_FOLLWRS = 'GETF'
INNR_HTML_DIR = 'prof_page_html'
FLLW_PLUS = 'follow'
FLLW_MINUS = 'unfollow'
BSE_DTAT = 'base_data'
POST = 'post'
GEN_ROOM = 'gen_room';
ROOMS = 'GET_RD'
GET_MSG = 'GET_M'
MSG = 'msg'
DELIM = '\n'


users = {}
online_users = {}
rooms = []
msg_notif = {}
new_messages = {}

member_websocket = {}

class Search(object):

	def __init__(self):
		self.data = {}

	def add (self,user):
		fields = [user['username']] + list(user['name'].split(' '))
		for field in fields:
			part_set = set()
			step = 1

			for i in range(1,len(field)):
				j = 0
				while j<len(field):
					j = j+i
					part = field[j-i:j]
					part_set.add(part)

					
			for value in part_set:
				try:
					self.data[value].append(user)
				except KeyError as ex:
					self.data[value] = []
					self.data[value].append(user)
		
def recover_data():
	user_dir = os.path.join(USER_DIR)
	for dirs in os.listdir(user_dir):
		path = os.path.join(user_dir,dirs,'src.txt')
		data = open(path,'r').read()
		data = json.loads(data)
		users[data['username']] = data
	print(f'recovery done')

	for dirs in os.listdir(MESSAGE_DIR):
		file = open(MESSAGE_DIR+'/'+dirs+'/'+'src.txt','r')
		room = json.loads(file.read())
		for m in room['members']:
			room.update({m:None})
		rooms.append(room)


def update():
	print('saving users')
	for key in users.keys():
		user = users[key]
		user_dir = USER_DIR +'/'+user['username']

		path = os.path.join(user_dir)
		file = open(path+'/'+SRC_FILE,'w')
		file.write(json.dumps(user))

	print('user save done\nsaving messages')

	for elem in rooms:
		savable_room = copy.deepcopy(elem)
		del savable_room['sockets']
		i = savable_room['id']
		file = open(MESSAGE_DIR+'/'+str(i)+'/'+'src.txt','w')
		file.write(json.dumps(savable_room))
	print('messages saved')

def recover_search_engine (my_map):
	keys = my_map.keys()
	ret = Search()

	for key in keys:
		ret.add(my_map[key])

	print(f"search engine is recovered")
	return ret

def initialize_prerequsites(user):
	user_dir = USER_DIR +'/'+user['username']
	user.update({'feed':user_dir+'/'+FEED_FILE})
	user.update({'profile pic':DEF_PROF_LOC})
	user.update({'essays':user_dir+'/'+ESSAY_LOC})
	user.update({'followers':[]})
	user.update({'posts':USER_DIR+'/'+user['username']+'/'+POSTS_DIR})
	user.update({'backdrop':DEF_IMG_LOC})
	user.update({'bio':''})
	user.update({'status':''})
	user.update({'rooms':[]})
	user.update({'room_names':[]})
	user.update({'last_index_read':{}})
	user.update({'dm':''})
	user.update({'events':''})

	create_base_directory(user)

	return user

def create_base_directory(user):
	path = os.path.join(USER_DIR)
	os.mkdir(USER_DIR+"/"+user['username'])
	os.mkdir(user['posts'])
	os.mkdir(user['essays'])
	path = os.path.join(USER_DIR,user['username'])
	file = open(path+'/'+SRC_FILE,'a+')
	file = open(path+'/'+FEED_FILE,'a+')
	file = open(user['feed'],'a+')
	file = open(path+'/'+SRC_FILE,'w')
	file.write(json.dumps(user))
	search.add(user)

def get_posts_and_visual_data(user):
	path = user['posts']
	data = []
	essays = []
	print(len(os.listdir(path)))
	
	for dirs in os.listdir(path):
		post = {}
		for file in os.listdir(path+'/'+dirs):
			if file.startswith('image'):
				post.update({'src' : convert_image_to_string(path+'/'+dirs+'/'+file)})
			elif file.startswith('inner_data'):
				open_file = open(path+'/'+dirs+'/'+file,'r')
				json_data = open_file.read()
				print(json_data)
				post = { **post,**json.loads(json_data)}
		
		data.append(post)

	for file in os.listdir(user['essays']):
		open_file = open(file,'r')
		essays.append([open_file.read().split('\n'),])

	result = {
		'posts'       : data,
		'essays'      : essays,
		'backdrop'    : convert_image_to_string(user['backdrop']),
		'profile_pic' : convert_image_to_string(user['profile pic'])
	}

	return result


def sign_up (data):
	try:
		val = users[data['username']]
		return {'c':None,'s':False}

	except KeyError as e:
		user = data
		del user['request']
		users[user['username']] = user
		user = initialize_prerequsites(user)
		print(f"sign up done for {data['username']} or {data['name']}")
		
		return {'c':user,'s':True}


def log_in(data):
	try:
		user = users[data['username']]

		if user['password'] == data['password']:
			print(f"{user['username']} or {user['name']} logged in")
			return {'c':user,'s':True}
		
		else:
			return {'c':None,'s':False}

	except Exception as e:
		return {'c':None,'s':False}

def decipherAndLogin(data):
	print("new connection")

	if data["request"] == SGN_UP:  # sign up
		return sign_up(data)

	else:
		return log_in(data)


def convert_image_to_string(path):
	with open(path,'rb') as image:
		data = image.read()
		data = base64.b64encode(data)
		return (data).decode('utf-8')
	return None

def generate_sendable_data(user):
	# add friends to an array
	data = {
		'username' : user['username'],
		'name'     : user['name'],
		'bio'      : user['bio'],
		'events'   : user['events'],
		'status'   : user['status'],
		'friends'  : False,
		'followers': user['followers'],
		**get_posts_and_visual_data (user)
	}

	return data

def save_photo (data,loc):
	file_num = len(os.listdir(loc))
	loc = loc+'/'+str(file_num)
	os.mkdir(loc)
	parts = data.split(',')
	data = parts[1]
	imgdata = base64.b64decode(data)

	open_file = open(loc+'/image.png','a+')
	open_file = open(loc+'/image.png','wb')
	open_file.write(imgdata)
	open_file.close()
	return loc

@asyncio.coroutine
def handle_msgs (websocket,data):
	m_rooms = users[data['user']]['room_names']
	room = {}

	for itr in range(len(m_rooms)):
		print(f''+m_rooms[itr]+f' == {data}')
		if m_rooms[itr] == data['room']:
			room = rooms[users[data['user']]['rooms'][itr]]
			break

	user = users[data['user']]
	try:
		user['last_index_read'].update({room['id']:len(room['ll_text'])-1})
	except KeyError as ke:
		user.update({'last_index_read':{}})

	open_file = open(room['text'],'r')
	data = open_file.read()
	try:
		data = room['ll_text']
	except KeyError as e:
		room.update({'ll_text':[]})
	sendable_room = (room).copy()
	del sendable_room['sockets']
	send = {
		'room'     : json.dumps(sendable_room),
		'msg_data' : data
	}

	yield from websocket.send(json.dumps(send))
	yield from websocket.send('<b>username</b><br>has joined the chat')

@asyncio.coroutine
def start_serving(websocket, path):
	client = {}
	data = yield from websocket.recv()
	data = json.loads(data)
	try:
		print(f'and today i have been requested to {data["request"]}')

		if data['request'] == SGN_UP or data['request'] == LOG_IN :
			obj = decipherAndLogin(data)
			success = obj['s']
			c  = obj['c']
			if bool(success):
				online_users.update({c['username']:True})
				yield from websocket.send(c['username'])
			else:
				yield from websocket.send("ERR")
			yield from websocket.send(FIN)

		elif data['request'] == SRCH:
			try:
				data = search.data[data['query']]
				obj = {
					'result' : data
				}
				yield from websocket.send(json.dumps(obj))
				yield from websocket.send(FIN)

			except KeyError as ex:
				yield from websocket.send(FIN)

		elif data['request'] == GET:
			username = None
			username = data['user']
			user = users[username]
			sendable_data = generate_sendable_data(user)

			print(f"me : {data['me']},the person : {username}")
			for u_name in users[username]['followers']:
				if u_name == data['me']:
					sendable_data['friend'] = True
					break

			yield from websocket.send(json.dumps(sendable_data))
			yield from websocket.send(FIN)

		elif data['request'] == FLLW_PLUS:
			users[data['recv']]['followers'].append(data['send'])
			print(f"{users[data['recv']]['followers']} and me is {data['recv']}")
		
		elif data['request'] == FLLW_MINUS:
			# use a better searching method
			print(f"{data}")
			for i in range(len(users[data['recv']]['followers'])):
				if users[data['recv']]['followers'][i] == data['me']:
					del users[data['recv']]['followers'][i]
					break

		elif data['request'] == BSE_DTAT:
			print(f'in base dtat and what i got is {data}')
			user = users[data['name']]
			val = {
				"username" : user['username'],
				'name'     : user['name']
			}
			print(val)

			yield from websocket.send(json.dumps(val))
			print('sent')

		elif data['request'] == POST:
			user = users[data['username']]
			loc = save_photo(data['photo'],user['posts'])
			post_dict = {
				'lovely'  : 0,
				'nice'    : 0,
				'meh'     : 0,
				'comments': [],
				'caption' : data.pop('caption',None),
				'name'    : user['name'],
				'username': data['username']
			}
			open_file = open(loc+'/inner_data.txt','x')
			open_file = open(loc+'/inner_data.txt','w')
			open_file.write(json.dumps(post_dict))
			open_file.close();

		elif data['request'] == GEN_ROOM:
			n = len(rooms)

			room = {
				'name'    : data['name'],
				'members' : data['data']+[data['owner']],
				'owner'   : data['owner'],
				'id'      : n,
				'text'    : MESSAGE_DIR +'/'+str(n)+'/'+'text.txt',
				'src'     : MESSAGE_DIR +'/'+str(n)+'/'+'src.txt',
				'll_text' : [],
				'sockets' : {}
			}

			for memb in room['members']:
				users[memb]['rooms'].append(room['id'])
				users[memb]['room_names'].append(room['name'])
				room['sockets'].update({memb:{}})

			os.mkdir(MESSAGE_DIR+'/'+str(room['id']))

			open_file = open(room['src'],'a+')
			open_file.write(json.dumps(room))
			open_file = open(room['text'],'a+')

			rooms.append(room)
			yield from websocket.send(room['name'])
			print('sent')

		elif data['request'] == ROOMS:
			print(users[data['user']]['room_names'])
			yield from websocket.send(json.dumps(users[data['user']]['room_names']))

		elif data['request'] == GET_MSG:
			print('handle')
			yield from handle_msgs(websocket,data)

		elif data['request'] == MSG:
			user = users[data['me']]
			u_name = user['username']
			room = rooms[data['room']]
			r_id = room['id']

			print(room['members'])

			room['sockets'][u_name] = websocket;

			while True:
				data = yield from websocket.recv()
				data = json.loads(data)
				print(f'\n{data}\n')

				room['ll_text'].append({u_name:data['msg']})
				user['last_index_read'].update({r_id:len(room['ll_text'])-1})

				online_room_users = set(online_users) & set(room['members'])
				print(f'{online_room_users} and {online_users}')
				online_room_users.remove(u_name)
				
				for member in online_room_users:
					if member is not None:
						try:
							yield from room['sockets'][member].send(json.dumps(data['msg']))
						except Exception as e:
							member_websocket = None
		
		else:
			print('in else')
		

	except Exception as e:
		print('\n')
		raise(e)
		print('\n')
		if data['leaving']:
			_ = online_users.pop(data['username'])
		else:
			online_users.update({data['username']:True})


start_server = websockets.serve(start_serving, "localhost", 8080)

recover_data()
search = recover_search_engine(users)
print("session start")
try:
	asyncio.get_event_loop().run_until_complete(start_server)
	asyncio.get_event_loop().run_forever()
except:
	print('')
	print('updating users')
	update()
	print('updating done\nExiting')