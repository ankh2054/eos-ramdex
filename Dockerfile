FROM ubuntu:18.04

# APT ENV
ENV PACKAGES="\
  supervisor \
  nginx \
  postgresql-contrib \
  postgresql \
  postgresql-client \
  timescaledb-postgresql-12 \
"

# PostgreSQL ENV
ENV PG_VERSION 12.3
ENV PG_BASE /var/lib/postgresql
ENV PG_PASSWORD_FILE ${PG_BASE}/pwfile
ENV PG_DATA ${PG_BASE}/${PG_VERSION}/main
ENV PG_CONFIG_DIR /etc/postgresql/${PG_VERSION}/main
ENV PG_CONFIG_FILE ${PG_CONFIG_DIR}/postgresql.conf
ENV PG_BINDIR /usr/lib/postgresql/${PG_VERSION}/bin

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

RUN apt update && apt install --no-install-recommends -y $PACKAGES  && \
    rm -rf /var/lib/apt/lists/* && \
    apt clean


RUN rm -rf "$PG_BASE" && mkdir -p "$PG_BASE" && chown -R postgres:postgres "$PG_BASE" \
      && mkdir -p /var/run/postgresql/$PG_VERSION-main.pg_stat_tmp \
      && chown -R postgres:postgres /var/run/postgresql && chmod g+s /var/run/postgresql 

RUN echo "host all  all    0.0.0.0/0  md5" >> $PG_CONFIG_DIR/pg_hba.conf \
      && echo "host all  all    ::/0  md5" >> $PG_CONFIG_DIR/pg_hba.conf \
      && echo "listen_addresses='*'" >> $PG_CONFIG_FILE


WORKDIR /app

COPY backend/dbapi dbapi
COPY backend/pricescraper pricescraper
Copy frontend/express express
COPY frontend/react react

# .ENV files
RUN mv dbapi/DEFAULTS.env dbapi/.env && \
    mv pricescraper/DEFAULTS.env pricescraper/.env  && \
    mv frontend/DEFAULTS.env frontend/.env  && \
    mv express/DEFAULTS.env express/.env  && \


WORKDIR /app/react
RUN npm ci --silent && \
    npm install react-scripts@3.4.1 -g --silent && \
    npm run build


# Nginx
COPY files/nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint
ADD files/start.sh /
RUN chmod +x /start.sh
CMD /start.sh

