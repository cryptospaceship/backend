ARG=$1
CMD="cd /opt/webapps/css-dev/backend/spaceship/ && source /opt/webapps/css-dev/backend/venv/bin/activate && python ./block_scanner_rsk.py $ARG"
/usr/bin/env bash -c "$CMD"