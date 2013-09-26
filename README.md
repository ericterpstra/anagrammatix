# Anagrammatix

A multi-player, multi-screen game built to experiment with Socket.IO and Node.js.

There is *sometimes* a working demo up at http://agx.terpstra.co - but no guarantees.

## To Install

1. Ensure Node.js is installed
2. Clone this repository - `git clone https://github.com/ericterpstra/anagrammatix.git`
3. Install the dependences:
    1. `cd anagrammatix`
    2. `npm install`
4. Start the server: `node index.js`
5. Visit http://127.0.0.1:8080 in a browser and click CREATE.

## To Play

### Setup
1. Ensure 3 devices are on a local network, or that the application server is accessable by 3 devices.
2. Start the Anagrammatix application
3. Visit http://your.ip.address:8080 on a PC, Tablet, SmartTV or other large screen device
4. Click CREATE
5. On a mobile device, visit http://your.ip.address:8080
6. Click JOIN on the mobile device screen.
7. Follow the on-screen instructions to join a game.
8. Find an opponent and have him/her repeat steps 5-7 on another mobile device.

### Gameplay
1. On the large screen (the game Host), a word will appear.
2. On each players' devices, a list of words appear.
3. The players must find an anagram of the word on the Host screen within the list of words on the mobile device.
4. The player who taps the correct anagram first gets 5 points.
5. Tapping an incorrect word will subtract 3 points.
6. The player with the most points after 10 rounds wins!
