#!/bin/bash
cd /Users/foxbrush/Projects/gaia
# PRODUCTION=1 NOFTU=1
make clean;GAIA_DEVICE_TYPE=tv DEVICE_DEBUG=1 make

# Mulet
# ./firefox/Contents/MacOS/firefox-bin -profile `pwd`/profile -start-debugger-server 6000
/Users/foxbrush/SW/mulet_47.0a1.app/Contents/MacOS/firefox-bin -start-debugger-server 6000 -profile /Users/foxbrush/Projects/gaia/profile

# To enable mulet WedIDE debugger
# user_pref('devtools.debugger.remote-enabled', true);
# user_pref('devtools.chrome.enabled', true);

# B2G
# /Applications/B2G.app/Contents/MacOS/b2g-bin -profile /Users/foxbrush/Projects/gaia/profile -start-debugger-server 6000 -screen 1920x1080




        # if (window.TMP_buf) {
        #   window.TMP_run_buf = () => {
        #     this._folder.addCard(card, {silent: true});
        #   };
        #   return;
        # }