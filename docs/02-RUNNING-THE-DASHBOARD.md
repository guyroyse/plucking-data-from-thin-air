# Running the dashboard

In the course of this workshop we will use your SDR to:

- Monitor the broadcast power levels of local FM radio stations
- Receive aircraft flight information from aircraft transponders
- Decode APRS data packets sent by amateur radio operators
- Observe data packets from numerous devices potentially including vehicles, security systems, utility meters, and home automation devices; and most certainly a weather station

This data will be gathered from numerous command-line tools that we will download and configure. And other command-line tools that I wrote using Node.js that place that data into Redis 8 where it can be consumed by a web application and inspected by Redis Insight.

Before we get started gathering data, you will need to install this web application, which I call "The Dashboard", and Redis Insight.

## Installing the dashboard

The dashbaord is made of a client and a server. We'll start the server, and then the client.

### Running the dashboard server

The code for the dashboard server is located, unsurprisingly, in the `code/dashboard-server` folder. You'll want to open a terminal and go to that folder:

```bash
cd code/dashboard-server
```

By default, the server will connect to Redis with a hostname of `localhost` and a port of `6379`. This is hard-coded in the `src/redis-client.ts` file at the top:

```typescript
/* Change this to connect to a different Redis */
const redisOptions = {
  url: "redis://localhost:6379",
};
```

If you are using Redis Cloud or your Redis is deployed differently than instructed, you'll need to update this URL before you transpile the code and run it.

The dashboard server also is hard-coded to listen on port `8080`. If that port is in use on your machine, you will need to change it in the `src/server.ts` as well as in dashboard client. Or, better yet, just shut down whatever is using that port.

To start the server run the following:

```bash
npm install
npm run build
npm run start
```

If you get the following error you need to either start Redis or make sure that the URL you entered in `src/redis-client.ts` is correct:

```
Redis Client Error: Error: connect ECONNREFUSED ::1:6379
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16) {
  errno: -61,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '::1',
  port: 6379
}
```

Once it's running, you can confirm that it works by pointing your browser at the web API at http://localhost:8080/ and you should see a status of OK.

### Running the dashboard client

The code for the dashboard client is similarly located in the `code/dashboard-client` folder. You'll want to open a terminal and go to that folder:

```bash
cd code/dashboard-client
```

By default, the client connects to the server on port `8080` and listens to web requests on port `8000`. These are defeind int `src/config.ts` and `vite.config.js` respectively. Change as needed.

Hopefully you didn't have to do any of the above and can, instead, simply run the following commands:

```bash
npm install
npm run build
npm run preview
```

And then point you browser at: http://localhost:8000/.

## Installing Redis Insight

Redis Insight is easy to install. Just download and go. I recommend getting it from either the Mac App Store orr the Microsoft Store but if you're running Linux you can download it directly from Redis.

- **App Store**: https://apps.apple.com/us/app/redis-insight/id6446987963
- **Microsoft Store**: https://apps.microsoft.com/detail/xp8k1ghcb0f1r2
- **Redis Direct**: https://redis.io/insight/

Once you have it installed, run it and add you database. Use the same connection information you used earlier with the dashboard server.

Once you added it, click on it to explore your database. There's not much there yet but we can make sure it's working by using the CLI.

At the bottom left, click on the CLI symbol the looks like `>_ CLI`. This will, unsurprisingly, open a CLI where you can enter Redis commands. Enter the following command:

```
PING
```

It should respond with `"PONG"` and if it does, everything is up and running.
