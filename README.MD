# sentnl_io
Sentnl WAXRAM


# Build the producxtion container
```
CD into directory of choice
docker build https://github.com/ankh2054/eos-ramdex.git -t eosram-dex 
```


## ENV Variables

|ENV & ARG                 |Value                          |Description                                   |
|--------------------------|---------------------------------------|--------------------------------------|
|**CHAIN_NAME**            |`wax`                                  | Used for DB setup                    |
|**PG_PASSWORD**           |`postgresqlpassword      `             | PostgreSQL password                  |
|**DB_DATABASE**           |`waxram`                               | Database Name for RAM data           |
|**DB_USER**               |`waxramuser`                           | Database user with access to DB      |
|**DB_PASSWORD**           |`waxramuserpassword`                   | Password for Database user       	  |




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

##  Change database name in dbapi/controller/ram.js & database setup 
use ENV variable to create DB for any chain
You will also need to chaneg API endpoints
This will allow us to conect 
Use ARG ENV for this
sed -E "s/(host:.).+$/\1'waxram.sentnl.io',/g" frontend/react/src/App/TVChart/api/conf.txt > conf.js