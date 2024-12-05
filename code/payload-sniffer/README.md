# payload-sniffer

From this folder, you need to run:

```bash
npm install
npm run build
```

This will transpile and install the `payload-sniffer` tool globaly on your system. To run it you need to run `rtl_433` and pipe the output into `payload-sniffer`:

```bash
rtl_433 -g 50 -f 915M -F json | payload-sniffer
```

The `-g` flag of `rtl_433` is optional and sets the gain in decibels. If you don't set it, it will use the automatic gain function of the SDR, which isn't that great. 50 is the maximum gain for the RTL-SDR.

The `-f` flag of `rtl_433` specifies the frequency range to listen at. Valid values are:

- `315M`: 315 MHz is commonly used for automotive things like key fobs and tire sensors.
- `345M`: 345 MHz is commonly used for security systems in North America.
- `433M`: 433 MHz is the default and is used for all sorts of consumer IoT devices like home automation gear, doorbells, and weather stations.
- `868M`: MHz works in Europe
- `915M`: 915 MHz is where utility meters, industrial and commercial sensors, and some smart home stuff exist. You'll also find LoRa and Meshtatstic signals here.

The `-F` flag specifies the format messages are printed in. `paylod-sniffer` expects JSON so this is set to `json` but there are lots of other formats. `rtl_433 --help` will display them.
