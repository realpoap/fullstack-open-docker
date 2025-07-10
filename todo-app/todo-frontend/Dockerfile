# The first FROM is a stage called build-stage

FROM node:20 AS build-stage 

WORKDIR /usr/src/app

COPY . .

RUN npm ci

ENV VITE_BACKEND_URL="/api"

RUN npm run build

FROM build-stage AS test

ENV NODE_ENV=test

COPY . .

RUN npm run test

# This is a new stage, everything before this is gone, except for the files that we want to COPY

FROM nginx:1.25-alpine

# COPY the directory dist from the build-stage to /usr/share/nginx/html
# The target location here was found from the Docker hub page

COPY --from=test /usr/src/app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]