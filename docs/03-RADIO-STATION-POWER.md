# Monitor the broadcast power levels of local FM radio stations

We'll be using two tools to do this.

The first, `rtl_power`, comes bundled with the RTL SDR drivers you installed earlier. It returns the signal strength in decibels for a range and for increments that you specify.

The other, `power-meter` is located in the `code/power-meter` folder. It takes the output of `rtl_power` and puts it into a timeseries in Redis.

## Setting up the antenna

Broadcast FM radio stations, like the NOAA radio stations, broadcast with their antennas arranged vertically. So, keep your antenna in the same orientation. However, the frequency is lower and you'll need to extend each leg to about 2-1/2 feet for ideal reception.

## Running rtl_power

Let's run `rtl_power` and grab the signal strengths for the FM broadcast radio band which goes from 88 MHz to 108 MHz.

```bash
rtl_power -f 88M:108M:200k -i 1
```

The `-f` flag of `rtl_power` specifies the frequency range and frequency step in the format:

```
<start>:<end>:<step>
```

Frequencies can be specified in raw numbers but you can also use `k` for 'kilohertz', `M` for 'megahertz', and `G` for 'gigahertz'.

The `-i` flag allows you to specify the time interval between samples, in seconds.

Running this command should provide a set of numbers every second

You should see a series of numbers that will look something like this:

```
2024-12-19, 17:07:06, 88000000, 90500000, 156250.00, 1024, 11.99, 9.03, 11.02, 10.29, 8.75, 9.18, 10.37, 10.40, 9.40, 9.40, 13.17, 23.24, 10.82, 9.86, 10.84, 10.73, 10.73
2024-12-19, 17:07:06, 90500000, 93000000, 156250.00, 1024, 1.57, -0.75, 2.35, 5.52, 3.81, 1.03, 1.66, 0.92, 2.53, 2.53, 8.39, 13.43, 13.78, 4.37, 1.09, -1.18, -1.18
2024-12-19, 17:07:06, 93000000, 95500000, 156250.00, 1024, 0.67, 3.33, 6.57, 4.65, 3.52, 5.70, 5.30, 3.12, 4.03, 4.03, 9.62, 17.02, 7.33, 2.90, 1.14, 0.71, 0.71
2024-12-19, 17:07:06, 95500000, 98000000, 156250.00, 1024, 7.71, 5.95, 6.99, 7.25, 7.14, 14.36, 8.27, 7.00, 9.37, 9.37, 19.80, 13.35, 8.61, 7.09, 6.76, 10.14, 10.14
2024-12-19, 17:07:06, 98000000, 100500000, 156250.00, 1024, 4.09, 1.04, 1.63, 4.24, 4.91, 6.70, 9.49, 4.55, 4.04, 4.04, 9.51, 17.70, 7.24, 3.90, 2.30, 3.37, 3.37
2024-12-19, 17:07:06, 100500000, 103000000, 156250.00, 1024, 0.09, 4.39, 3.68, 2.44, 1.20, 0.81, 2.83, 4.24, 3.08, 3.08, 4.71, 1.78, 3.73, 9.40, 1.77, -0.29, -0.29
2024-12-19, 17:07:06, 103000000, 105500000, 156250.00, 1024, 16.08, 13.24, 10.91, 11.49, 13.16, 10.02, 10.02, 11.20, 11.46, 11.46, 11.62, 13.91, 21.45, 15.27, 11.38, 13.11, 13.11
2024-12-19, 17:07:06, 105500000, 108000000, 156250.00, 1024, -6.89, -1.78, -0.92, -1.29, -2.29, -5.52, -6.61, -4.69, -4.14, -4.14, -5.49, -4.23, -3.08, -2.22, -2.75, -3.77, -3.77
```

If you look at this data you'll see a date and time; a start and stop frequency with a frequency interval; a sample rate; and several samples measured in decibels.

Hit Ctrl+C to stop the stream of numbers and let's instead pipe the output into `power-meter` to make it a bit more visual.

## Running power-meter

Transpile and install `power-meter`:

```bash
cd code/power-meter
npm install
npm run build
```

From there, run `rtl_power` and pipe its output into `power-meter`:

```bash
rtl_power -f 88M:108M:200k -i 1 | power-meter
```

If you are not running Redis locally, you'll need to specify it using `-r`:

```bash
rtl_power -f 88M:108M:200k -i 1 | power-meter -r redis://username:password@my.redis.server:1234
```

Regardless of how you kick this off, this will start shoving data into Redis.

## Viewing the data

You can view the keys that are created in Redis Insight by refreshing the key list in the top left. But you'll need to run Redis commands to see the actual data. Let's try that from the CLI:

```
TS.MRANGE - + WITHLABELS FILTER type=signalStrength
```

You should see a bunch of numbers. Let's try it form the workbench instead. Click the workbench icon and run the same command.

Redis Insight will try its best to make this a pretty chart but there is a lot of data and a lot of samples. It's really too complex for it to render well.

So, we need to use the dashboard. Go ahead and browse to http://localhost:8000/power.html. You should see clearly darker bars where local radio stations are.

If you're feeling extra ambitious, make a note of some of the frequencies. Then, go ahead and shut down `rtl_power` and use SDRangel to listen to some of the radio stations. You'll need to select Broadcast FM Demodulator instead of the NFM Demodulator to do this. And, you'll need to lower the _decimation_ to sample the full bandwidth of a broadcast FM signal.

![](images/sdr-angel-decimation.png)

If you're wondering what decimation is, it increases and decreases the sample rate that SDRangel uses when pulling data off the SDR. The lower the value, the more bandwidth that can be observed but the harder the software needs to work to process it. A value of 1 grabs the maximum bandwidth, 2 grabs half of that, 4 grabs a quarter, etc.
