#!/bin/bash
cd /Users/foxbrush/Projects/gaia
# make clean;GAIA_DEVICE_TYPE=tv DEVICE_DEBUG=1 make
# TEST_FILES=apps/video/test/marionette/video_list_test.js
# TEST_FILES=apps/system/test/marionette/software_home_callscreen_test.js
# REPORTER=spec VERBOSE=1 TEST_FILES=apps/settings/test/unit/modules/wifi_context_test.js HOST_LOG=gijtv_log.txt
# GAIA_DEVICE_TYPE=tv TEST_FILES=tv_apps/smart-system/test/marionette/app_modal_dialog_test.js APP=smart-system
REPORTER=spec VERBOSE=1 DEVICE_DEBUG=1 GAIA_DEVICE_TYPE=tv APP=smart-home make test-integration
