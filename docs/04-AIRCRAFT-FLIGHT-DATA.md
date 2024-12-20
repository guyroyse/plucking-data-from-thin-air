# Receive aircraft flight information from aircraft transponders

We'll be using two tools to do this: `dump1090` and `plane-finder`.

`dump1090` is a command-line tool that talks to your RTL SDR and listens for aircraft transponder broadcasts on 1090 MHz. It can display these on your terminal and expose them as raw data on network ports.

`plane-finder` is a tool that I wrote that will consume the raw data exposed by `dump1090` and place it in Redis where the dashbaord can consume it and put it on a map.

## Setting up the antenna

Aircraft transponder antennas stick out of the belly of the aircraft and are arranged vertically. So, once again, keep your antenna in the same orientation. However, the frequency is much higher than we've used before and you'll need much shorter legs with each leg being about 2-1/2 inches long.

## Installing and running dump-1090

### Installing on Linux

This is probably the easiest. Just run:

```bash
sudo apt install dump1090-mutability
```

You might be asked if you want to install this so that it always runs. I've only ever said no.

### Installing on a Mac

I use [Homebrew](https://brew.sh/) to install on a Mac:

```bash
brew install dump1090-mutability
```

### Installing on Windows

Windows has a lot of ports of dump1090. I like to use this one: https://github.com/MalcolmRobb/dump1090.

Just download the .ZIP file in the root of the repository—yes, it's really 10 years old—and unzip it into a folder of your choice. From there, you can just run it from that folder or, if you prefer, add it to your path.

## Running dump-1090

You should now be able to run dump1090 using the following command:

```bash
dump1090 --net --interactive
```

If you installed to Linux, you'll need to run this instead:

```bash
dump1090-mutability --net --interactive
```

If you have your antenna attached, aircraft should start showing up. Here's some that I found today while writing this:

```
 Hex    Mode  Sqwk  Flight   Alt    Spd  Hdg    Lat      Long   RSSI  Msgs  Ti/
-------------------------------------------------------------------------------
 AD4C2A S                                                      -39.6     3  1
 A097CE S                    40000                             -32.5    11  0
 06A1DA S                    47000                             -33.4     7  0
 A71ABB S     7143           43000  476  272                   -33.1    18  1
 A280FE S                    40000  443  299   40.346  -83.589 -35.5     5  0
 A1FF90 S                     4000  230  294   39.920  -83.152 -28.2    13  0
 A59398 S     1512  AAL464   34975  472  082   40.013  -82.266 -27.4    55  0
 A05544 S                    43000  474  107   40.163  -82.640 -29.5    21  2
 A66312 S     1200  OSU51     1700   90  270   40.091  -83.082 -25.2    49  0
 A537ED S     6646  RPA4723  31000  439  103   39.867  -82.767 -28.0   100  0
 A05AAC S     6616  UCA4824  31000  431  102   39.984  -82.297 -23.8    39  0
 A16B47 S                    41000  491  045   40.486  -83.588 -31.7    39  1
 A69939 S     1546  EJA524    5925  240  275   39.909  -82.957 -25.0    64  0
 AC0B74 S           SWA4635  36000  455  267   40.523  -83.089 -28.6    94  0
 A0B990 S     6036           40000  423  322   39.488  -83.482 -26.7    56  0
 C07C7A S     7276           37000  467  053   40.124  -82.966 -19.3    56  0
```

If you're wondering what the flags are for, the `--interactive` flag makes for the pretty display. If you don't specify it, it will just scroll through messages that look like that as they are received:

```
*8daaf93d99118322f8049c372950;
CRC: 000000
RSSI: -26.4 dBFS
Score: 1800
Time: 1429802.42us
DF:17 AA:AAF93D CA:5 ME:99118322F8049C
 Extended Squitter Airborne velocity over ground, subsonic (19/1)
  ICAO Address:  AAF93D (Mode S / ADS-B)
  Air/Ground:    airborne
  GNSS delta:    -675 ft
  Heading:       54
  Speed:         475 kt groundspeed
  Vertical rate: 0 ft/min GNSS
```

The `--net` flag tells `dump-1090` to expose ports with the raw data it is receiving. You can view this data using [netcat](https://en.wikipedia.org/wiki/Netcat).

Port `30002` exposes hex-encoded packets:

```bash
nc localhost 30002
```

```
*8DA7012199118392F0049566445D;
*20001838B494FA;
*8DA517A199157A193804A101A7D5;
*02E19998BE1C8C;
*8DA026E15833F642A7BC292ACC11;
```

Port `30003` exposes more easily parsed CSV:

```bash
nc localhost 30003
```

```
MSG,8,1,1,A517A1,1,2024/12/20,11:04:26.003,2024/12/20,11:04:26.052,,,,,,,,,,,,0
MSG,4,1,1,AC462D,1,2024/12/20,11:04:26.006,2024/12/20,11:04:26.053,,,301,124,,,-1344,,,,,0
MSG,5,1,1,A1CF48,1,2024/12/20,11:04:26.017,2024/12/20,11:04:26.053,,32000,,,,,,,0,,0,
MSG,8,1,1,A517A1,1,2024/12/20,11:04:26.036,2024/12/20,11:04:26.053,,,,,,,,,,,,0
MSG,3,1,1,AC462D,1,2024/12/20,11:04:26.069,2024/12/20,11:04:26.107,,9675,,,40.19151,-83.10785,,,,,,0
```

Go ahead and leave `dump-1090` running as `plane-finder` will connect on port `30003` to pull data out.

## Installing and running plane-finder

Transpile and install `plane-finder`:

```bash
cd code/plane-finder
npm install
npm run build
```

Run it:

```bash
plane-finder --ttl 3600
```

The `--ttl` flag sets a time-to-live for aircraft records in Redis. If no new messages are received after this amount of time, the record will be purged from Redis. This is optional and defaults to 300 (i.e. 5 minutes). I've set it to an hour, which is probably overkill. Set it the whatever you'd like!

Also, if you are not running Redis locally or perhaps on a different port, you can specify a Redis URL using `-r`:

```bash
plane-finder -r redis://username:password@my.redis.server:1234
```

`plane-finder` will immediately begin adding and updating JSON documents in Redis and will tell you all about it:

```
Added aircraft to Redis: AC4660
Added aircraft to Redis: A55B7A
Added aircraft to Redis: A65FAE
Added aircraft to Redis: A5628C
Added aircraft to Redis: A55B7A
```

## Viewing aircraft data

You can look at the JSON documents with Redis Insight. They'll be in keys like `aircraft:A55B7A`. Go ahead and do that. Click the little refresh icon to see if the data changes.

Meanwhile, the dashboard will query Redis once a second for all of the aircraft is has stored and display them on a map, which, frankly, is pretty cool. Go to http://localhost:8000/planes.html and watch them move about.

Here are some I captured from my house where I have an ADS-B antenna mounted on a 25-foot mast.

![](images/aircraft-spots.png)
