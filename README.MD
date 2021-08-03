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
|**PGPASSWORD**            |`postgresqlpassword`                   | PostgreSQL password                  |
|**DB_DATABASE**           |`waxram`                               | Database Name for RAM data           |
|**DB_USER**               |`waxramuser`                           | Database user with access to DB      |
|**DB_PASSWORD**           |`waxramuserpassword`                   | Password for Database user       	  |




# Run the container using nginx proxy

```
docker run  --name waxram.sentnl.io --expose 80 \
-d -e "VIRTUAL_HOST=waxram.sentnl.io" \
-e "LETSENCRYPT_HOST=waxram.sentnl.io" \
-e "LETSENCRYPT_EMAIL=charles.holtzkampf@gmail.com" \
-e "PGPASSWORD=postgresqlpassword" \
-e "DB_DATABASE=waxdb" \
-e "DB_USER=waxramuser" \
-e "DB_PASSWORD=waxramuserpassword" \
-v /data/sites/waxram.sentnl.io/postgresql:/var/lib/postgresql \
eosram-dex:latest
```

##  ToDo 
 - Change database name in dbapi/controller/ram.js & database setup 
 - use ENV variable to create DB for any chain
 - You will also need to change API endpoints
 - Update start.sh - only run ram_db_setup if ${DB_DATABASE} does not exist



