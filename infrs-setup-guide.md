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
## Store, retrieve, and delete data

In design.yaml, specify the Kinto server address, bucket, and collection.

```yaml
server:
  remote_adr: "http://myappname.herokuapp.com/v1/"
  bucket: "mybucket"
  collection: "mycollection"
```

The current collection should be empty:

http://myapp.herokuapp.com/v1/buckets/mybucket/collections/mycollection/records

Do a test run. A new entry should appear in the collection:

http://myapp.herokuapp.com/v1/buckets/mybucket/collections/mycollection/records

Read in data in R:

....

## Under the hood

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