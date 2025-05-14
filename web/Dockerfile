FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy all frontend code including the public folder
COPY . .

# Build the application with disabled eslint
RUN npm run build

# Production with nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
