
if [ -z "$test_secret" ]; then
    echo "Could not find secret"
else
    short_sha="${GITHUB_SHA::6}"
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"*Open Source Pipeline Failure!*\n>An issue occurred in commit: <${{github.server_url}}/${{github.repository}}/commit/${{github.sha}}|${short_sha}...>\"}" $test_secret
fi