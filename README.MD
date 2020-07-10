# sentnl_io
Sentnl WAXRAM


# Build the producxtion container
```
CD into directory of choice
docker build https://github.com/ankh2054/eos-ramdex.git -t eosram-dex . 
```
# Run the container using nginx proxy

```
docker run  --name waxram.sentnl.io --expose 80 \
-d -e "VIRTUAL_HOST=waxram.sentnl.io" \
-e "LETSENCRYPT_HOST=waxram.sentnl.io" \
-e "LETSENCRYPT_EMAIL=charles.holtzkampf@gmail.com" \
-e "PG_PASSWORD=postgresqlpassword" \
-e "DB_DATABASE=waxram" \
-e "DB_USER=waxramuser" \
-e "DB_PASSWORD=waxram" \
-v /data/sites/waxram.sentnl.io/postgresql:/var/lib/postgresql \
eosram-dex:prod
```
