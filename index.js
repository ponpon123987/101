const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const { Pool } = require("pg");

var request = require("request");


app = express();
app.use(bodyparser.json())
app.use(express.static(__dirname + "/"));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});



app.get("/check",(req,res)=>{
  res.sendFile("check.html",{root:__dirname})
});

app.post("/manifest",(req,res)=>{

    var example_manifest_code = `
---
applications:
- name: ${req.body.app_Name}
  memory: ${req.body.application_memory}M
  disk_quota: ${req.body.application_diskqouta}M
  buildpack: nodejs_buildpack
  command: node app.js
services:
- ${req.body.service_instance}`;
    
    res.send(example_manifest_code);
});

app.post("/manifestrm",(req,res)=>{

  var example_manifest_code = `
---
applications:
- name: ${req.body.app_Name}
  memory: ${req.body.application_memory}M
  disk_quota: ${req.body.application_diskqouta}M
  buildpack: nodejs_buildpack
  command: node app.js
services:
- ${req.body.service_instance}
- ${req.body.serviceInstanceMongoDB}`;
  
  res.send(example_manifest_code);
});

app.post("/deploy",(req,res)=>{

  var deploy_guide = `
  cf push ${req.body.appName}`;
  
  res.send(deploy_guide);
});

app.post("/dbCheck",(req,res)=>{
  const username = req.body.username;
  const password = req.body.password;
  const external = req.body.external;
  const port = req.body.port;
  const database = req.body.database;

  const dbUri = `mongodb://${username}:${password}@${external}:${port}/${database}`;
  const pool = new Pool({
    user: username,
    host: external,
    database: database,
    password: password,
    port: port
  })
  
  if(req.body.type=='mongodb'){
    mongoose.connect(dbUri, { useNewUrlParser: true })
      .then(() => res.send('success'))
      .catch(err => res.send(err))

      mongoose.connection.close();
  }else if(req.body.type=='postgres'){
    pool.connect()
      .then(() => res.send('success'))
      .catch(err => res.send(err))

      pool.end();
  }

});

app.post("/indexFile", (req, res) => {
  console.log(req.body)
  if (req.body.type === "rabbitmq") {
    
  var example_node_code = `
//Node Modules to install//
const express = require('express');
const mqtt = require('mqtt');

app = express();

app.use('/',(req,res)=>{
    res.send('hello world')
})

//Get the WISE-PaaS environment vcap_services config 
let vcap_services = JSON.parse(process.env.VCAP_SERVICES);

//Set up connection parameters to RabbitMQ
mqtt_servicename="${req.body.serviceName}"
mqtt_broker = "mqtt://"+ vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.host;
mqtt_username = vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.username.trim();
mqtt_password = vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.password.trim();
mqtt_port =vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.port;
    
mqtt_options=
{
    broker:mqtt_broker,
    reconnectPeriod: 1000,
    port: mqtt_port,
    username: mqtt_username,
    password: mqtt_password
};

mqtt_topic = "/${req.body.topic}/#";
mqtt_retain = true;

//Set up connection to RabbitMQ
var client = mqtt.connect(mqtt_broker,mqtt_options);

client.on("connect", function() {
    client.subscribe(mqtt_topic);
    console.log("[MQTT]:", "Connected.");
});
    
client.on("message", function(topic, message) {
    console.log("[" + topic + "]:" + message.toString());
});
    
client.on("error", function(err) {
    console.log(err);
});
    
client.on("close", function() {
    console.log("[MQTT]: close");
});
    
client.on("offline", function() {
    console.log("[MQTT]: offline");
});

const port = process.env.PORT || 3000
app.listen(port,()=>{
    console.log(\`listen port on process \${port} \`);
})`;
    res.send(example_node_code);
  } else {
    res.send("no type");
  }
});

app.post("/indexFilerm",(req,res)=>{
  // console.log(req.body)
 
  var example_node_code = `
//Node Modules to install//
//npm init -y
//npm install express mqtt mongoose --save

const express = require('express');
const mqtt = require('mqtt');
const mongoose = require("mongoose");

app = express();

app.use('/',(req,res)=>{
    res.send('hello world')
})

app.get("/query", (req, res) => {
  ${req.body.SchemaName}.find({}).then((err, data) => {
    if (err) res.send(err);
    else {
      res.json(data);
    }
  });
});

//Get the WISE-PaaS environment vcap_services config 
let vcap_services = JSON.parse(process.env.VCAP_SERVICES);

    
mongodb_service_name = "${req.body.serviceNameMongoDB}";

let replicaSetName =
  vcap_services[mongodb_service_name][0].credentials.replicaSetName;
let db =
  vcap_services[mongodb_service_name][0].credentials.uri +
    "?replicaSet=" +replicaSetName;

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("Connected to the MongoDB..."))
  .catch(err => console.log("Could not connect to MongoDB...", err));

//Schema;
const Schem = new mongoose.Schema(
{
  date: Date,
  topic: String,
  data: Number
},
  { versionKey: false }
);

const ${req.body.SchemaName} = mongoose.model("${req.body.SchemaName}" ,Schem);


//Set up connection parameters to RabbitMQ
mqtt_servicename="${req.body.serviceName}"
mqtt_broker = "mqtt://"+ vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.host;
mqtt_username = vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.username.trim();
mqtt_password = vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.password.trim();
mqtt_port =vcap_services[mqtt_servicename][0].credentials.protocols.mqtt.port;
    
mqtt_options=
{
    broker:mqtt_broker,
    reconnectPeriod: 1000,
    port: mqtt_port,
    username: mqtt_username,
    password: mqtt_password
};

mqtt_topic = "/${req.body.topic}/#";
mqtt_retain = true;

//Set up connection to RabbitMQ
var client = mqtt.connect(mqtt_broker,mqtt_options);

client.on("connect", function() {
  client.subscribe(mqtt_topic);
  console.log("[MQTT]:", "Connected.");
});
    
client.on("message", function(topic, message) {
  console.log("[" + topic + "]:" + message.toString());
    
  var d = new Date();
  var n = d.getTime();
  console.log("n", n);
  console.log("topic", topic);
  console.log("data", message.toString());
  const ${req.body.SchemaName} = new ${req.body.SchemaName}({
    date: n,
    topic: topic,
    data: message
  });
    
  ${req.body.SchemaName}.save();
});
    
client.on("error", function(err) {
  console.log(err);
});
    
client.on("close", function() {
  console.log("[MQTT]: close");
});
    
client.on("offline", function() {
  console.log("[MQTT]: offline");
});

const port = process.env.PORT || 3000
app.listen(port,()=>{
    console.log(\`listen port on process \${port} \`);
})`;
res.send(example_node_code);



});

app.post("/userId",(req,res)=>{
  var wiseuser = req.body.WISEuser
  var eitoken = req.body.EItoken
  

  var options = { method: 'GET',
    url: `https://portal-management.wise-paas.io/mp/v3/users/${wiseuser}/summary`,
    qs: { 
      check_valid: 'true' },
    headers: { 
    // Authorization: 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJ3aXNlcGFhc2lvIiwiaWF0IjoxNTY2NDM2NTkzLCJleHAiOjE1NjY0NDAxOTMsInVzZXJJZCI6ImYxNmQwYmFiLTAxNTctNGJmNS05Mzk0LTc1YzkzOTY3OGQ1MyIsInVhYUlkIjoiMmViYjEwM2QtOGVjNC00OGEwLWI0OWYtYTM0ZmNlOWU3YjA4IiwiY3JlYXRpb25UaW1lIjoxNTYzNzcyMDM1MDAwLCJsYXN0TW9kaWZpZWRUaW1lIjoxNTY1ODU5OTA3MDAwLCJ1c2VybmFtZSI6IkppbW15Llh1QGFkdmFudGVjaC5jb20udHciLCJmaXJzdE5hbWUiOiJKaW1teSIsImxhc3ROYW1lIjoiWHUiLCJjb3VudHJ5IjoiVFciLCJyb2xlIjoiZGV2ZWxvcGVyIiwiZ3JvdXBzIjpbIjIzYmE2NTlmLTJhYzUtNDJiNS1hMWRkLWU1NzljZGVjMzBmNiIsIlN0YW5sZXkuWWVoQGFkdmFudGVjaC5jb20udHciXSwiY2ZTY29wZXMiOlt7Imd1aWQiOiIyM2JhNjU5Zi0yYWM1LTQyYjUtYTFkZC1lNTc5Y2RlYzMwZjYiLCJzc29fcm9sZSI6ImRldmVsb3BlciIsInNwYWNlcyI6WyIwYWEwMzk5My1iMGM4LTRmYWItYTZkZC03YmU3ZTAwYzAwODAiLCI3ZTg4NDBjMy1hNWIwLTQ4NzItOTc3OC1iYTg1NWQ0ZmVhZjEiXX1dLCJzY29wZXMiOltdLCJzdGF0dXMiOiJhY3RpdmUiLCJvcmlnaW4iOiJTU08iLCJvdmVyUGFkZGluZyI6ZmFsc2UsInN5c3RlbSI6ZmFsc2UsInJlZnJlc2hUb2tlbiI6IjkxZGJjN2FjLWY1NDMtNDM5MC05MjZiLWRkNGQyNDNjZTdmNyJ9.FrxAx3GzOwwa7Ec0Np-VPBhDRJPJNodbmKTt7oAlhdGuQnBd6f9KAYNpq5emZJ3C_ZmMFw4-G5DWdJLd7anlBA'
      Authorization: 'Bearer ' + eitoken
    }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.send(body);
    console.log(body);
  });


})

app.post("/getSpace",(req,res)=>{
  var userid =  req.body.userid
  var wiseuser = req.body.WISEuser
  var eitoken = req.body.EItoken
  

  var options = { method: 'GET',
    url: `https://portal-management.wise-paas.io/mp/v3/users/${wiseuser}/summary`,
    qs: { 
    //  guid: '2ebb103d-8ec4-48a0-b49f-a34fce9e7b08',
      guid: userid,
      check_valid: 'true' },
    headers: { 
    // Authorization: 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJ3aXNlcGFhc2lvIiwiaWF0IjoxNTY2NDM2NTkzLCJleHAiOjE1NjY0NDAxOTMsInVzZXJJZCI6ImYxNmQwYmFiLTAxNTctNGJmNS05Mzk0LTc1YzkzOTY3OGQ1MyIsInVhYUlkIjoiMmViYjEwM2QtOGVjNC00OGEwLWI0OWYtYTM0ZmNlOWU3YjA4IiwiY3JlYXRpb25UaW1lIjoxNTYzNzcyMDM1MDAwLCJsYXN0TW9kaWZpZWRUaW1lIjoxNTY1ODU5OTA3MDAwLCJ1c2VybmFtZSI6IkppbW15Llh1QGFkdmFudGVjaC5jb20udHciLCJmaXJzdE5hbWUiOiJKaW1teSIsImxhc3ROYW1lIjoiWHUiLCJjb3VudHJ5IjoiVFciLCJyb2xlIjoiZGV2ZWxvcGVyIiwiZ3JvdXBzIjpbIjIzYmE2NTlmLTJhYzUtNDJiNS1hMWRkLWU1NzljZGVjMzBmNiIsIlN0YW5sZXkuWWVoQGFkdmFudGVjaC5jb20udHciXSwiY2ZTY29wZXMiOlt7Imd1aWQiOiIyM2JhNjU5Zi0yYWM1LTQyYjUtYTFkZC1lNTc5Y2RlYzMwZjYiLCJzc29fcm9sZSI6ImRldmVsb3BlciIsInNwYWNlcyI6WyIwYWEwMzk5My1iMGM4LTRmYWItYTZkZC03YmU3ZTAwYzAwODAiLCI3ZTg4NDBjMy1hNWIwLTQ4NzItOTc3OC1iYTg1NWQ0ZmVhZjEiXX1dLCJzY29wZXMiOltdLCJzdGF0dXMiOiJhY3RpdmUiLCJvcmlnaW4iOiJTU08iLCJvdmVyUGFkZGluZyI6ZmFsc2UsInN5c3RlbSI6ZmFsc2UsInJlZnJlc2hUb2tlbiI6IjkxZGJjN2FjLWY1NDMtNDM5MC05MjZiLWRkNGQyNDNjZTdmNyJ9.FrxAx3GzOwwa7Ec0Np-VPBhDRJPJNodbmKTt7oAlhdGuQnBd6f9KAYNpq5emZJ3C_ZmMFw4-G5DWdJLd7anlBA'
      Authorization: 'Bearer ' + eitoken
    }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.send(body);
    console.log(body);
  });


})

app.post("/checkservices", (req, res) => {
  //get service list
  var eitoken = req.body.EItoken;
  var spaceGuid = req.body.spaceGuid;
  var userid =  req.body.userid

  var options = { method: 'GET',
    url: `https://portal-management.wise-paas.io/mp/v1/spaces/${spaceGuid}/service_instances`,
    qs: { 
    //  guid: '2ebb103d-8ec4-48a0-b49f-a34fce9e7b08',
      guid: userid,
      check_valid: 'true' },
    headers: { 
    // Authorization: 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJ3aXNlcGFhc2lvIiwiaWF0IjoxNTY2NDM2NTkzLCJleHAiOjE1NjY0NDAxOTMsInVzZXJJZCI6ImYxNmQwYmFiLTAxNTctNGJmNS05Mzk0LTc1YzkzOTY3OGQ1MyIsInVhYUlkIjoiMmViYjEwM2QtOGVjNC00OGEwLWI0OWYtYTM0ZmNlOWU3YjA4IiwiY3JlYXRpb25UaW1lIjoxNTYzNzcyMDM1MDAwLCJsYXN0TW9kaWZpZWRUaW1lIjoxNTY1ODU5OTA3MDAwLCJ1c2VybmFtZSI6IkppbW15Llh1QGFkdmFudGVjaC5jb20udHciLCJmaXJzdE5hbWUiOiJKaW1teSIsImxhc3ROYW1lIjoiWHUiLCJjb3VudHJ5IjoiVFciLCJyb2xlIjoiZGV2ZWxvcGVyIiwiZ3JvdXBzIjpbIjIzYmE2NTlmLTJhYzUtNDJiNS1hMWRkLWU1NzljZGVjMzBmNiIsIlN0YW5sZXkuWWVoQGFkdmFudGVjaC5jb20udHciXSwiY2ZTY29wZXMiOlt7Imd1aWQiOiIyM2JhNjU5Zi0yYWM1LTQyYjUtYTFkZC1lNTc5Y2RlYzMwZjYiLCJzc29fcm9sZSI6ImRldmVsb3BlciIsInNwYWNlcyI6WyIwYWEwMzk5My1iMGM4LTRmYWItYTZkZC03YmU3ZTAwYzAwODAiLCI3ZTg4NDBjMy1hNWIwLTQ4NzItOTc3OC1iYTg1NWQ0ZmVhZjEiXX1dLCJzY29wZXMiOltdLCJzdGF0dXMiOiJhY3RpdmUiLCJvcmlnaW4iOiJTU08iLCJvdmVyUGFkZGluZyI6ZmFsc2UsInN5c3RlbSI6ZmFsc2UsInJlZnJlc2hUb2tlbiI6IjkxZGJjN2FjLWY1NDMtNDM5MC05MjZiLWRkNGQyNDNjZTdmNyJ9.FrxAx3GzOwwa7Ec0Np-VPBhDRJPJNodbmKTt7oAlhdGuQnBd6f9KAYNpq5emZJ3C_ZmMFw4-G5DWdJLd7anlBA'
      Authorization: 'Bearer ' + eitoken
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    res.send(body);
    console.log(body);
  });
});


app.listen(process.env.PORT || 3030, () => {
  console.log("Listen on port 3030");
});


