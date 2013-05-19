import urllib
import json
import os
from PIL import Image

directory = 'metors/' 

def getImage(name, url):
	splitStr = "http://www.lpi.usra.edu/meteor/get_original_photo.php?recno="
	try:
		recordNum = urllib.urlopen(url).read().split(splitStr)[1].split('"')[0]
		imgURL = urllib.urlopen(splitStr+recordNum).read().split('img src="')[2].split('"')[0]
		urllib.urlretrieve(imgURL, directory + name + ".jpg")

	except Exception, e:
		print "No image for " + name

def parseImage(name):
	i = Image.open(directory + name)
	size = 200,200
	i.thumbnail(size, Image.ANTIALIAS)
	if i.mode != "RGB":
		i = i.convert("RGB")
	i.save("pics/" + name, "JPEG")

for name in os.listdir(directory):
	try:
		parseImage(name)
	except Exception, e:
		pass

with open('metors.json') as data_file:    
	metors = json.load(data_file)

downloaded = os.listdir('pics/')
for meteor in metors:
	if meteor['name'] + '.jpg' in downloaded:
		try:
			i = Image.open('pics/' + meteor['name'] + '.jpg')
			i.save('pictures/' + meteor['cartodb_id'] + ".jpg")
		except Exception, e:
			print meteor['name']

for metor in metors:
	if not metor['name'] +'.jpg' in downloaded:
		#getImage(metor['name'], metor['database'])
		#print metor['name']
		error = 'false'



with open('pics.json', 'w') as outfile:
  #json.dump(os.listdir(directory), outfile)
  dog = cast
