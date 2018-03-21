#! /usr/bin/env python

from flask import Flask, render_template, request
import detector
import time
import os
import subprocess
import pickle
import json

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 8 * 1024 * 1024 # 50 MB Limit

@app.route('/')
def looper():
  return render_template('loopify.html')

@app.route('/linkedView/')
def linkedView():
  return render_template('linkedView.html')

@app.route('/compilervis/')
def compilervis():
  return render_template('dynaCFG.html')

@app.route('/tracevis/')
def tracevis():
  return render_template('traceCFG.html')    

@app.route('/findLoops/', methods=['GET', 'POST'])
def findLoops():
	if request.method=='POST':
		data = request.data
	else:
		#Only for testing purpose
		# with open('opt.43.dot', 'r') as myfile:
		#     data = myfile.read()
		return
	# Write the data to a file
	fileName = str(time.time())
	with open(fileName, 'wb' ) as tempfile:
		tempfile.write(data)
	outStr = detector.main([fileName])
	#Delete the file
	os.remove(fileName)
	return outStr

@app.route('/getBackTaint/', methods=['GET', 'POST'])
def getBackTaint():

	########### Started Edit here
	# Read the json file
	analysisFile = json.load("analysis.json")
	bt_analysis = analysisFile["backtaint"]
	script_path = bt_analysis["scriptpath"]
	language = bt_analysis["language"]
	outfilename = bt_analysis["outfilename"]
	########### Ended Edit here


	if request.method=='POST':
		received = request.json
		# get the taint address
		address = received["address"]
		data = received["trace"]
	else:
		#Only for testing purpose
		address = "40063f"
		with open('listCalc.jascii', 'r') as myfile:
			data = myfile.read()


	#Write the data to a temp file
	fileName = str(time.time())
	with open(fileName, 'w') as tempfile:
		tempfile.write(data)

	# # p = subprocess.Popen(["./backTaint.rb", fileName, address], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	# p = subprocess.Popen(["ruby", "backTaint.rb", fileName, address], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	# output, error = p.communicate()
	# #Delete the temp file
	# os.remove(fileName)

	# if error:
	# 	raise Exception("Error " + str(error))

	########### Started Edit here
	p = subprocess.Popen([language, scriptpath, fileName, address], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	output, error = p.communicate()
	#Delete the temp file
	os.remove(fileName)

	if error:
		raise Exception("Error " + str(error))
	########### Ended Edit here

	return output

@app.route('/getUERs/', methods=['GET', 'POST'])
def getUERs():
	if request.method=='POST':
		received = request.json
		# get the dotfile
		data = received["dotfile"]
		analysisType = received["UERtype"]
	else:
		#Only for testing purpose
		analysisType = "allUERs"
		with open('uerDetector/listCalc.dot', 'r') as myfile:
			data = myfile.read()

	#Write the data to a temp file
	baseName = str(time.time())
	fileName = baseName + ".dot"
	with open(fileName, 'w') as tempfile:
		tempfile.write(data)

	p = subprocess.Popen(["uerDetector/analyze-loops.sh", fileName],  stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	output, error = p.communicate()
	#Delete the temp file
	os.remove(fileName)

	if error:
		raise Exception("Error " + str(error))
	
	outputFile = baseName + ".loopData"
	f = open(outputFile, "rb")

	loopDataDict = pickle.load(f)
	f.close()

	os.remove(outputFile)

	finalData = {}
	# For each new key encountered in the loopDataDict, create a new set
	# For existing keys, update the set with the contents of the new list
	# After all the keys are iterated over, convert the sets back to lists

	for key in loopDataDict:
		UERs = loopDataDict[key][analysisType]
		for innerkey in UERs:
			if (innerkey in finalData):
				finalData[innerkey].update(UERs[innerkey])
			else:
				finalData[innerkey] = set(UERs[innerkey])

	for key in finalData:
		finalData[key] = list(finalData[key])

	# for key in loopDataDict:
	# 	UERs = loopDataDict[key][analysisType]
	# 	for innerkey in UERs:
	# 		if (analysisType == 'allUERs'):
	# 			finalData[innerkey] = list(UERs[innerkey])
	# 		else:
	# 			finalData[innerkey] = UERs[innerkey]

	return json.dumps(finalData)






