# power-meter

From this folder, you need to run:

```bash
npm install
npm run build
```

This will transpile and install the power-meter tool globaly on you system. To run it you need to run `rtl_power` and pipe the output into `power-meter`:

```bash
rtl_power -f 88M:108M:25k -i 1 | power-meter
```

The `-f` flag of `rtl_power` specifies the frequency range and interval in the format:

```
<start>:<end>:<step>
```

Frequencies can be specified in raw numbers but you can also use `k` for 'kilohertz', `M` for 'megahertz', and `G` for 'gigahertz'.

The `-i` flag allows you to specify the teim interval between samples, in seconds.

The above example samples to entire broadcast radio spectrum from 88 MHz to 108MHz using 25kHz steps every second.
