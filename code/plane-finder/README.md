# plane-finder

From this folder, you need to run:

```bash
npm install
npm run build
```

This will transpile and install the plane-finder tool globaly on your system. To run it you will first need to run `dump1090` in another terminal and then `plane-finder`:

```bash
dump1090 --net --interactive
plane-finder
```

The `--net` flag turns on networking capabilities that `plane-finder` will use.

The `--interactive` flag is optional, but makes a pretty display so I like to turn it on.
