FROM ubuntu:18.04

# APT ENV
ENV PACKAGES="\
  supervisor \
  nginx \
  postgresql-contrib \
  postgresql \
  postgresql-client \
  timescaledb-postgresql-12 \
  timescaledb-tools \
  sudo \
"
#tzdata
ARG DEBIAN_FRONTEND=noninteractive

ENV TZ=Europe/London

# PostgreSQL ENV
ENV PG_VERSION 12
ENV PG_BASE /var/lib/postgresql
ENV PG_PASSWORD_FILE ${PG_BASE}/pwfile
ENV PG_DATA ${PG_BASE}/${PG_VERSION}/main
ENV PG_CONFIG_DIR /etc/postgresql/${PG_VERSION}/main
ENV PG_CONFIG_FILE ${PG_CONFIG_DIR}/postgresql.conf
ENV PG_BINDIR /usr/lib/postgresql/${PG_VERSION}/bin
ENV PGUSER=postgres
ENV NODE_ENV=production


#NodeJS ENV
ENV PATH /app/node_modules/.bin:$PATH

# To prevent - Warning: apt-key output should not be parsed (stdout is not a terminal)
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=1

# Install required packages to add APT certifcate and APT REPOs
RUN apt update && apt install --no-install-recommends -y wget gnupg2 ca-certificates software-properties-common

RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -c -s)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
RUN wget --quiet --no-check-certificate -O- https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - 

# Add timescale PPA
RUN add-apt-repository -y ppa:timescale/timescaledb-ppa && \
    apt-get update

# Install nodejs seperately 
RUN wget -qO- https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs

RUN apt update && apt install --no-install-recommends -y $PACKAGES  && \
    rm -rf /var/lib/apt/lists/* && \
    apt clean


RUN rm -rf "$PG_BASE" && mkdir -p "$PG_BASE" && chown -R postgres:postgres "$PG_BASE" \
      && mkdir -p /var/run/postgresql/$PG_VERSION-main.pg_stat_tmp \
      && chown -R postgres:postgres /var/run/postgresql && chmod g+s /var/run/postgresql 

# Run timescaleDB tune
RUN timescaledb-tune --quiet --yes

WORKDIR /app


COPY backend/dbapi dbapi
COPY backend/pricescraper pricescraper
Copy frontend/express express
COPY frontend/react react

RUN mkdir -p dbapi/logs && mkdir -p pricescraper/logs && mkdir -p express/logs

# .ENV files
RUN mv dbapi/DEFAULTS.env dbapi/.env && \
    mv pricescraper/DEFAULTS.env pricescraper/.env  && \
    mv express/DEFAULTS.env express/.env  && \
    mv react/DEFAULTS.env react/.env 

## Create conf.js before build
RUN sed -E "s/(host:.).+$/\1'waxram.sentnl.io',/g" react/src/App/TVChart/api/conf.txt > react/src/App/TVChart/api/conf.js

# Install nodejs modules 
WORKDIR /app/react
RUN npm ci --silent && \
    npm install react-scripts@3.4.1 -g --silent && \
    npm run builddocker

WORKDIR /app/dbapi
RUN npm ci --silent && \
    npm install  --silent

WORKDIR /app/pricescraper
RUN npm ci --silent && \
    npm install  --silent

WORKDIR /app/express
RUN npm ci --silent && \
    npm install  --silent


# Nginx
COPY files/nginx.conf /etc/nginx/nginx.conf
COPY files/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf

# Entrypoint
ADD files/start.sh /
RUN chmod +x /start.sh
CMD /start.sh

