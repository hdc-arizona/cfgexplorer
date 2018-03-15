### Readme

* This software works best when used with latest version of Google Chrome.

* When loading new dataset, make sure the webpage is refreshed so that there is no data in memory from the previous dataset.

* When some source files such as .html, .css, .js files are changed, perform a hard reload to clear browser’s cache. This can be done in chrome by holding down Ctrl and clicking the Reload button. 

* In some occasion when assets such as .png, .jpg files etc. are changed, hard reload won’t work. Clear the browser’s cache explicitly and then reload the webpage. In chrome, this can be done by going to the “History” tab and go to “Clear Browsing Data” and choose “Cached images and files”.

* When running the webpage on localhost, the flask server needs to be restarted whenever new code is pulled from github. Press Ctrl+c to stop the server and "python3 -m flask run" to restart it. This is because flask server caches the html file while its running.

### Starting the flask server
export FLASK_APP=looper.py
python3 -m flask run

This runs the webapp on the following address:

localhost:5000/tracevis/
