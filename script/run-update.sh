#! /bin/bash
python /home/tzu/na-backend/script/cron.py --update "`date --date '-5 min' +"%Y-%m-%d %T"`" 2>&1 >> /home/tzu/na-cron-logs/update_$(date --iso-8601=seconds).log
