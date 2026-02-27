# Nature-Forward Therapy – minimal Nginx image for SAGE/K8s
FROM nginx:alpine
RUN rm -f /usr/share/nginx/html/index.html
COPY index.html /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
