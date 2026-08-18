
if [ -z "$webhook_secret" ]; then
    echo "Could not find secret"
else
    short_sha="${sha:0:6}"
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"*Open Source Pipeline Failure!*\n>An issue occurred in commit: <${server_url}/${repository}/commit/${sha}|${short_sha}...>\"}" "$webhook_secret"
fi