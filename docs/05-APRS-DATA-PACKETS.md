# Decode APRS packets sent by amateur radio operators

We'll be using three tools to do this: `rtl_fm`, `direwolf`, and `packet-watcher`.

`rtl_fm` is a command-line tool that comes with the RTL SDR drivers. It uses your SDR to receive data and then demodulates it to audio signals that it can then write to a file or to `stdout`. We're using it to get the audio for APRS packets.

`direwolf` is a software modem that takes audio input from either sound cards or from `stdin` and decodes AX.25 and APRS packets in that audio. It will also publish these decoded packets on sockets using both the KISS and AGW protocols. We'll be using KISS because it's simpler.

`packet-watcher` is a tool that I wrote that will consume the raw packet data that `direwolf` publishes on port `8001`, parse out the useful bits, and put it into and event stream in Redis where we can see and manipulate it.

## Setting up the antenna

APRS traffic in the U.S. is transmitted at 144.39 MHz in the 2-meter amateur radio band using a narrow-band FM modulation. This mode normally has the antenna arranged vertically. The frequency of 144.29 MHz works best with each leg of your antenna being at about 20 inches in length.

## Installing direwolf

The source for direwolf along with installation instructions can be found [here](https://github.com/wb2osz/direwolf). There are a lot of options on how to do this. Below is how I do it.

### Installing on Linux

```bash
sudo apt-get update
sudo apt-get install direwolf
```

### Installing on Mac

```bash
brew install direwolf
```

### Installing on Windows

Go to the [releases page](https://github.com/wb2osz/direwolf/releases). Download the latest ZIP file for your platform and unzip it. Add it too your path, or just run it from the folder you unzipped it into.

## Running direwolf and rtl_fm

We will pipe the output from `rtl_fm` into `direwolf` and we should be able to see packets start appearing. So, from a terminal, you need to run:

```bash
rtl_fm -M fm -f 144.39M -s 48000 -g 50 -E dc - | direwolf -r 48000 -b 16 -
```

This is a rather heavy command so I asked ChatGPT to describe it. Here's what it said:

> This command uses two tools, `rtl_fm` and `direwolf`, to receive, process, and decode data from an SDR (software-defined radio). Let me break it down step by step:
>
> ---
>
> ### `rtl_fm`
>
> `rtl_fm` is a command-line utility that tunes an RTL-SDR dongle to a specific frequency and demodulates it.
>
> - `-M fm`: Sets the mode to "narrowband FM" (often used for data communication, such as APRS in amateur radio).
> - `-f 144.39M`: Specifies the frequency to tune to. In this case, 144.39 MHz is used, which is the frequency for APRS (Automatic Packet Reporting System) in North America.
> - `-s 48000`: Sets the sample rate to 48,000 samples per second. This is the audio sampling rate and is important for compatibility with subsequent decoding steps.
> - `-g 50`: Sets the gain of the SDR to 50. Gain controls the amplification of the received signal; 50 is a relatively high value, which might be useful for weak signals but can introduce noise.
> - `-E dc`: Enables DC blocking to remove a DC offset from the received signal. This helps reduce interference caused by DC bias.
>
> The output of `rtl_fm` is a demodulated audio stream, which is piped (`|`) into the next tool.
>
> ---
>
> ### `direwolf`
>
> `direwolf` is a software TNC (Terminal Node Controller) used for decoding AX.25 packets, such as those used in APRS.
>
> `-r 48000`: Sets the audio sample rate to 48,000 samples per second, matching the output of `rtl_fm`.
> `-b 16`: Sets the number of bits per sample to 16, which is standard for high-quality audio and matches the default bit depth of `rtl_fm`.
>
> ---
>
> ### Piping Process
>
> The `rtl_fm` command outputs a continuous audio stream, which is fed directly to `direwolf` via the pipe (`|`). This setup allows the two programs to work together without writing intermediate data to a file:
>
> - `rtl_fm` tunes to the APRS frequency, demodulates the signal, and outputs it as an audio stream.
> - `direwolf` takes the audio stream, decodes it into AX.25 packets, and can process the APRS data (such as position reports, telemetry, or messages).
>
> ---
>
> ### Use Case
>
> This command is commonly used in amateur radio for receiving APRS data. It decodes packets from the 144.39 MHz APRS frequency and outputs them for further processing, such as displaying on a map or forwarding to APRS networks.

Well that was easier than _me_ explaining it!

## Installing and running

This works pretty much like the rest of the tools:

```bash
cd code/packet-watcher
npm install
npm run build
```

This will transpile and install the `packet-watcher` tool globally on your system. Just run it and it will connect to `direwolf`:

```bash
packet-watcher
```

And, once again, if you are not running Redis locally or perhaps on a different port, you can specify a Redis URL using `-r`:

```bash
packet-watcher -r redis://username:password@my.redis.server:1234
```

Either way, it will immediately begin taking packets it receives and placing them into an event stream in Redis.

```
Received 81 bytes: c000a860a8ae6ca260ae70ae8c8840f2ae9e9ea6a8a4e096708ea0a640f4ae92888a6240e096708ea0a640e8ae92888a6440e103f0606d36656c201c6b2f5d2237537d4d4f4e5f3134362e3532303d0dc0
Received 102 bytes: c00082a09a92606c6096708ea0a64068ae92888a64406503f0403230313930387a333935312e38314e2f30383234372e39345723575833696e31506c75733220553d31322e35562c543d35352e35462020687474703a2f2f7777772e6b386770732e636f6dc0
Received 74 bytes: c00082a09c606060609c609e8ea6407296708ea0a640e8ae92888a6240e0ae92888a64406303f03d333935372e32314e5c30383234372e3537574a3334372f3030315647432d4e3736c0
Received 60 bytes: c00082a09a92606c6096708ea0a64068ae92888a64406503f054233035392c3136372c3135342c3035392c3031332c3030302c3030303030303030c0
Received 105 bytes: c00082a0a8a86840609c6286a88c4064ae92888a624062ae92888a64406303f02f3138353731307a343030352e36324e2f30383330342e3436575f3036342f303031673030337430333972313036503137316838396231303132336c333137583138316a5349470dc0
```

## Viewing the data

You can view the data in Redis under the key `aprs:packets` or in the dashboard at http://localhost:8000/packets.html.
