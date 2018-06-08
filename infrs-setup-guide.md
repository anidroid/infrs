## Ensure: Server running Kinto

#### 1. Register for Heroku and install it

heroku.com

`$ pip/conda/... install heroku`

#### 2. Create a new Heroku app

https://github.com/Kinto/kinto-heroku

```
$ git clone http://github.com/Kinto/kinto-heroku.git myappname && cd myappname
$ heroku apps:create myappname
$ heroku addons:create heroku-postgresql --app myappname
$ git remote set-url heroku git@heroku.com:myappname.git
$ git push heroku master
$ heroku open
```

#### 3. Edit configuration

In the kinto.ini file define master user and pass:

```[server:main]
use = myadmin:mypass#main
host = 0.0.0.0
port = 8888
[app:main]
use = myadmin:mypass
...
```

```
$ git commit -am "New setting"
```

#### 4. Deploy the app on Heroku

```
$ heroku login
$ heroku git:clone -a myappname
$ cd myappname
$ git push heroku master
```

#### OUTCOME: 

* kinto remote addr: e.g., https://kinto.dev.mozaws.net/v1

`{"project_name":"kinto","project_version":"8.3.0","http_api_version":"1.18","settings":...`

* username and password for kinto master user/admin

## Setup data collection on a kinto server

This is done via HTTP requests to the kinto server. The requests can be sent in any number of ways (requests in py, httr in R, etc). I am using R. To understand the concepts of buckets, collections, and records, see http://docs.kinto-storage.org/en/1.6.2/api/buckets.html

```R
library(httr)

POST('http://kintohrk.herokuapp.com/v1/buckets', c
     onfig=authenticate('myadmin', 'mypass'), 
     body = upload_file("C:/myfilepath/createcollection.json"))
# body needs to be a json file with the following content:
# {"data": {"id": "mybucket"}}
  
POST('http://kintohrk.herokuapp.com/v1/buckets/mybucket/collections',
     config=authenticate('myadmin', 'mypass'), 
     body = upload_file("C:/42/apps/kintohrk/createcollection.json"))
# body needs to be a json file with the following content:
# {"data": {"id": "mycollection"}, "permissions": {"record:create": ["system.Authenticated"]}}
```
Use the following command to delete records once the data is retrieved and stored locally. This action deletes the data permanently cannot be reversed.

```R
DELETE('http://kintohrk.herokuapp.com/v1/buckets/mybucket/collections/mycollection/records', config=authenticate('myadmin', 'mypass'))
```

## Store, retrieve, and delete data

In design.yaml, specify the Kinto server address, bucket, and collection.

```yaml
server:
  remote_adr: "http://myappname.herokuapp.com/v1/"
  bucket: "mybucket"
  collection: "mycollection"
```

Under the hood

```js
var remote_adr = design.server.remote_adr;
var bucket_name = design.server.bucket;
var collection_name = design.server.collection;
var pn = _.sample(_.range(1, 9999), 1).toString();
var pn_token = makeid(); // generate random string
var db = new KintoClient(remote_adr, {
          bucket: bucket_name,
          headers: {
              Authorization: "Basic " + btoa(pn + ":" + pn_token)
          }
      });
var kdat = db.bucket(bucket_name).collection(collection_name);
```

The current collection should be empty:

http://myapp.herokuapp.com/v1/buckets/mybucket/collections/mycollection/records

Do a test run. A new entry should appear in the collection:

http://myapp.herokuapp.com/v1/buckets/mybucket/collections/mycollection/records

Once data is collected, retrieve and store it using R.

```R
# file {getdata.R}

# Loading the required packages. Use install.package("package") if any is missing.
library(httr);library(jsonlite);library(rjson);library(dplyr);library(reshape2)

# GET the data from the server ----------------
a=GET("http://kintohrk.herokuapp.com/v1/buckets/apps/collections/infrs/records", 
      authenticate("khrkadmin", "khrkpass"))
rawdat=content(a)

# Back up the original data in json format
write(toJSON(rawdat), file="jsondata.JSON")
# To read in the original json file, use:
# rawdat <- rjson::fromJSON(file="jsondata.JSON")

# PARSE the json file to a data frame ---------
dat <- rawdat$data
data = data.frame()
for(k in seq (1:length(dat))) {
  datp = data.frame()
  for (i in seq(1:length(dat[[k]]$datp))){
    datp = plyr::rbind.fill(datp,cbind(id=dat[[k]]$id[i],fromJSON(dat[[k]]$datp[i])))}
  datt = data.frame()
  for (i in seq(1:length(dat[[k]]$datt))){
    datt = plyr::rbind.fill(datt,cbind(id=dat[[k]]$id[i],fromJSON(dat[[k]]$datt[i])))}
  colnames(datt) <- paste("T", colnames(datt), sep = "_")
  data = plyr::rbind.fill(data,merge(datp,datt,by.x="id",by.y="T_id"))}

# STORE the data ------------------------------
# 'mydata' can be any name
# saves the file in your working directory (getwd()). To save elsewhere, provide path in the filename, e.g., "C://files/mydata.csv"

# Store as R data frame (lists remain intact)
saveRDS(data, file="mydata.rds")
# To read back in:
# data <- readRDS("mydata.rds")

# Store as csv (transforming the list and vector values to strings)
data$T_CUES=as.character(data$T_CUES)
data$T_iiprobes=as.character(data$T_iiprobes)
write.csv(data,"mydata.csv")
```


## Changing the study design

Basic changes to the design can be made via the design.yml document. The design.yml can be hosted externally. To use a custom externally hosted document, simply provide the link to the document as a URL parameter: anidroid.github.io/infrs/?d=httpmyremoteaddress/design.yml#init