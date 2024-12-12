# Plucking data from thin air with software-defined radio

Please read the [Before you arrive](#before-you-arrive) section below, uhm, before you arrive. And "before you arrive" doesn't mean in your hotel room the night before, or right before your flight leaves. Read it a couple of days before you leave your home. There is hardware you need to participate that you'll need to purchase _online_ and you'll want to have it before you leave.

## Before you arrive

We'll be installing and configuring lots of stuff during this workshop. In many ways, that's the main point. The tools around software-defined radio can be a bit niche and often fiddly. Being guided through setup helps immensely.

However, there are some tools that you should set up _before_ you come. And, some things you need to _purchase_ to get any use out of the workshop.

### Hardware requirements

This demo uses a software-defined radio. Despite the use of the word _software_ in its name, software-defined radio is actually a hardware device. So, you'll need to buy an SDR and an antenna to do this workshop. No worries, SDRs are fairly inexpensive.

Here's the load-out I like to use. It includes the SDR dongle and an a small selection of antennas that will work with it.

- RTL SDR kit: https://www.amazon.com/RTL-SDR-Blog-RTL2832U-Software-Defined/dp/B0CD7558GT/

You will need to have purchased this _before_ coming to the workshop. It's hardware, you can't download it.

### Software requirements

Technically, you could install these dependencies during the workshop, but there is much to do and having them in place before hand will let you focus on the fun parts of the workshop. Plus, conference wifi:

- **Node.js**: All of the code for this workshop is written using TypeScript. Don't worry if you're a JavaScript hater, you won't have to _write_ any code, but you will need to compile, well, transpile the code and run it. You'll need Node.js for that. Any version at or above v16 should work but I built the workshop using v18.

- **Docker**: We'll be using Docker to install Redis 8, which is where we will store the data we capture using the SDR you just purchased. You did [purchase one](https://www.amazon.com/RTL-SDR-Blog-RTL2832U-Software-Defined/dp/B0CD7558GT/), right?

#### Installing NPM packages

In the code folder there are folders for several tools. We could install a massive pile of packages over conference wifi, or we could do it before we arrive. Go into each folder—`dashboard-client` through `power-meter`—and run:

```bash
npm install
```

#### Installing Redis from Docker[^1]

Downloading Docker images before you show up is probably a good idea. The version of Redis we are using is Redis 8, which is still in a milestone release. It's likely that there will be a new milestone before the workshop, but this version should work fine.

```bash
docker run -d --name redis-8-m2 -p 6379:6379 redis:8.0-M02
```

[^1]: If for some reason you can't install Docker—perhaps work has your laptop locked down like Fort Knox—you can use [Redis Cloud's free tier](https://redis.io/try-free/) instead. Sign up anytime.
