# plane-finder

From this folder, you need to run:

```bash
npm install
npm run build
```

This will transpile and install the `plane-finder` tool globaly on your system. To run it you will first need to run `dump1090` in another terminal and then `plane-finder`:

```bash
dump1090 --net --interactive
```

The `--net` flag turns on networking capabilities that `plane-finder` will use. The `--interactive` flag is optional, but makes a pretty display so I like to turn it on.

```bash
plane-finder --ttl 3600
```

The `--ttl` flag sets a time-to-live for aircraft records in Redis. If no new messages are received after this amount of time, the record will be purged from Redis.
