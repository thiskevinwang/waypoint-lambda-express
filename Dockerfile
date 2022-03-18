#=================================

FROM node:14-alpine as COMPILER
WORKDIR /usr/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY ./*.ts ./
RUN npm install
# output to ./out
RUN npm run build

#=================================

FROM node:14-alpine as BUILDER
WORKDIR /usr/app
# Copy the compiled files to the builder
COPY --from=COMPILER /usr/app/package*.json ./
COPY --from=COMPILER /usr/app/out ./

# Copy files/folders that aren't compiled by typescript
COPY migrations ./migrations/
COPY ./swagger.yaml ./

RUN npm install npm@latest -g
RUN npm install --only=production

#=================================

FROM public.ecr.aws/lambda/nodejs:14
ENV NODE_ENV=production
ARG VERSION
ENV VERSION=$VERSION
# LAMBDA_TASK_ROOT=/var/task
WORKDIR /var/task
COPY --from=BUILDER /usr/app ./
CMD [ "index.handler" ]