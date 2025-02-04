#!/bin/sh
## Configuration for NginX proxy and CoMetaR application
echo "---- BEGIN WEB CONFIGURATION ----"

ORRIG_IFS=$IFS
IFS=,
## Build allow directives for nginx
if [ "$FUSEKI_ADMIN_ALLOW_RANGE" != "" ]; then
  echo "Setting fuseki admin allow range: ${FUSEKI_ADMIN_ALLOW_RANGE}"
  for range in $FUSEKI_ADMIN_ALLOW_RANGE; do
    TEMP_ALLOW_RANGE=$(echo "${TEMP_ALLOW_RANGE}allow ${range};")
  done
  export FUSEKI_ADMIN_ALLOW_RANGE="${TEMP_ALLOW_RANGE}"
  echo "NginX fuseki admin allow directive: ${FUSEKI_ADMIN_ALLOW_RANGE}"
fi
if [ "$REST_ALLOW_RANGE" != "" ]; then
  unset TEMP_ALLOW_RANGE
  echo "Setting rest allow range: ${REST_ALLOW_RANGE}"
  for range in $REST_ALLOW_RANGE; do
    TEMP_ALLOW_RANGE=$(echo "${TEMP_ALLOW_RANGE}allow ${range};")
  done
  export REST_ALLOW_RANGE="${TEMP_ALLOW_RANGE}"
  echo "NginX rest allow directive: ${REST_ALLOW_RANGE}"
fi
IFS=$ORIG_IFS
envsubst "\$REST_SERVER \$FUSEKI_SERVER \$FUSEKI_ADMIN_ALLOW_RANGE \$REST_ALLOW_RANGE \$GIT_SERVER \$GIT_ALLOW_RANGE \$BROWSER_FQDN" < /config/nginx-web.conf > /etc/nginx/conf.d/cometar.conf

## Create auth file if doesn't already exist
if [[ ! -e /etc/nginx/auth/.htpasswd_git ]] ; then
  mkdir -p /etc/nginx/auth/
  touch /etc/nginx/auth/.htpasswd_git
fi

## Apply application environemnt configuration
## Generate $BROWSER_FUSEKI_SERVER from components...
# BASE_URL=$(echo -e "${BROWSER_SCHEME}://${BROWSER_FQDN}")
# if [[ ! "${BROWSER_PORT}" ]] ; then
#   BASE_URL=$(echo -e "${BASE_URL}:${BROWSER_PORT}")
# fi
# export BASE_URL="${BASE_URL}"
# export BROWSER_FUSEKI_SERVER=$(echo -e "${BASE_URL}${BROWSER_FUSEKI_PATH}")
envsubst "\$HREF_BRAND \$BASE_PREFIX \$ENDPOINT_BASE" < /config/cometar_config_template.json > /usr/share/nginx/html/cometar_browser/assets/config.json

echo "---- END WEB CONFIGURATION ----"
