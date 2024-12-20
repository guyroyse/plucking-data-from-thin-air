# Observe data packets from IoT devices

We'll be using two tools to do this: `rtl_433` and `payload-sniffer`.

`rtl_433` is a command-line tool that we'll need to install. It picks up and decodeds data packets transmitted by numerous devices in numerous formats and writes it to disk or `stdout` in various formats. These devices include things such as car key fobs and tire pressure sensors, security system and home automation devices, utility meters, and weather stations.

`payload-sniffer` is a tool that I wrote that will consume JSON data piped in from `rtl_433` and put it into and an event stream in Redis for each unique device detected.

## Setting up the antenna

The data the rtl_433 can pick up is on a small selection of frequencies so the length of the legs of your dipole (which will still remain vertical) will vary. You'll probably want to try out several of frequencies below:

- **315 MHz** is commonly used for automotive things like key fobs and tire sensors.
- **345 MHz** is commonly used for security systems.
- **433 MHz** is used for all sorts of consumer IoT devices like home automation gear, doorbells, and weather stations.
- **915 MHz** is where utility meters, industrial and commercial sensors, and some smart home stuff exist. You'll also find LoRa and Meshtatstic signals here.

Ideally, each leg will be 1/4 of a wavelength for the frequency you want. The formula to calculate wavelength in meters is to divide the speed of light in meters per second by the frequency in seconds. For example, the speed of light is roughly 300 million m/s. 150 MHz is 150 million cycles per second. So:

    300,000,000 / 150,000,000 = 2

This would make the length of a leg for your antenna at 50 cm, or about 19-1/2 inches.

## Installing and trying out rtl_433

The source for `rtl_433` along with installation instructions can be found [here](https://github.com/merbanan/rtl_433). These instructions are decent, but don't provide anything for Windows users except "compile from source". Don't worry. I found something else.

### Installing on Linux

Just run the following:

```bash
sudo apt-get install rtl-433
```

### Installing on Mac

It's a fairly easy install using homebrow:

```bash
brew install rtl_433
```

### Installing on Windows

To install on Windows you have some choices. First, you can use the above link and compile it from source. Second, you can download some binaries that another GitHub user set up at https://github.com/winterrace/rtl_433_win/releases.

Compiling from source will get you the latest, greatest, and most updatest version. Downloading a ZIP containing an EXE and a DLL and adding them to your path is a lot easier.

### Trying it out

Now that you have `rtl_433` installed, set up your antenna and give it a try at the various frequencies mentioned earlier. Use the following command:

```bash
rtl_433 -g 50 -f 915M
```

The `-g` flag sets the gain for the RTL SDR. `50` is cranked all the way up.

The `-f` flag sets the center frequency to look at. Much like `rtl_power` and `rtl_fm`, `rtl_433` lets you specify frequencies using _k_, _M_, and _G_ as postfixes for kHz, MHz, and GHz.

If you're not seeing something on one of the frequencies, try changing to another. 433 MHz is guaranteed to have something if you are attending this in person as I have a weather station with me to sends out weather updates over 433 MHz.

When you get something, it should resemble this:

```
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
time      : 2024-12-20 15:47:21
model     : Acurite-5n1  message_type: 56          id        : 2184
channel   : A            sequence_num: 0           Battery   : 1             wind_speed: 0.0 km/h      temperature: 69.4 F       humidity  : 45 %          Integrity : CHECKSUM
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
time      : 2024-12-20 15:47:21
model     : Acurite-5n1  message_type: 56          id        : 2184
channel   : A            sequence_num: 1           Battery   : 1             wind_speed: 0.0 km/h      temperature: 69.4 F       humidity  : 45 %          Integrity : CHECKSUM
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
time      : 2024-12-20 15:47:21
model     : Acurite-5n1  message_type: 56          id        : 2184
channel   : A            sequence_num: 2           Battery   : 1             wind_speed: 0.0 km/h      temperature: 69.4 F       humidity  : 45 %          Integrity : CHECKSUM
```

## Installing and running payload-sniffer

This works pretty much like the rest of the tools:

```bash
cd code/payload-sniffer
npm install
npm run build
```

This will transpile and install the `payload-sniffer` tool globaly on your system. To run it you need to run `rtl_433` and pipe the output into `payload-sniffer`:

```bash
rtl_433 -g 50 -f 433M -F json | payload-sniffer
```

Note the `-F` flag sets the format that `rtl_433` output data into. `payload-sniffer` expect this to be JSON to be sure to include it. However, there are lots of other formats. `rtl_433 --help` will display them.

Also, like the rest of the tools, you can override the location of Redis using `-r`:

```bash
rtl_433 -g 50 -f 433M -F json | payload-sniffer -r redis://username:password@my.redis.server:1234
```

`payload-sniffer` will tell you when it receives data:

```
Processing line {"time" : "2024-12-20 15:53:39", "model" : "Acurite-5n1", "message_type" : 49, "id" : 2184, "channel" : "A", "sequence_num" : 0, "battery_ok" : 1, "wind_avg_km_h" : 0.000, "wind_dir_deg" : 112.500, "rain_in" : 0.090, "mic" : "CHECKSUM"}
Adding event for model Acurite-5n1 to stream.
Processing line {"time" : "2024-12-20 15:53:39", "model" : "Acurite-5n1", "message_type" : 49, "id" : 2184, "channel" : "A", "sequence_num" : 1, "battery_ok" : 1, "wind_avg_km_h" : 0.000, "wind_dir_deg" : 112.500, "rain_in" : 0.090, "mic" : "CHECKSUM"}
Adding event for model Acurite-5n1 to stream.
Processing line {"time" : "2024-12-20 15:53:39", "model" : "Acurite-5n1", "message_type" : 49, "id" : 2184, "channel" : "A", "sequence_num" : 2, "battery_ok" : 1, "wind_avg_km_h" : 0.000, "wind_dir_deg" : 112.500, "rain_in" : 0.090, "mic" : "CHECKSUM"}
```

## Viewing the data

`payload-sniffer` populates several keys in Redis including a set containing every device that has been detected and an event stream for each device. Look in the `rtl_433:models` key to see all the devices detected so far. The names in here are used in the keyname for the event stream. For the weather station, for example, there is a event stream named `rtl_433:Acurite-5n1`. If you look in one of these streams, you'll see the data that was sent.

The dashboard has a view specifically for viewing the weather data. Go to it at http://localhost:8000/weather.html and select the Acurite-5n1 device to view the current weather conditions as reported by my weather station.
