# packet-watcher

From this folder, you need to run:

```bash
npm install
npm run build
```

This will transpile and install the `packet-watcher` tool globaly on your system. To run it you will first need to run `direwolf` in another terminal and then `packet-watcher`:

```bash
rtl_fm -M fm -f 144.39M -s 48000 -g 50 -E dc - | direwolf -r 48000 -b 16 -
```

```bash
packet-watcher -h 127.0.0.1 -p 8001
```
