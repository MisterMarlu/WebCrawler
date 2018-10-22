try{ window.searchData = {"info":[["BaseModule#setLocalConfig","BaseModule","BaseModule.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",0],["Crawler.checkSaveTimer","Crawler","Crawler.html#checkSaveTimer","function","Check if it's time to save the collected data.",1],["Crawler#clearCacheDB","Crawler","Crawler.html#clearCacheDB","function","Clearing temporary saved data in the database.",2],["Crawler#collectLinks","Crawler","Crawler.html#collectLinks","(function $, boolean db)","Collect all (relative) links.",3],["Crawler#collectRelativeLinks","Crawler","Crawler.html#collectRelativeLinks","(string link, boolean db)","Split relative from shorted absolute links (e.g. \"/google.com\").",4],["Crawler#crawlViaDb","Crawler","Crawler.html#crawlViaDb","function","Check if url already visited. If not, visit this url. This is the database variant.",5],["Crawler#crawlViaObjects","Crawler","Crawler.html#crawlViaObjects","function","Check if url already visited. If not, visit this url. This is the object variant.",6],["Crawler#createLockFile","Crawler","Crawler.html#createLockFile","function","Creates lock file.",7],["Crawler#end","Crawler","Crawler.html#end","function","Write ending lines into the .log file and remove .lock file.",8],["Crawler#getReadableTime","Crawler","Crawler.html#getReadableTime","function","Stops execution timer and prints readable time.",9],["Crawler#hasLockFile","Crawler","Crawler.html#hasLockFile","function","Check if lock file exists.",10],["Crawler#increaseVisited","Crawler","Crawler.html#increaseVisited","(string url)","Increase visited pages counter.",11],["Crawler#isDefault","Crawler","Crawler.html#isDefault","(string command)","Check if this command is default.",12],["Crawler#removeLockFile","Crawler","Crawler.html#removeLockFile","function","Removes lock file.",13],["Crawler#setLocalConfig","Crawler","Crawler.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",14],["Crawler#start","Crawler","Crawler.html#start","(function stop)","Initiate the crawling process.",15],["Crawler#syncFoundUrls","Crawler","Crawler.html#syncFoundUrls","(number i)","Store all following urls into the database.",16],["Crawler#visitPage","Crawler","Crawler.html#visitPage","(string url, boolean db)","Visit the url and let the customer search for whatever he want.",17],["DB.selectType","DB","DB.html#selectType","(string type)","You must select a database type to get the database instance.",18],["DelayedSave.save","DelayedSave","DelayedSave.html#save","(Array.<object> objects, object type, string type.collection, string type.globalName, string type.index, number i)","The default saving process.",19],["DelayedSave#addType","DelayedSave","DelayedSave.html#addType","(string collection, string globalName, string index, function callback)","Add a type with necessary information so DelayedSave know how to save the data.",20],["DelayedSave#saveAll","DelayedSave","DelayedSave.html#saveAll","(number i)","Save all found objects where a type is given.",21],["Formatter.camelToDash","Formatter","Formatter.html#camelToDash","(string camel)","Convert camelCase to dash-case.",22],["Formatter.camelToUnderscore","Formatter","Formatter.html#camelToUnderscore","(string camel)","Convert camelCase to snake_case.",23],["Formatter.dashToCamel","Formatter","Formatter.html#dashToCamel","(string dash)","Convert dash-case to camelCase.",24],["Formatter.dashToUnderscore","Formatter","Formatter.html#dashToUnderscore","(string dash)","Convert dash-case to snake_case.",25],["Formatter.toUpperFirst","Formatter","Formatter.html#toUpperFirst","(string string)","Converts the first letter of a string to upper case.",26],["Formatter.underscoreToCamel","Formatter","Formatter.html#underscoreToCamel","(string underscore)","Convert snake_case to camelCase.",27],["Formatter.underscoreToDash","Formatter","Formatter.html#underscoreToDash","(string underscore)","Convert snake_case to dash-case.",28],["Formatter.underscoreToWhitespace","Formatter","Formatter.html#underscoreToWhitespace","(string underscore)","Convert underscore to whitespaces.",29],["Global#get","Global","Global.html#get","(string name)","Get any parameter.",30],["Global#set","Global","Global.html#set","(string name, * value)","Set any parameter.",31],["Helper.debugEnabled","Helper","Helper.html#debugEnabled","function","Check if debug mode is enabled.",32],["Helper.getCallback","Helper","Helper.html#getCallback","(string name)","Get a callback if exists.",33],["Helper.getSqlTimestamp","Helper","Helper.html#getSqlTimestamp","(Date date)","Get a current MySQL timestamp.",34],["Helper.hasCallback","Helper","Helper.html#hasCallback","(string name)","Check if a callback exists.",35],["Helper.isDebug","Helper","Helper.html#isDebug","(string moduleName)","Check if debug mode is enabled for the given module.",36],["Helper.printDebugLine","Helper","Helper.html#printDebugLine","(Output output, function method, string file, number line)","Prints the debugging line.",37],["Helper.twoDigits","Helper","Helper.html#twoDigits","(number number)","Convert a one digit number into a two digit number.",38],["MongoDB#delete","MongoDB","MongoDB.html#delete","(object filter, string collection, string operator)","Delete data.",39],["MongoDB#find","MongoDB","MongoDB.html#find","(object filter, string collection, object structure, string operator)","Get data from collection.",40],["MongoDB#findAll","MongoDB","MongoDB.html#findAll","(string collection)","Get all data from collection.",41],["MongoDB#findOne","MongoDB","MongoDB.html#findOne","(object filter, string collection, object structure, string operator)","Get one element from collection.",42],["MongoDB#insert","MongoDB","MongoDB.html#insert","(object insert, string collection)","Insert new data.",43],["MongoDB#save","MongoDB","MongoDB.html#save","(object filter, object object, string collection, string operator)","Insert data or update if already exists.",44],["MongoDB#setConnection","MongoDB","MongoDB.html#setConnection","(db db)","Set connection.",45],["MongoDB#setLocalConfig","MongoDB","MongoDB.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",46],["MongoDB#update","MongoDB","MongoDB.html#update","(object filter, object update, string collection, string operator)","Update data.",47],["MySQL.parseColumnValue","MySQL","MySQL.html#parseColumnValue","(object object, string operator)","Parse an object to an array in column value format.",48],["MySQL.parseStructure","MySQL","MySQL.html#parseStructure","(object structure, boolean structure[)","Parse the structure object to return specific columns.",49],["MySQL.parseValue","MySQL","MySQL.html#parseValue","(* value)","Parse the value to correct notation for the MySQL query.",50],["MySQL.parseValues","MySQL","MySQL.html#parseValues","(array values)","Parse all values to correct notation for the MySQL query.",51],["MySQL#delete","MySQL","MySQL.html#delete","(object filter, string table, string operator)","Delete data.",52],["MySQL#find","MySQL","MySQL.html#find","(object filter, string table, object structure, string operator)","Get data from table.",53],["MySQL#findAll","MySQL","MySQL.html#findAll","(string table)","Get all data from table.",54],["MySQL#findOne","MySQL","MySQL.html#findOne","(object filter, string table, object structure, string operator)","Get one element from table.",55],["MySQL#insert","MySQL","MySQL.html#insert","(object insert, string table)","Insert new data.",56],["MySQL#save","MySQL","MySQL.html#save","(object filter, object object, string table, string operator)","Insert data or update if already exists.",57],["MySQL#setConnection","MySQL","MySQL.html#setConnection","(connection connection)","Set connection.",58],["MySQL#setLocalConfig","MySQL","MySQL.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",59],["MySQL#update","MySQL","MySQL.html#update","(object filter, object update, string table, string operator)","Update data.",60],["Output.checkLogFile","Output","Output.html#checkLogFile","(string name, string path, boolean multiple)","Generate name and path of the log file.",61],["Output.getColor","Output","Output.html#getColor","(string type, string background=)","Get colored command line output.",62],["Output#initLogger","Output","Output.html#initLogger","(string name=)","Initiate the log file and open a write stream.",63],["Output#setLocalConfig","Output","Output.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",64],["Output#write","Output","Output.html#write","(string value, boolean toConsole, string type=, string background=)","Write output.",65],["Output#writeConsole","Output","Output.html#writeConsole","(string value, boolean toConsole, string type=, string background=)","Write in console only.",66],["Output#writeLine","Output","Output.html#writeLine","(string value, boolean toConsole, string type=, string background=)","Write output with a new line before.",67],["Output#writeOutput","Output","Output.html#writeOutput","(Array.<object> sentences, string sentences[].text, string sentences[].type=, string sentences[].background=, string type=)","Write array as strings with new line for each entry.",68],["Output#writeUserInput","Output","Output.html#writeUserInput","(Crawler crawler)","Write user input values.",69],["Output#writeWithSpace","Output","Output.html#writeWithSpace","(string value, boolean toConsole, string type=, string background=)","Write output with a trailing new line.",70],["Parser.getMethodName","Parser","Parser.html#getMethodName","(function method)","Get the name of the method that is called.",71],["Parser.getModuleName","Parser","Parser.html#getModuleName","(string path)","Get the name of the module from the absolute file path.",72],["Parser.parseInput","Parser","Parser.html#parseInput","(object input)","Converts the data of the input object into correct types.",73],["Parser.parseTime","Parser","Parser.html#parseTime","(number ms, boolean asArray)","Parse milliseconds to object or array with days, hours, minutes and seconds.",74],["ScreenShot#checkUrl","ScreenShot","ScreenShot.html#checkUrl","(string url, object website, string website.url, boolean website.has_error, string website.name, string website.found_url, number dimIndex, function callback)","Check if the url is accessible.",75],["ScreenShot#countUndone","ScreenShot","ScreenShot.html#countUndone","(Array.<object> websites, string websites[].url, boolean websites[].has_error, string websites[].name, string websites[].found_url)","Count the number of undone screenshots.",76],["ScreenShot#decreaseUndone","ScreenShot","ScreenShot.html#decreaseUndone","function","Decrease the number of undone screenshots.",77],["ScreenShot#doScreenshots","ScreenShot","ScreenShot.html#doScreenshots","(Array.<object> websites, string websites[].url, boolean websites[].has_error, string websites[].name, string websites[].found_url, function callback)","Create a screenshot for each website that does not has an error.",78],["ScreenShot#getScreenshotName","ScreenShot","ScreenShot.html#getScreenshotName","(string url, string pageName, number dimIndex)","Get the name for this screenshot.",79],["ScreenShot#iterateDimensions","ScreenShot","ScreenShot.html#iterateDimensions","(object website, string website.url, boolean website.has_error, string website.name, string website.found_url, Array.<object> websites, string websites[].url, boolean websites[].has_error, string websites[].name, string websites[].found_url, number i, function callback, number j)","Iterate through the dimensions to create screenshots asynchronously.",80],["ScreenShot#iterateWebsites","ScreenShot","ScreenShot.html#iterateWebsites","(Array.<object> websites, string websites[].url, boolean websites[].has_error, string websites[].name, string websites[].found_url, function callback, number i)","Iterate through the websites to create screenshots asynchronously.",81],["ScreenShot#screenshotting","ScreenShot","ScreenShot.html#screenshotting","(object website, string website.url, boolean website.has_error, string website.name, string website.found_url, number dimIndex, function callback)","Create a screenshot from a specific website.",82],["ScreenShot#setLocalConfig","ScreenShot","ScreenShot.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",83],["ScreenShot#stopChrome","ScreenShot","ScreenShot.html#stopChrome","function","Kill all Google Chrome processes.",84],["String#splice","String","String.html#splice","(number start, number delCount, string newSubStr)","The splice() method changes the content of a string by removing a range of\rcharacters and/or adding new characters.",85],["Wrapper.setInput","Wrapper","Wrapper.html#setInput","(object options, string options.startUrl, number options.pageLimit, number options.debug, string options.debugModule=, number options.screenShots)","Write the user input into the Global class.",86],["Wrapper.stopCrawling","Wrapper","Wrapper.html#stopCrawling","(string reason)","Stop the crawling process.",87],["Wrapper#addConfig","Wrapper","Wrapper.html#addConfig","(string pathToConfig, string name)","Add a custom configuration file. It must be a .json file.",88],["Wrapper#addDBModules","Wrapper","Wrapper.html#addDBModules","function","Selecting the database type and create instances of all internal modules that needs an instance of the database.",89],["Wrapper#addModule","Wrapper","Wrapper.html#addModule","(string pathToModule)","Add a custom module.",90],["Wrapper#crawl","Wrapper","Wrapper.html#crawl","(string logFileName=)","Prepare for the crawling process.",91],["Wrapper#databaseCheck","Wrapper","Wrapper.html#databaseCheck","function","Check if a database connection string is defined.",92],["Wrapper#performCustomModules","Wrapper","Wrapper.html#performCustomModules","function","Create instances of the added modules.",93],["Wrapper#performModuleConfig","Wrapper","Wrapper.html#performModuleConfig","function","Execute all configurations for all modules, also the added.",94],["Wrapper#performWrapperConfig","Wrapper","Wrapper.html#performWrapperConfig","function","Execute the configurations for the Wrapper so we know the type of the database that should be used.",95],["Wrapper#prepareForCrawling","Wrapper","Wrapper.html#prepareForCrawling","function","Prepare modules and configurations for the crawling process.",96],["Wrapper#saveStartingUrl","Wrapper","Wrapper.html#saveStartingUrl","(string url)","Save the starting url.",97],["Wrapper#searchForConfig","Wrapper","Wrapper.html#searchForConfig","function","Search for a default configuration file.",98],["Wrapper#setCallback","Wrapper","Wrapper.html#setCallback","(string name, function callback)","Set a callback. On some points of the core it calls some callbacks so you can hook into some\rfunctions with your modules.",99],["Wrapper#setConfig","Wrapper","Wrapper.html#setConfig","(string filePath, string name=)","Add a configuration file so the configs will be used.\rThe configuration file must be a .json file. Look at the local config.json to get the format.",100],["Wrapper#setLocalConfig","Wrapper","Wrapper.html#setLocalConfig","(object config)","Set all configuration parameters for this class.",101],["Wrapper#startCrawling","Wrapper","Wrapper.html#startCrawling","function","Start the crawling process.",102],["Wrapper#startWithMongo","Wrapper","Wrapper.html#startWithMongo","(string logFileName)","Start the crawling process with the MongoDB database.",103],["Wrapper#startWithMysql","Wrapper","Wrapper.html#startWithMysql","(string logFileName)","Start the crawling process with the MySQL database.",104],["BaseModule","","BaseModule.html","(object options=)","",105],["Crawler < BaseModule","","Crawler.html","class","",106],["DB","","DB.html","class","",107],["DelayedSave","","DelayedSave.html","class","",108],["Formatter","","Formatter.html","class","",109],["Global","","Global.html","class","",110],["Helper","","Helper.html","class","",111],["MongoDB < BaseModule","","MongoDB.html","class","",112],["MySQL < BaseModule","","MySQL.html","class","",113],["Output < BaseModule","","Output.html","class","",114],["Parser","","Parser.html","class","",115],["ScreenShot < BaseModule","","ScreenShot.html","class","",116],["Wrapper < BaseModule","","Wrapper.html","(string dir, object commands, string commands.startUrl, number commands.pageLimit, number commands.debug, string commands.debugModule=, number commands.screenShots)","",117]],"searchIndex":["basemodule#setlocalconfig","crawler.checksavetimer","crawler#clearcachedb","crawler#collectlinks","crawler#collectrelativelinks","crawler#crawlviadb","crawler#crawlviaobjects","crawler#createlockfile","crawler#end","crawler#getreadabletime","crawler#haslockfile","crawler#increasevisited","crawler#isdefault","crawler#removelockfile","crawler#setlocalconfig","crawler#start","crawler#syncfoundurls","crawler#visitpage","db.selecttype","delayedsave.save","delayedsave#addtype","delayedsave#saveall","formatter.cameltodash","formatter.cameltounderscore","formatter.dashtocamel","formatter.dashtounderscore","formatter.toupperfirst","formatter.underscoretocamel","formatter.underscoretodash","formatter.underscoretowhitespace","global#get","global#set","helper.debugenabled","helper.getcallback","helper.getsqltimestamp","helper.hascallback","helper.isdebug","helper.printdebugline","helper.twodigits","mongodb#delete","mongodb#find","mongodb#findall","mongodb#findone","mongodb#insert","mongodb#save","mongodb#setconnection","mongodb#setlocalconfig","mongodb#update","mysql.parsecolumnvalue","mysql.parsestructure","mysql.parsevalue","mysql.parsevalues","mysql#delete","mysql#find","mysql#findall","mysql#findone","mysql#insert","mysql#save","mysql#setconnection","mysql#setlocalconfig","mysql#update","output.checklogfile","output.getcolor","output#initlogger","output#setlocalconfig","output#write","output#writeconsole","output#writeline","output#writeoutput","output#writeuserinput","output#writewithspace","parser.getmethodname","parser.getmodulename","parser.parseinput","parser.parsetime","screenshot#checkurl","screenshot#countundone","screenshot#decreaseundone","screenshot#doscreenshots","screenshot#getscreenshotname","screenshot#iteratedimensions","screenshot#iteratewebsites","screenshot#screenshotting","screenshot#setlocalconfig","screenshot#stopchrome","string#splice","wrapper.setinput","wrapper.stopcrawling","wrapper#addconfig","wrapper#adddbmodules","wrapper#addmodule","wrapper#crawl","wrapper#databasecheck","wrapper#performcustommodules","wrapper#performmoduleconfig","wrapper#performwrapperconfig","wrapper#prepareforcrawling","wrapper#savestartingurl","wrapper#searchforconfig","wrapper#setcallback","wrapper#setconfig","wrapper#setlocalconfig","wrapper#startcrawling","wrapper#startwithmongo","wrapper#startwithmysql","basemodule","crawler","db","delayedsave","formatter","global","helper","mongodb","mysql","output","parser","screenshot","wrapper"],"longSearchIndex":["basemodule#setlocalconfig","crawler.checksavetimer","crawler#clearcachedb","crawler#collectlinks","crawler#collectrelativelinks","crawler#crawlviadb","crawler#crawlviaobjects","crawler#createlockfile","crawler#end","crawler#getreadabletime","crawler#haslockfile","crawler#increasevisited","crawler#isdefault","crawler#removelockfile","crawler#setlocalconfig","crawler#start","crawler#syncfoundurls","crawler#visitpage","db.selecttype","delayedsave.save","delayedsave#addtype","delayedsave#saveall","formatter.cameltodash","formatter.cameltounderscore","formatter.dashtocamel","formatter.dashtounderscore","formatter.toupperfirst","formatter.underscoretocamel","formatter.underscoretodash","formatter.underscoretowhitespace","global#get","global#set","helper.debugenabled","helper.getcallback","helper.getsqltimestamp","helper.hascallback","helper.isdebug","helper.printdebugline","helper.twodigits","mongodb#delete","mongodb#find","mongodb#findall","mongodb#findone","mongodb#insert","mongodb#save","mongodb#setconnection","mongodb#setlocalconfig","mongodb#update","mysql.parsecolumnvalue","mysql.parsestructure","mysql.parsevalue","mysql.parsevalues","mysql#delete","mysql#find","mysql#findall","mysql#findone","mysql#insert","mysql#save","mysql#setconnection","mysql#setlocalconfig","mysql#update","output.checklogfile","output.getcolor","output#initlogger","output#setlocalconfig","output#write","output#writeconsole","output#writeline","output#writeoutput","output#writeuserinput","output#writewithspace","parser.getmethodname","parser.getmodulename","parser.parseinput","parser.parsetime","screenshot#checkurl","screenshot#countundone","screenshot#decreaseundone","screenshot#doscreenshots","screenshot#getscreenshotname","screenshot#iteratedimensions","screenshot#iteratewebsites","screenshot#screenshotting","screenshot#setlocalconfig","screenshot#stopchrome","string#splice","wrapper.setinput","wrapper.stopcrawling","wrapper#addconfig","wrapper#adddbmodules","wrapper#addmodule","wrapper#crawl","wrapper#databasecheck","wrapper#performcustommodules","wrapper#performmoduleconfig","wrapper#performwrapperconfig","wrapper#prepareforcrawling","wrapper#savestartingurl","wrapper#searchforconfig","wrapper#setcallback","wrapper#setconfig","wrapper#setlocalconfig","wrapper#startcrawling","wrapper#startwithmongo","wrapper#startwithmysql","basemodule","crawler","db","delayedsave","formatter","global","helper","mongodb","mysql","output","parser","screenshot","wrapper"]};}catch(e){if(console && console.log){ console.log(e);}}