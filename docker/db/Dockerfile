FROM postgres:12-alpine

# copy initialization script over to initialize database
#COPY ./init.sh /docker-entrypoint-initdb.d/init.sh
COPY ./init.sql /docker-entrypoint-initdb.d/init.sql