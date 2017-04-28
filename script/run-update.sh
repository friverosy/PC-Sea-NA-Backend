#! /bin/bash
python /home/tzu/na-backend/script/manifest_harvester.py --date $(date +%F) 2>&1 >> /home/tzu/na-cron-logs/update_$(date --iso-8601=seconds).log
