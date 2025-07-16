# RiskAtlas
This is the front-end side of the RiskAtlas web platform.  

#### Server requests
Server requests are forwarded to the desired address through an environment variable, which saves the "root", which then gets added before any given server endpoint. To achieve this, just place an `.env` file in the root of the project, with the following content:
```
VITE_ROOT_SERVER_URL=http://your/server/url
VITE_WS_URL=ws://your/websocket/url
```
