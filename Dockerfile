FROM nginx:alpine

COPY ./videos /usr/share/nginx/html/videos

COPY ./js /usr/share/nginx/html/js
COPY ./css /usr/share/nginx/html/css
COPY ./index.html /usr/share/nginx/html/index.html

EXPOSE 80
