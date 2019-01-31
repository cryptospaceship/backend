ARG=$1
CMD="cd /opt/webapps/css-dev/backend/spaceship/ && source /opt/webapps/css-dev/backend/venv/bin/activate && python ./block_scanner.py $ARG"
/usr/bin/env bash -c "$CMD"