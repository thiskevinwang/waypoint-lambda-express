###########
# Builder #
###########
FROM public.ecr.aws/lambda/nodejs:14 as BUILDER

WORKDIR /var/task

# Copy individual files
# COPY index.js app.js db.js migration.js package*.json ./

# Copy all direct contents
ADD out ./

COPY package*.json ./

COPY migrations ./migrations/

RUN npm install npm@latest -g
RUN npm install
# TODO(kevin): compile TS here
RUN npm prune --production


###########
# Runtime #
###########
FROM public.ecr.aws/lambda/nodejs:14

# Set production node_env
ENV NODE_ENV=production

ARG VERSION
ENV VERSION=$VERSION

# LAMBDA_TASK_ROOT=/var/task
WORKDIR /var/task
COPY --from=BUILDER /var/task ./

CMD [ "index.handler" ]