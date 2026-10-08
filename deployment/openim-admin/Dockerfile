FROM openim/openim-admin-front:release-v1.8.4-patch.2 AS original
FROM python:3.12-alpine AS patch
COPY --from=original /usr/share/nginx/html /tmp/html
COPY add-email.py /tmp/add-email.py
COPY batch-users.js /tmp/html/batch-users.batch-20261008-v3.js
COPY batch-users.css /tmp/html/batch-users.batch-20261008-v3.css
RUN python /tmp/add-email.py /tmp/html
FROM openim/openim-admin-front:release-v1.8.4-patch.2
COPY --from=patch /tmp/html /usr/share/nginx/html
