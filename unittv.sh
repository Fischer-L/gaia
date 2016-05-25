#!/bin/bash
cd /Users/foxbrush/Projects/gaia/

#bin/gaia-test /Users/foxbrush/Projects/gaia/ /Users/foxbrush/Projects/cmds/firefoxnightly.app/Contents/MacOS/firefox
# OLD
DEBUG=1 make
# /Users/foxbrush/Projects/cmds/firefoxnightly.app/Contents/MacOS/firefox
/Users/foxbrush/SW/mulet_47.0a1.app/Contents/MacOS/firefox-bin -profile /Users/foxbrush/Projects/gaia/profile-debug app://test-agent.gaiamobile.org/