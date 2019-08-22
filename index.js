const express = require("express");
const bodyparser = require("body-parser")
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

app.post("/deploy",(req,res)=>{

  var deploy_guide = `
  // Push your App to WISE-PaaS via Cloud Foundry

  cf push ${req.body.appName}`;
  
  res.send(deploy_guide);
});

app.post("/indexFile", (req, res) => {
  console.log(req.body)
  if (req.body.type === "rabbitmq") {
    
  var example_node_code = `
    // This is a JavaScript source code, save as 'app.js'
    // To test locally, remember to install the node packages.
    // Run 'npm init', to initailize a 'package.json' file
    // Run 'npm install {node_package} --save' to install packages
    // Run 'node app.js' to start this server

    //Source code starts here//
    const express = require('express');
    const mqtt = require('mqtt');

    app = express()

    app.use('/',(req,res)=>{
        res.send('hello world')
    })

    //get the WISE-PaaS environment vcap_services config 
    let vcap_services = JSON.parse(process.env.VCAP_SERVICES);

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

app.post("/getspace",(req,res)=>{
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


