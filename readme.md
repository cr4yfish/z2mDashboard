# z2m Dashboard
z2m Dashboard is an easy to use backend API with an own frontend for zigbee2mqtt.

## Features

- Configure settings in frontend
- You only need to provide the IP and Port of zigbee2mqtt, the programm does the rest

## Tech

z2m Dashboard uses these technologies:

- [NodeJS]
- [ExpressJS]
- [Mqtt.js]
- [Vue.js]
- [NoUiSlider.js]
- [Font Awesome]
- [nedb]

## Installation

Z2m requires [Node.js](https://nodejs.org/) v13+ to run.

### 1. Download the repo

```sh
gh repo clone cr4yfish/z2mDashboard
```

### 2. Change the IP the frontend will call to
```sh
cd z2mDashboard/public/scripts
nano main.js
```
- Change the follwing line.

```js
const HOST = '[your IP address]:30000'
```
If you are running z2m Dashboard on a Pi, for example, you should insert the Pi's IP.
To find out your IP on Linux (which a PI is running on).
```sh
hostname -I
```
Make sure to use an upper-case "i".

### 3. Start the Server

```sh
cd ..
cd ..
npm start
```

This will start the server in the console. However, I recommend using [pm2] to run z2mDashboard because you will be able to run it in the background and start it with boot.

### 4. (optional) Set up pm2
- Install [pm2]
```sh
npm install pm2 -g
```
- Add z2m to pm2
```sh
pm2 start index.js --name z2mDashboard
pm2 save
```

### 5. Change the IP and Port in the frontend
Steps:
- Open the frontend
```web
http://[the same IP you typed in earlier]:3000
```
- Go to the settings tab by tapping the menu icon in the top right.
- Change IP and PORT to your zigbee2Mqtt installation.
(If Zigbee2Mqtt is running on the same device as z2mDashboard, the IP is the same as the one earlier. The PORT is most likely 1883)

### Final Step: Restart z2mDashboard
(One the device with z2m installed)

Press ctrl+c
```sh
npm start
```

Or if you installed pm2
```sh
pm2 restart z2mDashboard
```

## Known Issues
- When adding/removing/editing groups in zigbee2mqtt, you NEED to restart z2mDashboard, or it will most likely cease to work
- Light color represenation can be slightly/greatly off
- Color/Brightness is sometimes not correctly represented in the UI

## Development

Want to contribute? Great!

For local development, I recommend changing the HOST variable in *public/scripts/main.js* to localhost

Open the file
```sh
cd z2mDashboard/public/scripts
nano main.js
```
Change the follwing line
```js
const HOST = 'http://localhost:30000'
```

[NodeJS]: <https://nodejs.org/>
[ExpressJS]: <https://expressjs.com/>
[Mqtt.js]: <https://github.com/mqttjs/MQTT.js>
[Vue.js]: <https://vuejs.org/>
[NoUiSlider.js]: <https://refreshless.com/nouislider/>
[Font Awesome]: <https://fontawesome.com/>
[nedb]: <https://github.com/seald/nedb>
[pm2]: <https://pm2.keymetrics.io/>
