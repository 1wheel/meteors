import urllib
import json
import os

def getImage(name, url):
	splitStr = "http://www.lpi.usra.edu/meteor/get_original_photo.php?recno="
	try:
		recordNum = urllib.urlopen(url).read().split(splitStr)[1].split('"')[0]
		imgURL = urllib.urlopen(splitStr+recordNum).read().split('img src="')[2].split('"')[0]
		urllib.urlretrieve(imgURL, 'metors/' + name + ".jpg")

	except Exception, e:
		print "No image for " + name


with open('metors.json') as data_file:    
    metors = json.load(data_file)

downloaded = os.listdir('metors/')

for metor in metors:
	if not metor['name'] +'.jpg' in downloaded:
		getImage(metor['name'], metor['database'])
		print metor['name']


with open('pics.json', 'w') as outfile:
  json.dump(os.listdir('metors/'), outfile)
